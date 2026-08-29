import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminAccounts,
  adminSessions,
  clients,
  orderItems,
  orderProductionStatusHistory,
  orderStatusHistory,
  orders,
  quotationItems,
  quotations,
  sellerCommissionPayments,
  sellerCommissions,
  sellers,
} from "../drizzle/schema";
import { authenticateAdminRequest, hashPassword, logAudit } from "./admin-auth";
import { getDb } from "./db";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";
import { calculateSellerCommission } from "./sellerCommission";
import { ensureSellerCommissionForOrder } from "./sellerCommissionService";
import { publicProcedure, router } from "./_core/trpc";

const salesAdminProcedure = adminOrManusAuthProcedure.use(({ ctx, next }) => {
  const role = (ctx as any).adminUser?.role;
  if (role !== "superadmin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o Superadmin pode gerenciar vendedores e visualizar a carteira global de comissões." });
  }
  return next({ ctx });
});

const sellerProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const adminUser = await authenticateAdminRequest(ctx.req);
  if (!adminUser) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso exclusivo ao painel do vendedor." });
  }
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  const [seller] = await db
    .select({ id: sellers.id, status: sellers.status, commissionRate: sellers.commissionRate, allowStorePickupPayment: sellers.allowStorePickupPayment, name: adminAccounts.name, email: adminAccounts.email })
    .from(sellers)
    .innerJoin(adminAccounts, eq(sellers.adminAccountId, adminAccounts.id))
    .where(eq(sellers.adminAccountId, adminUser.adminId))
    .limit(1);
  if (!seller || seller.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Perfil de vendedor indisponível. Procure o administrador." });
  }
  return next({ ctx: { ...ctx, adminUser, seller } });
});

const quotationItemInput = z.object({
  productId: z.number().int().positive().nullable(),
  productName: z.string().trim().min(1).max(255),
  productImage: z.string().optional(),
  specifications: z.string().default("{}"),
  artFileUrl: z.string().optional(),
  artFileKey: z.string().optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
});

const dateFilters = z.object({
  startDate: z.number().int().positive().optional(),
  endDate: z.number().int().positive().optional(),
});

const sellerQuotationFilters = dateFilters.extend({
  search: z.string().trim().max(160).optional(),
  status: z.string().trim().max(50).optional(),
});

function money(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function newNumber(prefix: "PD" | "ORC"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
}

function discountFrom(subtotal: number, discountType: "percentual" | "fixo", discountValue: number): number {
  const raw = discountType === "percentual" ? (subtotal * discountValue) / 100 : discountValue;
  return Math.max(0, Math.min(subtotal, Math.round(raw * 100) / 100));
}

function addDateFilters(conditions: any[], field: any, input: { startDate?: number; endDate?: number }) {
  if (input.startDate) conditions.push(gte(field, new Date(input.startDate)));
  if (input.endDate) conditions.push(lte(field, new Date(input.endDate)));
}

export const sellersRouter = router({
  admin: router({
    list: salesAdminProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      return db
        .select({
          id: sellers.id,
          adminAccountId: sellers.adminAccountId,
          name: adminAccounts.name,
          email: adminAccounts.email,
          commissionRate: sellers.commissionRate,
          status: sellers.status,
          allowStorePickupPayment: sellers.allowStorePickupPayment,
          lastLogin: adminAccounts.lastLogin,
          createdAt: sellers.createdAt,
        })
        .from(sellers)
        .innerJoin(adminAccounts, eq(sellers.adminAccountId, adminAccounts.id))
        .orderBy(desc(sellers.createdAt));
    }),

    create: salesAdminProcedure
      .input(z.object({
        name: z.string().trim().min(2).max(150),
        email: z.string().trim().email().max(255),
        password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").optional(),
        commissionRate: z.number().min(0).max(100),
        allowStorePickupPayment: z.boolean().optional().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const email = input.email.toLowerCase();
        const [existing] = await db.select({ id: adminAccounts.id, role: adminAccounts.role }).from(adminAccounts).where(eq(adminAccounts.email, email)).limit(1);
        if (!existing && !input.password) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Informe uma senha inicial de pelo menos 8 caracteres para criar uma nova conta." });
        }

        const now = Date.now();
        const adminUser = (ctx as any).adminUser;
        const created = await (db as any).transaction(async (tx: any) => {
          const [existingProfile] = existing
            ? await tx.select({ id: sellers.id }).from(sellers).where(eq(sellers.adminAccountId, existing.id)).limit(1)
            : [undefined];
          if (existingProfile) {
            throw new TRPCError({ code: "CONFLICT", message: "Esta conta já está vinculada a um vendedor." });
          }
          let adminAccountId = existing?.id;
          if (existing && existing.role === "superadmin") {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Uma conta Superadmin não pode ser convertida em vendedor. Crie uma conta comercial exclusiva." });
          }
          if (!adminAccountId) {
            const [accountResult] = await tx.insert(adminAccounts).values({
              name: input.name,
              email,
              passwordHash: await hashPassword(input.password!),
              role: "seller",
              status: "active",
              createdBy: adminUser.adminId,
              createdAt: now,
              updatedAt: now,
              permissions: JSON.stringify([]),
            } as any);
            adminAccountId = Number(accountResult.insertId);
          } else {
            await tx.update(adminAccounts).set({
              name: input.name,
              role: "seller",
              status: "active",
              permissions: JSON.stringify([]),
              updatedAt: now,
            }).where(eq(adminAccounts.id, adminAccountId));
          }
          const [sellerResult] = await tx.insert(sellers).values({
            adminAccountId,
            commissionRate: input.commissionRate.toFixed(2),
            status: "active",
            allowStorePickupPayment: input.allowStorePickupPayment,
            createdByAdminId: adminUser.adminId,
            createdAt: now,
            updatedAt: now,
          } as any);
          return { sellerId: Number(sellerResult.insertId), adminAccountId, linkedExistingAccount: Boolean(existing) };
        });

        await logAudit({
          adminId: adminUser.adminId,
          adminName: adminUser.name,
          action: created.linkedExistingAccount ? "link_existing_account_to_seller" : "create_seller",
          entity: "sellers",
          entityId: String(created.sellerId),
          after: { name: input.name, email, commissionRate: input.commissionRate, linkedExistingAccount: created.linkedExistingAccount },
        });
        return { success: true, ...created };
      }),

    update: salesAdminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        name: z.string().trim().min(2).max(150).optional(),
        email: z.string().trim().email().max(255).optional(),
        password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").optional(),
        commissionRate: z.number().min(0).max(100).optional(),
        status: z.enum(["active", "inactive"]).optional(),
        allowStorePickupPayment: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const [existing] = await db.select().from(sellers).where(eq(sellers.id, input.id)).limit(1);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Vendedor não encontrado." });
        const now = Date.now();
        const sellerUpdate: Record<string, unknown> = { updatedAt: now };
        if (input.commissionRate !== undefined) sellerUpdate.commissionRate = input.commissionRate.toFixed(2);
        if (input.status !== undefined) sellerUpdate.status = input.status;
        if (input.allowStorePickupPayment !== undefined) sellerUpdate.allowStorePickupPayment = input.allowStorePickupPayment;
        const accountUpdate: Record<string, unknown> = { updatedAt: now };
        if (input.name !== undefined) accountUpdate.name = input.name;
        if (input.email !== undefined) {
          const [sameEmail] = await db.select({ id: adminAccounts.id }).from(adminAccounts)
            .where(eq(adminAccounts.email, input.email.toLowerCase())).limit(1);
          if (sameEmail && sameEmail.id !== existing.adminAccountId) {
            throw new TRPCError({ code: "CONFLICT", message: "Já existe uma conta cadastrada com este e-mail." });
          }
          accountUpdate.email = input.email.toLowerCase();
        }
        if (input.password !== undefined) accountUpdate.passwordHash = await hashPassword(input.password);
        accountUpdate.role = "seller";
        accountUpdate.permissions = JSON.stringify([]);
        if (input.status !== undefined) accountUpdate.status = input.status;

        await (db as any).transaction(async (tx: any) => {
          await tx.update(sellers).set(sellerUpdate).where(eq(sellers.id, input.id));
          await tx.update(adminAccounts).set(accountUpdate).where(eq(adminAccounts.id, existing.adminAccountId));
          if (input.password !== undefined || input.status === "inactive") {
            await tx.delete(adminSessions).where(eq(adminSessions.adminId, existing.adminAccountId));
          }
        });
        const adminUser = (ctx as any).adminUser;
        await logAudit({
          adminId: adminUser.adminId,
          adminName: adminUser.name,
          action: "update_seller",
          entity: "sellers",
          entityId: String(input.id),
          before: { commissionRate: existing.commissionRate, status: existing.status },
          after: input,
        });
        return { success: true };
      }),

    delete: salesAdminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const [seller] = await db.select().from(sellers).where(eq(sellers.id, input.id)).limit(1);
        if (!seller) throw new TRPCError({ code: "NOT_FOUND", message: "Vendedor não encontrado." });
        const [commission] = await db.select({ id: sellerCommissions.id }).from(sellerCommissions)
          .where(eq(sellerCommissions.sellerId, seller.id)).limit(1);
        if (commission) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este vendedor possui comissões registradas. Desative-o para preservar o histórico financeiro." });
        }
        await (db as any).transaction(async (tx: any) => {
          await tx.update(orders).set({ sellerId: null, updatedAt: new Date() }).where(eq(orders.sellerId, seller.id));
          await tx.update(quotations).set({ sellerId: null, updatedAt: new Date() }).where(eq(quotations.sellerId, seller.id));
          await tx.delete(adminSessions).where(eq(adminSessions.adminId, seller.adminAccountId));
          await tx.delete(sellers).where(eq(sellers.id, seller.id));
          await tx.delete(adminAccounts).where(eq(adminAccounts.id, seller.adminAccountId));
        });
        const adminUser = (ctx as any).adminUser;
        await logAudit({ adminId: adminUser.adminId, adminName: adminUser.name, action: "delete_seller", entity: "sellers", entityId: String(seller.id), before: { adminAccountId: seller.adminAccountId, status: seller.status }, after: { permanentlyDeletedAt: Date.now() } });
        return { success: true };
      }),

    listCommissions: salesAdminProcedure
      .input(z.object({ sellerId: z.number().int().positive().optional(), status: z.enum(["prevista", "a_pagar", "paga", "cancelada"]).optional() }).merge(dateFilters))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const conditions: any[] = [];
        if (input.sellerId) conditions.push(eq(sellerCommissions.sellerId, input.sellerId));
        if (input.status) conditions.push(eq(sellerCommissions.status, input.status));
        addDateFilters(conditions, sellerCommissions.createdAt, input);
        return db
          .select({
            id: sellerCommissions.id,
            orderId: sellerCommissions.orderId,
            sellerId: sellerCommissions.sellerId,
            sellerName: sellerCommissions.sellerNameSnapshot,
            orderNumber: sellerCommissions.orderNumberSnapshot,
            subtotal: sellerCommissions.subtotalSnapshot,
            discountAmount: sellerCommissions.discountAmountSnapshot,
            baseAmount: sellerCommissions.commissionBaseAmount,
            rate: sellerCommissions.commissionRateSnapshot,
            amount: sellerCommissions.commissionAmount,
            source: sellerCommissions.source,
            status: sellerCommissions.status,
            eligibleAt: sellerCommissions.eligibleAt,
            paidAt: sellerCommissions.paidAt,
            createdAt: sellerCommissions.createdAt,
            orderStatus: orders.status,
            paymentStatus: orders.paymentStatus,
          })
          .from(sellerCommissions)
          .innerJoin(orders, eq(sellerCommissions.orderId, orders.id))
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(sellerCommissions.createdAt));
      }),

    commissionSummary: salesAdminProcedure.input(dateFilters).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const conditions: any[] = [];
      addDateFilters(conditions, sellerCommissions.createdAt, input);
      const rows = await db.select({ status: sellerCommissions.status, amount: sellerCommissions.commissionAmount })
        .from(sellerCommissions).where(conditions.length ? and(...conditions) : undefined);
      return rows.reduce((summary: Record<string, number>, row: any) => {
        summary[row.status] = (summary[row.status] ?? 0) + money(row.amount);
        return summary;
      }, { prevista: 0, a_pagar: 0, paga: 0, cancelada: 0 });
    }),

    assignOrder: salesAdminProcedure
      .input(z.object({ orderId: z.number().int().positive(), sellerId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
        const [seller] = await db.select().from(sellers).where(and(eq(sellers.id, input.sellerId), eq(sellers.status, "active"))).limit(1);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
        if (!seller) throw new TRPCError({ code: "NOT_FOUND", message: "Vendedor ativo não encontrado." });
        const [commission] = await db.select({ id: sellerCommissions.id }).from(sellerCommissions).where(eq(sellerCommissions.orderId, input.orderId)).limit(1);
        if (commission) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este pedido já possui uma comissão registrada e não pode ser redistribuído." });

        await (db as any).transaction(async (tx: any) => {
          await tx.update(orders).set({ sellerId: input.sellerId, updatedAt: new Date() }).where(eq(orders.id, input.orderId));
          await ensureSellerCommissionForOrder(tx, input.orderId, { source: "admin_assignment" });
        });
        const adminUser = (ctx as any).adminUser;
        await logAudit({ adminId: adminUser.adminId, adminName: adminUser.name, action: "assign_seller_to_order", entity: "orders", entityId: String(input.orderId), after: input });
        return { success: true };
      }),

    markCommissionPaid: salesAdminProcedure
      .input(z.object({
        commissionId: z.number().int().positive(),
        paidAt: z.number().int().positive().optional(),
        note: z.string().trim().max(1500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const paidAt = input.paidAt ?? Date.now();
        const adminUser = (ctx as any).adminUser;
        const result = await (db as any).transaction(async (tx: any) => {
          const [commission] = await tx.select().from(sellerCommissions).where(eq(sellerCommissions.id, input.commissionId)).limit(1);
          if (!commission) throw new TRPCError({ code: "NOT_FOUND", message: "Comissão não encontrada." });
          if (commission.status === "paga") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Esta comissão já foi registrada como paga." });
          if (commission.status !== "a_pagar") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A comissão só pode ser paga após a confirmação do pagamento do pedido." });
          const now = Date.now();
          await tx.update(sellerCommissions)
            .set({ status: "paga", paidAt, updatedAt: now })
            .where(and(eq(sellerCommissions.id, commission.id), eq(sellerCommissions.status, "a_pagar")));
          await tx.insert(sellerCommissionPayments).values({
            commissionId: commission.id,
            sellerId: commission.sellerId,
            amount: commission.commissionAmount,
            paidAt,
            note: input.note || null,
            paidByAdminId: adminUser.adminId,
            paidByAdminName: adminUser.name,
            createdAt: now,
          } as any);
          return { amount: money(commission.commissionAmount), sellerId: commission.sellerId };
        });
        await logAudit({ adminId: adminUser.adminId, adminName: adminUser.name, action: "mark_seller_commission_paid", entity: "sellerCommissions", entityId: String(input.commissionId), after: { paidAt, note: input.note } });
        return { success: true, ...result };
      }),

    paymentHistory: salesAdminProcedure
      .input(z.object({ commissionId: z.number().int().positive().optional(), sellerId: z.number().int().positive().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const conditions: any[] = [];
        if (input.commissionId) conditions.push(eq(sellerCommissionPayments.commissionId, input.commissionId));
        if (input.sellerId) conditions.push(eq(sellerCommissionPayments.sellerId, input.sellerId));
        return db.select().from(sellerCommissionPayments).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(sellerCommissionPayments.paidAt));
      }),
  }),

  seller: router({
    me: sellerProcedure.query(({ ctx }) => (ctx as any).seller),

    clients: sellerProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      return db.select({ id: clients.id, name: clients.name, email: clients.email, phone: clients.phone, whatsapp: clients.whatsapp })
        .from(clients).where(eq(clients.isActive, true)).orderBy(clients.name).limit(500);
    }),

    orders: sellerProcedure.input(dateFilters).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const seller = (ctx as any).seller;
      const conditions: any[] = [eq(orders.sellerId, seller.id)];
      addDateFilters(conditions, orders.createdAt, input);
      return db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        total: orders.totalPrice,
        shippingPrice: orders.shippingPrice,
        createdAt: orders.createdAt,
        clientName: sql<string>`COALESCE(${clients.name}, ${orders.guestName}, ${orders.deliveryFullName}, 'Cliente')`,
        customerEmail: orders.guestEmail,
        commissionAmount: sellerCommissions.commissionAmount,
        commissionStatus: sellerCommissions.status,
      }).from(orders)
        .leftJoin(clients, eq(orders.clientId, clients.id))
        .leftJoin(sellerCommissions, eq(sellerCommissions.orderId, orders.id))
        .where(and(...conditions)).orderBy(desc(orders.createdAt));
    }),

    orderDetail: sellerProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const seller = (ctx as any).seller;
      const [order] = await db.select().from(orders)
        .where(and(eq(orders.id, input.id), eq(orders.sellerId, seller.id))).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado na sua carteira." });

      const itemRows = await db.execute(
        sql`SELECT oi.*, p.imageUrl as productImage FROM orderItems oi LEFT JOIN products p ON oi.productId = p.id WHERE oi.orderId = ${order.id}`
      ) as any;
      const items = (itemRows[0] ?? []) as any[];

      let customerData: any = null;
      if ((order as any).customerId) {
        const customerRows = await db.execute(sql`SELECT
          ca.id, ca.firstName, ca.lastName, ca.email, ca.phone, ca.cpfCnpj,
          COALESCE(addr.fullName, CONCAT(ca.firstName, ' ', ca.lastName)) as addrFullName,
          COALESCE(addr.phone, ca.phone) as addrPhone,
          COALESCE(addr.street, ca.addressStreet) as street,
          COALESCE(addr.number, ca.addressNumber) as number,
          COALESCE(addr.complement, ca.addressComplement) as complement,
          COALESCE(addr.neighborhood, ca.addressNeighborhood) as neighborhood,
          COALESCE(addr.city, ca.addressCity) as city,
          COALESCE(addr.state, ca.addressState) as state,
          COALESCE(addr.zipCode, ca.addressZipCode) as zipCode
          FROM customer_accounts ca LEFT JOIN customerAddresses addr ON addr.userId = ca.id AND addr.isDefault = 1
          WHERE ca.id = ${(order as any).customerId} LIMIT 1`) as any;
        customerData = (customerRows[0] ?? [])[0] ?? null;
      }

      return { ...order, items, customerData };
    }),

    orderHistory: sellerProcedure.input(z.object({ orderId: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const seller = (ctx as any).seller;
      const [order] = await db.select({ id: orders.id }).from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id))).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado na sua carteira." });
      return db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, order.id)).orderBy(desc(orderStatusHistory.createdAt));
    }),

    productionHistory: sellerProcedure.input(z.object({ orderId: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const seller = (ctx as any).seller;
      const [order] = await db.select({ id: orders.id, orderNumber: orders.orderNumber, deliveryFullName: orders.deliveryFullName }).from(orders)
        .where(and(eq(orders.id, input.orderId), eq(orders.sellerId, seller.id))).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado na sua carteira." });
      return db.select({
        id: orderProductionStatusHistory.id,
        orderId: orderProductionStatusHistory.orderId,
        previousStatus: orderProductionStatusHistory.previousStatus,
        newStatus: orderProductionStatusHistory.newStatus,
        changedBy: orderProductionStatusHistory.changedBy,
        changedByName: orderProductionStatusHistory.changedByName,
        notes: orderProductionStatusHistory.notes,
        createdAt: orderProductionStatusHistory.createdAt,
        orderNumber: orders.orderNumber,
        deliveryFullName: orders.deliveryFullName,
      }).from(orderProductionStatusHistory).leftJoin(orders, eq(orderProductionStatusHistory.orderId, orders.id))
        .where(eq(orderProductionStatusHistory.orderId, order.id)).orderBy(desc(orderProductionStatusHistory.createdAt));
    }),

    quotations: sellerProcedure.input(sellerQuotationFilters).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const seller = (ctx as any).seller;
      const conditions: any[] = [eq(quotations.sellerId, seller.id)];
      addDateFilters(conditions, quotations.createdAt, input);
      if (input.status) conditions.push(eq(quotations.status, input.status as any));
      if (input.search) {
        conditions.push(or(
          like(quotations.quotationNumber, `%${input.search}%`),
          like(clients.name, `%${input.search}%`),
          like(clients.email, `%${input.search}%`),
        ));
      }

      const rows = await db.select({
        id: quotations.id,
        quotationNumber: quotations.quotationNumber,
        status: quotations.status,
        subtotal: quotations.subtotal,
        discountAmount: quotations.discountAmount,
        shippingPrice: quotations.shippingPrice,
        total: quotations.total,
        createdAt: quotations.createdAt,
        expiresAt: quotations.expiresAt,
        sentAt: quotations.sentAt,
        approvedAt: quotations.approvedAt,
        paymentMethod: quotations.paymentMethod,
        productionDeadline: quotations.productionDeadline,
        quotationValidity: quotations.quotationValidity,
        convertedOrderId: quotations.convertedOrderId,
        clientName: clients.name,
        clientEmail: clients.email,
        clientPhone: clients.phone,
      }).from(quotations).leftJoin(clients, eq(quotations.clientId, clients.id)).where(and(...conditions)).orderBy(desc(quotations.createdAt));

      const kpiConditions: any[] = [eq(quotations.sellerId, seller.id)];
      addDateFilters(kpiConditions, quotations.createdAt, input);
      const kpiRows = await db.select({ status: quotations.status, convertedOrderId: quotations.convertedOrderId })
        .from(quotations).where(and(...kpiConditions));
      const kpis = kpiRows.reduce((summary: { rascunhos: number; enviados: number; emNegociacao: number; aprovados: number; convertidos: number; totalAtivos: number }, row: any) => {
        summary.totalAtivos += 1;
        if (row.status === "rascunho") summary.rascunhos += 1;
        if (row.status === "enviado") summary.enviados += 1;
        if (row.status === "em_negociacao") summary.emNegociacao += 1;
        if (row.status === "aprovado") summary.aprovados += 1;
        if (row.convertedOrderId) summary.convertidos += 1;
        return summary;
      }, { rascunhos: 0, enviados: 0, emNegociacao: 0, aprovados: 0, convertidos: 0, totalAtivos: 0 });

      return { rows, kpis, total: kpis.totalAtivos };
    }),

    commissions: sellerProcedure.input(z.object({ status: z.enum(["prevista", "a_pagar", "paga", "cancelada"]).optional() }).merge(dateFilters)).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const seller = (ctx as any).seller;
      const conditions: any[] = [eq(sellerCommissions.sellerId, seller.id)];
      if (input.status) conditions.push(eq(sellerCommissions.status, input.status));
      addDateFilters(conditions, sellerCommissions.createdAt, input);
      return db.select({
        id: sellerCommissions.id,
        orderNumber: sellerCommissions.orderNumberSnapshot,
        subtotal: sellerCommissions.subtotalSnapshot,
        discountAmount: sellerCommissions.discountAmountSnapshot,
        baseAmount: sellerCommissions.commissionBaseAmount,
        rate: sellerCommissions.commissionRateSnapshot,
        amount: sellerCommissions.commissionAmount,
        status: sellerCommissions.status,
        eligibleAt: sellerCommissions.eligibleAt,
        paidAt: sellerCommissions.paidAt,
        createdAt: sellerCommissions.createdAt,
      }).from(sellerCommissions).where(and(...conditions)).orderBy(desc(sellerCommissions.createdAt));
    }),

    summary: sellerProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const seller = (ctx as any).seller;
      const rows = await db.select({ status: sellerCommissions.status, amount: sellerCommissions.commissionAmount })
        .from(sellerCommissions).where(eq(sellerCommissions.sellerId, seller.id));
      return rows.reduce((summary: Record<string, number>, row: any) => {
        summary[row.status] = (summary[row.status] ?? 0) + money(row.amount);
        return summary;
      }, { prevista: 0, a_pagar: 0, paga: 0, cancelada: 0 });
    }),

    createQuotation: sellerProcedure
      .input(z.object({
        clientId: z.number().int().positive(),
        items: z.array(quotationItemInput).min(1),
        discountType: z.enum(["percentual", "fixo"]).default("fixo"),
        discountValue: z.number().min(0).default(0),
        shippingPrice: z.number().min(0).default(0),
        paymentMethod: z.string().max(50).optional(),
        productionDeadline: z.number().int().min(0).default(0),
        quotationValidity: z.number().int().min(1).max(365).default(30),
        commercialNotes: z.string().max(10000).optional(),
        saveAsDraft: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const seller = (ctx as any).seller;
        const [client] = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, input.clientId), eq(clients.isActive, true))).limit(1);
        if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente ativo não encontrado." });
        const subtotal = input.items.reduce((total, item) => total + item.totalPrice, 0);
        const discountAmount = discountFrom(subtotal, input.discountType, input.discountValue);
        const total = Math.max(0, subtotal - discountAmount + input.shippingPrice);
        const quotationNumber = newNumber("ORC");
        const now = new Date();
        const [result] = await (db as any).transaction(async (tx: any) => {
          const inserted = await tx.insert(quotations).values({
            quotationNumber,
            clientId: input.clientId,
            operatorId: (ctx as any).adminUser.adminId,
            sellerId: seller.id,
            responsibleName: seller.name,
            status: input.saveAsDraft ? "rascunho" : "enviado",
            subtotal: subtotal.toFixed(2),
            discountType: input.discountType,
            discountValue: input.discountValue.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            shippingPrice: input.shippingPrice.toFixed(2),
            total: total.toFixed(2),
            paymentMethod: input.paymentMethod ?? null,
            productionDeadline: input.productionDeadline,
            quotationValidity: input.quotationValidity,
            commercialNotes: input.commercialNotes ?? null,
            itemsSnapshot: JSON.stringify(input.items),
            expiresAt: new Date(Date.now() + input.quotationValidity * 24 * 60 * 60 * 1000),
            sentAt: input.saveAsDraft ? null : now,
          } as any);
          const quotationId = Number(inserted[0]?.insertId ?? inserted.insertId);
          for (const item of input.items) {
            await tx.insert(quotationItems).values({ quotationId, ...item, unitPrice: item.unitPrice.toFixed(2), totalPrice: item.totalPrice.toFixed(2) } as any);
          }
          return [{ quotationId }];
        });
        return { success: true, quotationId: result.quotationId, quotationNumber };
      }),

    createOrder: sellerProcedure
      .input(z.object({
        clientId: z.number().int().positive(),
        items: z.array(quotationItemInput).min(1),
        discountAmount: z.number().min(0).default(0),
        shippingPrice: z.number().min(0).default(0),
        paymentMethod: z.string().max(50).optional(),
        notes: z.string().max(10000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
        const seller = (ctx as any).seller;
        const [client] = await db.select().from(clients).where(and(eq(clients.id, input.clientId), eq(clients.isActive, true))).limit(1);
        if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente ativo não encontrado." });
        const subtotal = input.items.reduce((total, item) => total + item.totalPrice, 0);
        const commission = calculateSellerCommission({ subtotal, discountAmount: input.discountAmount, commissionRate: money(seller.commissionRate) });
        const orderNumber = newNumber("PD");
        const total = commission.baseAmount + input.shippingPrice;
        const orderId = await (db as any).transaction(async (tx: any) => {
          const [orderResult] = await tx.insert(orders).values({
            clientId: input.clientId,
            userId: (ctx as any).adminUser.adminId,
            sellerId: seller.id,
            orderNumber,
            status: "analisando",
            totalPrice: total.toFixed(2),
            paymentStatus: "pendente",
            paymentMethod: input.paymentMethod ?? null,
            notes: input.notes ?? null,
            deliveryFullName: client.name,
            deliveryPhone: client.phone ?? client.whatsapp ?? null,
            shippingPrice: input.shippingPrice.toFixed(2),
          } as any);
          const createdOrderId = Number(orderResult.insertId);
          for (const item of input.items) {
            await tx.insert(orderItems).values({
              orderId: createdOrderId,
              productId: item.productId,
              productName: item.productName,
              quantity: Math.round(item.quantity),
              priceAtOrder: item.unitPrice.toFixed(2),
              selectedAttributes: item.specifications,
              artFileUrl: item.artFileUrl ?? null,
            } as any);
          }
          await ensureSellerCommissionForOrder(tx, createdOrderId, { source: "seller_order", discountAmount: commission.discountAmount });
          return createdOrderId;
        });
        return { success: true, orderId, orderNumber };
      }),
  }),
});
