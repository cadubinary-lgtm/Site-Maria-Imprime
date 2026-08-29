/**
 * GERENCIADOR FINANCEIRO - Router Completo
 * Extensão independente — lê dados existentes, usa tabelas próprias
 * Não altera nenhuma tabela existente do sistema
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";
import { getDb } from "./db";
import { logAudit } from "./admin-auth";
import {
  orders,
  financeiro,
  financeiroNotificacoes,
  cashFlowEntries,
  orderItems,
  orderStatusHistory,
  orderProductionStatusHistory,
  orderArtPreviews,
  productionJobs,
  financialRecords,
  fileValidations,
  automationLogs,
  shipments,
  fiscalNotes,
  orderPayments,
  emailHistory,
  deletedReceivedAccounts,
  deletedReceipts,
  paymentReceipts,
  standaloneReceipts,
  standaloneReceiptItems,
  productionStatusHistory,
} from "../drizzle/schema";
import { eq, ne, and, gte, lte, lt, desc, sql, or, like, isNull, isNotNull, inArray } from "drizzle-orm";
import { sendPaymentReceiptEmail, sendStandaloneReceiptEmail } from "./emailService";
import { ensurePaymentReceipt } from "./payment-receipts";
import { randomUUID } from "node:crypto";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapOrderToFinanceiro(order: any) {
  const isPickup =
    order.shippingMethod === "pickup" ||
    order.shippingMethod === "retirada" ||
    order.shippingMethod === "pagamento_retirada";

  const isPayOnPickup =
    order.paymentMethod === "pagar_na_retirada" ||
    order.paymentMethod === "pagamento_retirada" ||
    order.status === "pagamento_retirada";

  let status: string;
  if (order.paymentStatus === "pago" || order.status === "entregue") {
    status = "pago";
  } else if (isPickup && isPayOnPickup) {
    if (order.status === "pronto_retirada" || order.status === "pronto_entrega") {
      status = "pronto_retirada";
    } else {
      status = "aguardando_producao";
    }
  } else {
    status = "a_receber";
  }

  return {
    pedidoId: order.id,
    orderNumber: order.orderNumber,
    cliente: order.guestName || order.deliveryFullName || "Cliente",
    telefone: order.deliveryPhone || order.guestEmail || "",
    email: order.guestEmail || "",
    valor: order.totalPrice,
    formaPagamento: mapPaymentMethod(order.paymentMethod),
    formaEntrega: mapShippingMethod(order.shippingMethod),
    status,
    isPickupPayment: isPickup && isPayOnPickup,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

function requireFinanceAdmin(ctx: any) {
  const adminUser = ctx.adminUser;
  if (!adminUser) {
    throw new TRPCError({ code: "FORBIDDEN", message: "É necessário estar autenticado como administrador para acessar a lixeira financeira." });
  }
  return adminUser;
}

function requireReceiptsSuperadmin(ctx: any) {
  const adminUser = requireFinanceAdmin(ctx);
  if (adminUser.role !== "superadmin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Superadmin pode excluir recibos permanentemente." });
  }
  return adminUser;
}

function mapPaymentMethod(method: string | null): string {
  if (!method) return "outro";
  const map: Record<string, string> = {
    pix: "pix",
    cartao_credito: "cartao_credito",
    cartao_debito: "cartao_debito",
    dinheiro: "dinheiro",
    boleto: "boleto",
    transferencia: "transferencia",
    pagar_na_retirada: "pagar_na_retirada",
    pagamento_retirada: "pagar_na_retirada",
  };
  return map[method] ?? "outro";
}

function mapShippingMethod(method: string | null): string {
  if (!method) return "outro";
  if (method === "pickup" || method === "retirada" || method === "pagamento_retirada") return "retirada_loja";
  if (method === "moto_express") return "moto_express";
  if (method.startsWith("carrier_")) return "transportadora";
  if (method === "correios") return "correios";
  return "outro";
}

const RECEIPT_PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  transferencia: "Transferência",
  boleto: "Boleto",
  pagar_na_retirada: "Pagamento na retirada",
  outro: "Outro",
};

function formatReceiptCurrency(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function formatReceiptDate(value: number) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

const standaloneReceiptItemSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição do item.").max(255),
  quantity: z.number().int().positive("A quantidade deve ser maior que zero."),
  unitPrice: z.number().finite().nonnegative("O valor unitário não pode ser negativo."),
});

const standaloneReceiptSchema = z.object({
  customerName: z.string().trim().min(2, "Informe o nome do cliente.").max(255),
  customerDocument: z.string().trim().max(30).optional(),
  customerEmail: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
  customerPhone: z.string().trim().max(30).optional(),
  paymentMethod: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito", "transferencia", "boleto", "pagar_na_retirada", "outro"]),
  paidAt: z.number().int().positive().optional(),
  discount: z.number().finite().nonnegative().default(0),
  notes: z.string().trim().max(2000).optional(),
  items: z.array(standaloneReceiptItemSchema).min(1, "Inclua ao menos um item no recibo."),
});

function isUnavailableProductionStorage(error: unknown) {
  const candidate = error as { code?: string; errno?: number; message?: string; cause?: { message?: string } };
  const message = `${candidate?.message ?? ""} ${candidate?.cause?.message ?? ""}`;
  return candidate?.code === "ER_NO_SUCH_TABLE"
    || candidate?.errno === 1146
    || /production(Job|StatusHistory)/i.test(message) && /doesn't exist|unknown table|not found/i.test(message);
}

async function deleteProductionDependenciesForOrder(db: any, orderId: number) {
  await db.delete(orderProductionStatusHistory)
    .where(eq(orderProductionStatusHistory.orderId, orderId));

  let productionJobRows: Array<{ id: number }>;
  try {
    productionJobRows = await db
      .select({ id: productionJobs.id })
      .from(productionJobs)
      .where(eq(productionJobs.orderId, orderId));
  } catch (error) {
    if (isUnavailableProductionStorage(error)) return;
    throw error;
  }
  const productionJobIds = productionJobRows.map((job: { id: number }) => job.id);

  if (productionJobIds.length > 0) {
    try {
      await db.delete(productionStatusHistory)
        .where(inArray(productionStatusHistory.productionJobId, productionJobIds));
    } catch (error) {
      if (!isUnavailableProductionStorage(error)) throw error;
    }
  }

  try {
    await db.delete(productionJobs).where(eq(productionJobs.orderId, orderId));
  } catch (error) {
    if (!isUnavailableProductionStorage(error)) throw error;
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const financeiroRouter = router({

  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard: adminOrManusAuthProcedure
    .input(z.object({
      periodo: z.enum(["hoje", "semana", "mes", "ano", "custom"]).default("mes"),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      let start: Date;
      let end: Date = now;

      switch (input.periodo) {
        case "hoje":
          start = new Date(now); start.setHours(0, 0, 0, 0);
          break;
        case "semana":
          start = new Date(now); start.setDate(now.getDate() - 7);
          break;
        case "ano":
          start = new Date(now.getFullYear(), 0, 1);
          break;
        case "custom":
          start = input.startDate ? new Date(input.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
          end = input.endDate ? new Date(input.endDate) : now;
          break;
        default: // mes
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const allOrders = await db
        .select()
        .from(orders)
        .where(and(
          gte(orders.createdAt, start),
          lte(orders.createdAt, end)
        ));

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayOrders = await db.select().from(orders)
        .where(gte(orders.createdAt, todayStart));

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthOrders = await db.select().from(orders)
        .where(gte(orders.createdAt, monthStart));

      // Totais
      const totalRecebidoHoje = todayOrders
        .filter(o => o.paymentStatus === "pago")
        .reduce((s, o) => s + parseFloat(o.totalPrice || "0"), 0);

      const totalRecebidoMes = monthOrders
        .filter(o => o.paymentStatus === "pago")
        .reduce((s, o) => s + parseFloat(o.totalPrice || "0"), 0);

      const totalPendente = allOrders
        .filter(o => o.paymentStatus === "pendente" && o.status !== "cancelado")
        .reduce((s, o) => s + parseFloat(o.totalPrice || "0"), 0);

      const pedidosPagos = allOrders.filter(o => o.paymentStatus === "pago");
      const pedidosPendentes = allOrders.filter(o => o.paymentStatus === "pendente" && o.status !== "cancelado");

      const aguardandoRetirada = allOrders.filter(o =>
        (o.shippingMethod === "pickup" || o.shippingMethod === "retirada") &&
        (o.status === "pronto_retirada" || o.status === "pronto_entrega")
      );

      const ticketMedio = pedidosPagos.length > 0
        ? pedidosPagos.reduce((s, o) => s + parseFloat(o.totalPrice || "0"), 0) / pedidosPagos.length
        : 0;

      // Evolução mensal (últimos 6 meses)
      const evolucao: { mes: string; receita: number; pedidos: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const mOrders = allOrders.filter(o =>
          new Date(o.createdAt) >= mStart && new Date(o.createdAt) <= mEnd
        );
        evolucao.push({
          mes: mStart.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
          receita: mOrders.filter(o => o.paymentStatus === "pago")
            .reduce((s, o) => s + parseFloat(o.totalPrice || "0"), 0),
          pedidos: mOrders.length,
        });
      }

      // Vendas por segmento (via orderItems → products)
      const segmentMap: Record<string, number> = {};
      for (const o of allOrders.filter(o => o.paymentStatus === "pago")) {
        const seg = "Geral"; // simplificado — sem join pesado
        segmentMap[seg] = (segmentMap[seg] || 0) + parseFloat(o.totalPrice || "0");
      }

      return {
        totalRecebidoHoje,
        totalRecebidoMes,
        totalPendente,
        aguardandoRetirada: aguardandoRetirada.length,
        ticketMedio,
        pedidosPagos: pedidosPagos.length,
        pedidosPendentes: pedidosPendentes.length,
        evolucaoMensal: evolucao,
        vendasPorSegmento: Object.entries(segmentMap).map(([seg, val]) => ({ segmento: seg, valor: val })),
      };
    }),

  // ── Contas a Receber ────────────────────────────────────────────────────────
  getContasReceber: adminOrManusAuthProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      formaPagamento: z.string().optional(),
      status: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Contas a receber: pedidos com pagamento pendente OU pedidos com pagamento na retirada
      const baseCondition = or(
        eq(orders.paymentStatus, "pendente"),
        eq(orders.paymentMethod, "pagar_na_retirada")
      );

      const conditions: any[] = [baseCondition!];
      const deletedRows = await db.select({ orderId: deletedReceivedAccounts.orderId }).from(deletedReceivedAccounts);
      const deletedOrderIds = deletedRows.map((row) => row.orderId);

      if (input.startDate) conditions.push(gte(orders.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(orders.createdAt, new Date(input.endDate)));
      if (input.search) {
        conditions.push(or(
          like(orders.guestName, `%${input.search}%`),
          like(orders.orderNumber, `%${input.search}%`),
          like(orders.guestEmail, `%${input.search}%`)
        ));
      }
      if (input.formaPagamento) conditions.push(eq(orders.paymentMethod, input.formaPagamento));

      // Todos os filtros e paginação acontecem no banco: evita carregar a base inteira em memória.
      conditions.push(ne(orders.status, "cancelado"));
      conditions.push(or(
        ne(orders.paymentStatus, "pago"),
        eq(orders.paymentMethod, "pagar_na_retirada")
      )!);
      if (deletedOrderIds.length) {
        conditions.push(sql`${orders.id} NOT IN (${sql.join(deletedOrderIds.map((id) => sql`${id}`), sql`, `)})`);
      }
      const whereClause = and(...conditions);
      const offset = (input.page - 1) * input.limit;
      const [summary] = await db
        .select({ total: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause);
      const paginated = await db.select().from(orders)
        .where(whereClause)
        .orderBy(desc(orders.updatedAt))
        .limit(input.limit)
        .offset(offset);
      const total = Number(summary?.total ?? 0);
      return {
        data: paginated.map(mapOrderToFinanceiro),
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // ── Contas Recebidas ────────────────────────────────────────────────────────
  getContasRecebidas: adminOrManusAuthProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      periodo: z.enum(["dia", "semana", "mes", "ano"]).default("mes"),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      search: z.string().trim().max(255).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      let start: Date;
      switch (input.periodo) {
        case "dia": start = new Date(now); start.setHours(0, 0, 0, 0); break;
        case "semana": start = new Date(now); start.setDate(now.getDate() - 7); break;
        case "ano": start = new Date(now.getFullYear(), 0, 1); break;
        default: start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const startDate = input.startDate ? new Date(input.startDate) : start;
      const endDate = input.endDate ? new Date(input.endDate) : now;

      const deletedRows = await db.select({ orderId: deletedReceivedAccounts.orderId }).from(deletedReceivedAccounts);
      const deletedOrderIds = deletedRows.map((row) => row.orderId);
      const conditions: any[] = [
        eq(orders.paymentStatus, "pago"),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
      ];
      if (input.search) {
        conditions.push(or(
          like(orders.orderNumber, `%${input.search}%`),
          like(orders.guestName, `%${input.search}%`),
          like(orders.deliveryFullName, `%${input.search}%`),
          like(orders.guestEmail, `%${input.search}%`),
        ));
      }
      if (deletedOrderIds.length) conditions.push(sql`${orders.id} NOT IN (${sql.join(deletedOrderIds.map((id) => sql`${id}`), sql`, `)})`);
      const whereClause = and(...conditions);
      const offset = (input.page - 1) * input.limit;
      const [summary] = await db
        .select({
          total: sql<number>`count(*)`,
          totalValor: sql<string>`coalesce(sum(${orders.totalPrice}), 0)`,
        })
        .from(orders)
        .where(whereClause);
      const paginated = await db.select().from(orders)
        .where(whereClause)
        .orderBy(desc(orders.updatedAt))
        .limit(input.limit)
        .offset(offset);
      const receiptRows = paginated.length > 0
        ? await db.select({
            orderId: paymentReceipts.orderId,
            receiptId: paymentReceipts.id,
            receiptNumber: paymentReceipts.receiptNumber,
          })
            .from(paymentReceipts)
            .where(inArray(paymentReceipts.orderId, paginated.map((order) => order.id)))
        : [];
      const receiptByOrderId = new Map(receiptRows.map((receipt) => [receipt.orderId, receipt]));
      const total = Number(summary?.total ?? 0);
      const totalValor = Number(summary?.totalValor ?? 0);

      return {
        data: paginated.map((order) => ({
          ...mapOrderToFinanceiro(order),
          receiptId: receiptByOrderId.get(order.id)?.receiptId ?? null,
          receiptNumber: receiptByOrderId.get(order.id)?.receiptNumber ?? null,
        })),
        total,
        totalValor,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Move um recebimento para a lixeira sem apagar o pedido ou suas dependências.
  moveContaRecebidaToTrash: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive(), reason: z.string().trim().min(3, "Informe um motivo com pelo menos 3 caracteres.").max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = requireFinanceAdmin(ctx);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Recebimento não encontrado." });

      const existingTrashItem = await db.select({ id: deletedReceivedAccounts.id })
        .from(deletedReceivedAccounts)
        .where(eq(deletedReceivedAccounts.orderId, input.orderId))
        .limit(1);
      if (existingTrashItem.length) {
        throw new TRPCError({ code: "CONFLICT", message: "Este recebimento já está na lixeira." });
      }

      await db.insert(deletedReceivedAccounts).values({
        orderId: input.orderId,
        deletedByAdminId: adminUser.adminId,
        deletedByAdminName: adminUser.name,
        deletionReason: input.reason,
        deletedAt: Date.now(),
      });

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "move_receivable_account_to_trash",
        entity: "deletedReceivedAccounts",
        entityId: String(input.orderId),
        before: { orderNumber: order.orderNumber, totalPrice: order.totalPrice, paymentStatus: order.paymentStatus },
        after: { deletionReason: input.reason },
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  listDeletedContasRecebidas: adminOrManusAuthProcedure
    .query(async ({ ctx }) => {
      requireFinanceAdmin(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const rows = await db.select({
        trashId: deletedReceivedAccounts.id,
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        cliente: orders.guestName,
        deliveryFullName: orders.deliveryFullName,
        valor: orders.totalPrice,
        paymentStatus: orders.paymentStatus,
        paymentMethod: orders.paymentMethod,
        deletedAt: deletedReceivedAccounts.deletedAt,
        deletedByAdminId: deletedReceivedAccounts.deletedByAdminId,
        deletedByAdminName: deletedReceivedAccounts.deletedByAdminName,
        deletionReason: deletedReceivedAccounts.deletionReason,
      })
        .from(deletedReceivedAccounts)
        .innerJoin(orders, eq(deletedReceivedAccounts.orderId, orders.id))
        .orderBy(desc(deletedReceivedAccounts.deletedAt));

      return rows.map((row) => ({ ...row, cliente: row.cliente || row.deliveryFullName || "Cliente" }));
    }),

  restoreContaRecebida: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = requireFinanceAdmin(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const [trashItem] = await db.select().from(deletedReceivedAccounts)
        .where(eq(deletedReceivedAccounts.orderId, input.orderId))
        .limit(1);
      if (!trashItem) throw new TRPCError({ code: "NOT_FOUND", message: "Este recebimento não está na lixeira." });

      await db.delete(deletedReceivedAccounts).where(eq(deletedReceivedAccounts.orderId, input.orderId));
      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "restore_received_account",
        entity: "deletedReceivedAccounts",
        entityId: String(input.orderId),
        before: { deletedAt: trashItem.deletedAt },
        after: { restoredAt: Date.now() },
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  // Exclusão permanente individual: disponível somente para itens que já estão na lixeira.
  permanentlyDeleteContaRecebida: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = (ctx as any).adminUser;
      if (adminUser?.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Superadmin pode excluir permanentemente um item da lixeira." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const [trashItem] = await db.select().from(deletedReceivedAccounts)
        .where(eq(deletedReceivedAccounts.orderId, input.orderId))
        .limit(1);
      if (!trashItem) throw new TRPCError({ code: "NOT_FOUND", message: "Apenas itens presentes na lixeira podem ser excluídos permanentemente." });
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);

      await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, input.orderId));
      await db.delete(orderArtPreviews).where(eq(orderArtPreviews.orderId, input.orderId));
      await deleteProductionDependenciesForOrder(db, input.orderId);
      await db.delete(financialRecords).where(eq(financialRecords.orderId, input.orderId));
      await db.delete(fileValidations).where(eq(fileValidations.orderId, input.orderId));
      await db.delete(automationLogs).where(eq(automationLogs.orderId, input.orderId));
      await db.delete(shipments).where(eq(shipments.orderId, input.orderId));
      await db.delete(fiscalNotes).where(eq(fiscalNotes.orderId, input.orderId));
      await db.delete(orderPayments).where(eq(orderPayments.orderId, input.orderId));
      await db.delete(emailHistory).where(eq(emailHistory.orderId, input.orderId));
      await db.delete(orderItems).where(eq(orderItems.orderId, input.orderId));
      await db.delete(orders).where(eq(orders.id, input.orderId));
      await db.delete(deletedReceivedAccounts).where(eq(deletedReceivedAccounts.orderId, input.orderId));

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "permanently_delete_received_account_from_trash",
        entity: "deletedReceivedAccounts",
        entityId: String(input.orderId),
        before: { orderNumber: order?.orderNumber, deletedAt: trashItem.deletedAt, deletionReason: trashItem.deletionReason },
        after: { permanentlyDeletedAt: Date.now() },
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  // Exclusão permanente: remove somente os pedidos já movidos à lixeira.
  emptyDeletedContasRecebidas: adminOrManusAuthProcedure
    .input(z.object({ confirmation: z.literal(true) }))
    .mutation(async ({ ctx }) => {
      const adminUser = (ctx as any).adminUser;
      if (adminUser?.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Superadmin pode esvaziar a lixeira de contas recebidas." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const trashItems = await db.select({ orderId: deletedReceivedAccounts.orderId })
        .from(deletedReceivedAccounts);
      if (!trashItems.length) return { success: true, deletedCount: 0 };

      for (const { orderId } of trashItems) {
        await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId));
        await db.delete(orderArtPreviews).where(eq(orderArtPreviews.orderId, orderId));
        await deleteProductionDependenciesForOrder(db, orderId);
        await db.delete(financialRecords).where(eq(financialRecords.orderId, orderId));
        await db.delete(fileValidations).where(eq(fileValidations.orderId, orderId));
        await db.delete(automationLogs).where(eq(automationLogs.orderId, orderId));
        await db.delete(shipments).where(eq(shipments.orderId, orderId));
        await db.delete(fiscalNotes).where(eq(fiscalNotes.orderId, orderId));
        await db.delete(orderPayments).where(eq(orderPayments.orderId, orderId));
        await db.delete(emailHistory).where(eq(emailHistory.orderId, orderId));
        await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
        await db.delete(orders).where(eq(orders.id, orderId));
        await db.delete(deletedReceivedAccounts).where(eq(deletedReceivedAccounts.orderId, orderId));
      }

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "permanently_empty_received_accounts_trash",
        entity: "deletedReceivedAccounts",
        before: { orderIds: trashItems.map((item) => item.orderId), deletedCount: trashItems.length },
        after: { emptiedAt: Date.now() },
        ipAddress: ctx.req.ip,
      });

      return { success: true, deletedCount: trashItems.length };
    }),

  // ── Pagamentos na Retirada ──────────────────────────────────────────────────
  getPagamentosRetirada: adminOrManusAuthProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.string().optional(),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Pedidos com retirada na loja E pagamento na retirada
      const allOrders = await db.select().from(orders)
        .where(or(
          eq(orders.status, "pagamento_retirada"),
          and(
            eq(orders.paymentMethod, "pagar_na_retirada"),
          ),
        ))
        .orderBy(desc(orders.createdAt));

      // Filtrar apenas pickup
      const pickupOrders = allOrders.filter(o =>
        o.shippingMethod === "pickup" ||
        o.shippingMethod === "retirada" ||
        o.shippingMethod === "pagamento_retirada" ||
        o.status === "pagamento_retirada" ||
        o.paymentMethod === "pagar_na_retirada"
      );

      // Aplicar filtro de status
      const filtered = input.status
        ? pickupOrders.filter(o => {
            const mapped = mapOrderToFinanceiro(o);
            return mapped.status === input.status;
          })
        : pickupOrders;

      // Aplicar filtro de data
      const dateFiltered = filtered.filter(o => {
        const t = new Date(o.createdAt).getTime();
        if (input.startDate && t < input.startDate) return false;
        if (input.endDate && t > input.endDate) return false;
        return true;
      });

      const total = dateFiltered.length;
      const offset = (input.page - 1) * input.limit;
      const paginated = dateFiltered.slice(offset, offset + input.limit);

      return {
        data: paginated.map(mapOrderToFinanceiro),
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // ── Confirmar Pagamento ─────────────────────────────────────────────────────
  confirmarPagamento: adminOrManusAuthProcedure
    .input(z.object({
      orderId: z.number(),
      formaPagamento: z.enum(["dinheiro", "pix", "cartao_credito", "cartao_debito", "transferencia"]),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if ((ctx as any).adminUser?.role === "seller") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Vendedores não podem confirmar pagamentos. Esta baixa é realizada pela equipe financeira." });
      }
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const paidAt = Date.now();

      // Atualiza o pedido existente (apenas paymentStatus e paymentMethod)
      await db.update(orders)
        .set({
          paymentStatus: "pago",
          paymentMethod: input.formaPagamento,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      try {
        const { reconcileSellerCommissionForOrder } = await import("./sellerCommissionService");
        await reconcileSellerCommissionForOrder(input.orderId);
      } catch (error) {
        console.error("[COMISSOES] Não foi possível sincronizar a comissão após confirmar o pagamento:", error);
      }

      // Registra na tabela financeiro própria
      const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (order.length > 0) {
        const o = order[0];
        const existing = await db.select().from(financeiro)
          .where(eq(financeiro.pedidoId, input.orderId)).limit(1);

        if (existing.length > 0) {
          await db.update(financeiro)
            .set({
              status: "pago",
              dataPagamento: paidAt,
              formaPagamento: input.formaPagamento,
              observacoes: input.observacoes,
              atualizadoEm: new Date(),
            })
            .where(eq(financeiro.pedidoId, input.orderId));
        } else {
          await db.insert(financeiro).values({
            pedidoId: o.id,
            orderNumber: o.orderNumber,
            cliente: o.guestName || o.deliveryFullName || "Cliente",
            telefone: o.deliveryPhone || "",
            email: o.guestEmail || "",
            valor: o.totalPrice,
            formaPagamento: input.formaPagamento,
            formaEntrega: mapShippingMethod(o.shippingMethod) as any,
            status: "pago",
            dataPagamento: paidAt,
            observacoes: input.observacoes,
            criadoPor: ctx.adminUser.adminId,
          });
        }

        const [financeiroRecord] = await db.select({ id: financeiro.id })
          .from(financeiro)
          .where(eq(financeiro.pedidoId, input.orderId))
          .limit(1);
        const receipt = await ensurePaymentReceipt(
          db,
          o,
          financeiroRecord?.id ?? null,
          input.formaPagamento,
          paidAt,
          (ctx as any).adminUser,
        );
        const recipientEmail = receipt.customerEmail;
        let receiptEmailSent = false;
        let receiptEmailError: string | null = null;
        if (recipientEmail && !receipt.emailSentAt) {
          const emailResult = await sendPaymentReceiptEmail(recipientEmail, {
            customerName: receipt.customerName,
            receiptNumber: receipt.receiptNumber,
            orderNumber: receipt.orderNumber,
            amount: formatReceiptCurrency(receipt.amount),
            paymentMethod: RECEIPT_PAYMENT_LABELS[receipt.paymentMethod] || receipt.paymentMethod,
            paidAt: formatReceiptDate(receipt.paidAt),
          });
          if (emailResult.success) {
            const emailSentAt = Date.now();
            await db.update(paymentReceipts).set({ emailSentAt }).where(eq(paymentReceipts.id, receipt.id));
            await db.insert(emailHistory).values({
              orderId: receipt.orderId,
              recipientEmail,
              recipientName: receipt.customerName,
              emailType: "other",
              subject: `Recibo ${receipt.receiptNumber} — Pedido #${receipt.orderNumber}`,
              templateName: "sendPaymentReceiptEmail:auto",
              status: "sent",
            });
            receiptEmailSent = true;
          } else {
            receiptEmailError = emailResult.error || "Não foi possível enviar o e-mail automático.";
            console.error("[RECEIPT] Automatic e-mail failed:", receiptEmailError);
          }
        }
        return {
          success: true,
          receiptId: receipt.id,
          receiptNumber: receipt.receiptNumber,
          receiptEmailSent,
          receiptEmailAvailable: Boolean(recipientEmail),
          receiptRecipientEmail: recipientEmail || null,
          receiptEmailError,
        };
      }

      throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado para emissão do recibo." });
    }),

  // ── Recibos ──────────────────────────────────────────────────────────────────
  criarReciboAvulso: adminOrManusAuthProcedure
    .input(standaloneReceiptSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const subtotalInCents = input.items.reduce((total, item) => total + Math.round(item.quantity * item.unitPrice * 100), 0);
      const discountInCents = Math.round(input.discount * 100);
      if (discountInCents > subtotalInCents) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "O desconto não pode ser maior que o subtotal dos itens." });
      }

      const paidAt = input.paidAt ?? Date.now();
      const issuedAt = Date.now();
      const receiptNumber = `RAV-${new Date(issuedAt).getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
      const subtotal = (subtotalInCents / 100).toFixed(2);
      const discount = (discountInCents / 100).toFixed(2);
      const amount = ((subtotalInCents - discountInCents) / 100).toFixed(2);

      const receipt = await db.transaction(async (tx: any) => {
        await tx.insert(standaloneReceipts).values({
          receiptNumber,
          customerName: input.customerName,
          customerDocument: input.customerDocument || null,
          customerEmail: input.customerEmail || null,
          customerPhone: input.customerPhone || null,
          paymentMethod: input.paymentMethod,
          paidAt,
          subtotal,
          discount,
          amount,
          notes: input.notes || null,
          issuedAt,
          issuedByAdminId: (ctx as any).adminUser?.adminId ?? null,
          issuedByAdminName: (ctx as any).adminUser?.name || "Administrador",
        });
        const [createdReceipt] = await tx.select().from(standaloneReceipts)
          .where(eq(standaloneReceipts.receiptNumber, receiptNumber))
          .limit(1);
        if (!createdReceipt) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível emitir o recibo avulso." });
        await tx.insert(standaloneReceiptItems).values(input.items.map((item) => ({
          standaloneReceiptId: createdReceipt.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPrice * 100) / 100,
          subtotal: Math.round(item.quantity * item.unitPrice * 100) / 100,
        })));
        return createdReceipt;
      });

      await logAudit({
        adminId: (ctx as any).adminUser?.adminId,
        adminName: (ctx as any).adminUser?.name || "Administrador",
        action: "standalone_receipt_created",
        entity: "standaloneReceipts",
        entityId: String(receipt.id),
        after: { receiptNumber: receipt.receiptNumber, customerName: receipt.customerName, amount: receipt.amount, itemCount: input.items.length },
        ipAddress: ctx.req.ip,
      });
      return { success: true, receiptId: receipt.id, receiptNumber: receipt.receiptNumber };
    }),

  getRecibosAvulsos: adminOrManusAuthProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().min(1).max(100).default(20),
      search: z.string().trim().max(255).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const whereClause = input.search ? or(
        like(standaloneReceipts.receiptNumber, `%${input.search}%`),
        like(standaloneReceipts.customerName, `%${input.search}%`),
        like(standaloneReceipts.customerDocument, `%${input.search}%`),
      ) : undefined;
      const offset = (input.page - 1) * input.limit;
      const [summary] = await db.select({ total: sql<number>`count(*)` }).from(standaloneReceipts).where(whereClause);
      const data = await db.select().from(standaloneReceipts).where(whereClause)
        .orderBy(desc(standaloneReceipts.issuedAt)).limit(input.limit).offset(offset);
      const total = Number(summary?.total ?? 0);
      return { data, total, page: input.page, totalPages: Math.max(1, Math.ceil(total / input.limit)) };
    }),

  getReciboAvulso: adminOrManusAuthProcedure
    .input(z.object({ receiptId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [receipt] = await db.select().from(standaloneReceipts)
        .where(eq(standaloneReceipts.id, input.receiptId))
        .limit(1);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo avulso não encontrado." });
      const items = await db.select().from(standaloneReceiptItems)
        .where(eq(standaloneReceiptItems.standaloneReceiptId, receipt.id))
        .orderBy(standaloneReceiptItems.id);
      return { receipt, items };
    }),

  editarReciboAvulso: adminOrManusAuthProcedure
    .input(standaloneReceiptSchema.extend({ receiptId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [current] = await db.select().from(standaloneReceipts)
        .where(eq(standaloneReceipts.id, input.receiptId))
        .limit(1);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo avulso não encontrado." });
      if (current.status === "cancelado") throw new TRPCError({ code: "BAD_REQUEST", message: "Recibos cancelados não podem ser editados." });

      const subtotalInCents = input.items.reduce((total, item) => total + Math.round(item.quantity * item.unitPrice * 100), 0);
      const discountInCents = Math.round(input.discount * 100);
      if (discountInCents > subtotalInCents) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "O desconto não pode ser maior que o subtotal dos itens." });
      }
      const subtotal = (subtotalInCents / 100).toFixed(2);
      const discount = (discountInCents / 100).toFixed(2);
      const amount = ((subtotalInCents - discountInCents) / 100).toFixed(2);
      const paidAt = input.paidAt ?? current.paidAt;

      await db.transaction(async (tx: any) => {
        await tx.update(standaloneReceipts).set({
          customerName: input.customerName,
          customerDocument: input.customerDocument || null,
          customerEmail: input.customerEmail || null,
          customerPhone: input.customerPhone || null,
          paymentMethod: input.paymentMethod,
          paidAt,
          subtotal,
          discount,
          amount,
          notes: input.notes || null,
          updatedAt: new Date(),
        }).where(eq(standaloneReceipts.id, input.receiptId));
        await tx.delete(standaloneReceiptItems).where(eq(standaloneReceiptItems.standaloneReceiptId, input.receiptId));
        await tx.insert(standaloneReceiptItems).values(input.items.map((item) => ({
          standaloneReceiptId: input.receiptId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: Math.round(item.unitPrice * 100) / 100,
          subtotal: Math.round(item.quantity * item.unitPrice * 100) / 100,
        })));
      });

      await logAudit({
        adminId: (ctx as any).adminUser?.adminId,
        adminName: (ctx as any).adminUser?.name || "Administrador",
        action: "standalone_receipt_updated",
        entity: "standaloneReceipts",
        entityId: String(input.receiptId),
        after: { receiptNumber: current.receiptNumber, customerName: input.customerName, amount, itemCount: input.items.length },
        ipAddress: ctx.req.ip,
      });
      return { success: true, receiptId: input.receiptId, receiptNumber: current.receiptNumber };
    }),

  cancelarReciboAvulso: adminOrManusAuthProcedure
    .input(z.object({ receiptId: z.number().int().positive(), reason: z.string().trim().max(1000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [receipt] = await db.select().from(standaloneReceipts)
        .where(eq(standaloneReceipts.id, input.receiptId))
        .limit(1);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo avulso não encontrado." });
      if (receipt.status === "cancelado") return { success: true, alreadyCancelled: true };

      const cancelledAt = Date.now();
      await db.update(standaloneReceipts).set({
        status: "cancelado",
        cancelledAt,
        cancelledByAdminId: (ctx as any).adminUser?.adminId ?? null,
        cancelledByAdminName: (ctx as any).adminUser?.name || "Administrador",
        cancelReason: input.reason || null,
        updatedAt: new Date(),
      }).where(eq(standaloneReceipts.id, input.receiptId));
      await logAudit({
        adminId: (ctx as any).adminUser?.adminId,
        adminName: (ctx as any).adminUser?.name || "Administrador",
        action: "standalone_receipt_cancelled",
        entity: "standaloneReceipts",
        entityId: String(input.receiptId),
        after: { receiptNumber: receipt.receiptNumber, cancelledAt, reason: input.reason || null },
        ipAddress: ctx.req.ip,
      });
      return { success: true, alreadyCancelled: false };
    }),

  prepareReciboAvulsoWhatsApp: adminOrManusAuthProcedure
    .input(z.object({ receiptId: z.number().int().positive(), phone: z.string().trim().min(10).max(30).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [receipt] = await db.select().from(standaloneReceipts)
        .where(eq(standaloneReceipts.id, input.receiptId))
        .limit(1);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo avulso não encontrado." });
      if (receipt.status === "cancelado") throw new TRPCError({ code: "BAD_REQUEST", message: "Recibos cancelados não podem ser enviados pelo WhatsApp." });
      const phone = (input.phone || receipt.customerPhone || "").replace(/\D/g, "");
      if (phone.length < 10) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe um número de WhatsApp válido." });
      const message = [
        `Olá, ${receipt.customerName}!`,
        "",
        "Segue o seu recibo de pagamento.",
        `Recibo: ${receipt.receiptNumber}`,
        `Valor recebido: ${formatReceiptCurrency(receipt.amount)}`,
        `Forma de pagamento: ${RECEIPT_PAYMENT_LABELS[receipt.paymentMethod] || receipt.paymentMethod}`,
        `Data: ${formatReceiptDate(receipt.paidAt)}`,
        "",
        "Maria Imprime",
      ].join("\n");
      const preparedAt = Date.now();
      await db.update(standaloneReceipts).set({ whatsappPreparedAt: preparedAt })
        .where(eq(standaloneReceipts.id, receipt.id));
      await logAudit({
        adminId: (ctx as any).adminUser?.adminId,
        adminName: (ctx as any).adminUser?.name || "Administrador",
        action: "standalone_receipt_whatsapp_prepared",
        entity: "standaloneReceipts",
        entityId: String(receipt.id),
        after: { receiptNumber: receipt.receiptNumber, phone, preparedAt },
        ipAddress: ctx.req.ip,
      });
      return { whatsappUrl: `https://wa.me/55${phone.replace(/^55/, "")}?text=${encodeURIComponent(message)}` };
    }),

  sendReciboAvulsoEmail: adminOrManusAuthProcedure
    .input(z.object({ receiptId: z.number().int().positive(), email: z.string().email().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [receipt] = await db.select().from(standaloneReceipts)
        .where(eq(standaloneReceipts.id, input.receiptId))
        .limit(1);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo não encontrado." });
      if (receipt.status === "cancelado") throw new TRPCError({ code: "BAD_REQUEST", message: "Recibos cancelados não podem ser enviados por e-mail." });
      const recipientEmail = input.email || receipt.customerEmail;
      if (!recipientEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o e-mail do cliente para enviar o recibo." });
      const result = await sendStandaloneReceiptEmail(recipientEmail, {
        customerName: receipt.customerName,
        receiptNumber: receipt.receiptNumber,
        amount: formatReceiptCurrency(receipt.amount),
        paymentMethod: RECEIPT_PAYMENT_LABELS[receipt.paymentMethod] || receipt.paymentMethod,
        paidAt: formatReceiptDate(receipt.paidAt),
      });
      if (!result.success) throw new TRPCError({ code: "BAD_GATEWAY", message: result.error || "Não foi possível enviar o e-mail do recibo." });
      await logAudit({
        adminId: (ctx as any).adminUser?.adminId,
        adminName: (ctx as any).adminUser?.name || "Administrador",
        action: "standalone_receipt_email_sent",
        entity: "standaloneReceipts",
        entityId: String(receipt.id),
        after: { receiptNumber: receipt.receiptNumber, recipientEmail },
        ipAddress: ctx.req.ip,
      });
      return { success: true, recipientEmail };
    }),

  getRecibos: adminOrManusAuthProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().min(1).max(100).default(20),
      search: z.string().trim().max(255).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const conditions: any[] = [];
      if (input.search) {
        conditions.push(or(
          like(paymentReceipts.receiptNumber, `%${input.search}%`),
          like(paymentReceipts.orderNumber, `%${input.search}%`),
          like(paymentReceipts.customerName, `%${input.search}%`),
        ));
      }
      const whereClause = conditions.length ? and(...conditions) : undefined;
      const offset = (input.page - 1) * input.limit;
      const [summary] = await db.select({ total: sql<number>`count(*)` })
        .from(paymentReceipts)
        .where(whereClause);
      const rows = await db.select().from(paymentReceipts)
        .where(whereClause)
        .orderBy(desc(paymentReceipts.issuedAt))
        .limit(input.limit)
        .offset(offset);
      const total = Number(summary?.total ?? 0);
      return {
        data: rows,
        total,
        page: input.page,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      };
    }),

  getRecibosNaLixeira: adminOrManusAuthProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
    return db.select().from(deletedReceipts).orderBy(desc(deletedReceipts.deletedAt));
  }),

  moverReciboParaLixeira: adminOrManusAuthProcedure
    .input(z.object({ receiptId: z.number().int().positive(), receiptType: z.enum(["pedido", "avulso"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const deletedAt = Date.now();
      const adminId = (ctx as any).adminUser?.adminId ?? null;
      const adminName = (ctx as any).adminUser?.name || "Administrador";

      const moved = await db.transaction(async (tx: any) => {
        if (input.receiptType === "pedido") {
          const [receipt] = await tx.select().from(paymentReceipts).where(eq(paymentReceipts.id, input.receiptId)).limit(1);
          if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo não encontrado." });
          const [existing] = await tx.select({ id: deletedReceipts.id }).from(deletedReceipts)
            .where(and(eq(deletedReceipts.receiptType, "pedido"), eq(deletedReceipts.originalReceiptId, receipt.id))).limit(1);
          if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este recibo já está na lixeira." });
          await tx.insert(deletedReceipts).values({
            receiptType: "pedido", originalReceiptId: receipt.id, receiptNumber: receipt.receiptNumber,
            orderId: receipt.orderId, orderNumber: receipt.orderNumber, customerName: receipt.customerName,
            amount: receipt.amount, paidAt: receipt.paidAt, receiptSnapshot: JSON.stringify({ receipt }),
            deletedAt, deletedByAdminId: adminId, deletedByAdminName: adminName,
          });
          await tx.delete(paymentReceipts).where(eq(paymentReceipts.id, receipt.id));
          return { receiptNumber: receipt.receiptNumber, receiptType: input.receiptType };
        }

        const [receipt] = await tx.select().from(standaloneReceipts).where(eq(standaloneReceipts.id, input.receiptId)).limit(1);
        if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo avulso não encontrado." });
        const [existing] = await tx.select({ id: deletedReceipts.id }).from(deletedReceipts)
          .where(and(eq(deletedReceipts.receiptType, "avulso"), eq(deletedReceipts.originalReceiptId, receipt.id))).limit(1);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este recibo já está na lixeira." });
        const items = await tx.select().from(standaloneReceiptItems)
          .where(eq(standaloneReceiptItems.standaloneReceiptId, receipt.id));
        await tx.insert(deletedReceipts).values({
          receiptType: "avulso", originalReceiptId: receipt.id, receiptNumber: receipt.receiptNumber,
          customerName: receipt.customerName, amount: receipt.amount, paidAt: receipt.paidAt,
          receiptSnapshot: JSON.stringify({ receipt, items }), deletedAt,
          deletedByAdminId: adminId, deletedByAdminName: adminName,
        });
        await tx.delete(standaloneReceiptItems).where(eq(standaloneReceiptItems.standaloneReceiptId, receipt.id));
        await tx.delete(standaloneReceipts).where(eq(standaloneReceipts.id, receipt.id));
        return { receiptNumber: receipt.receiptNumber, receiptType: input.receiptType };
      });

      await logAudit({ adminId, adminName, action: "receipt_moved_to_trash", entity: "deletedReceipts", entityId: `${input.receiptType}:${input.receiptId}`, after: { ...moved, deletedAt }, ipAddress: ctx.req.ip });
      return { success: true, ...moved };
    }),

  restaurarReciboDaLixeira: adminOrManusAuthProcedure
    .input(z.object({ trashId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const adminId = (ctx as any).adminUser?.adminId ?? null;
      const adminName = (ctx as any).adminUser?.name || "Administrador";
      const restored = await db.transaction(async (tx: any) => {
        const [trash] = await tx.select().from(deletedReceipts).where(eq(deletedReceipts.id, input.trashId)).limit(1);
        if (!trash) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo não encontrado na lixeira." });
        const snapshot = JSON.parse(trash.receiptSnapshot);
        if (trash.receiptType === "pedido") {
          const [existing] = await tx.select({ id: paymentReceipts.id }).from(paymentReceipts)
            .where(or(eq(paymentReceipts.orderId, snapshot.receipt.orderId), eq(paymentReceipts.receiptNumber, snapshot.receipt.receiptNumber))).limit(1);
          if (existing) throw new TRPCError({ code: "CONFLICT", message: "Já existe um recibo ativo para este pedido." });
          const { id, createdAt, updatedAt, ...receiptValues } = snapshot.receipt;
          await tx.insert(paymentReceipts).values(receiptValues);
        } else {
          const [existing] = await tx.select({ id: standaloneReceipts.id }).from(standaloneReceipts)
            .where(eq(standaloneReceipts.receiptNumber, snapshot.receipt.receiptNumber)).limit(1);
          if (existing) throw new TRPCError({ code: "CONFLICT", message: "Já existe um recibo avulso ativo com este número." });
          const { id, createdAt, updatedAt, ...receiptValues } = snapshot.receipt;
          await tx.insert(standaloneReceipts).values(receiptValues);
          const [receipt] = await tx.select().from(standaloneReceipts)
            .where(eq(standaloneReceipts.receiptNumber, snapshot.receipt.receiptNumber)).limit(1);
          if (!receipt) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível restaurar o recibo avulso." });
          if (Array.isArray(snapshot.items) && snapshot.items.length) {
            await tx.insert(standaloneReceiptItems).values(snapshot.items.map(({ id: _id, standaloneReceiptId: _receiptId, createdAt: _createdAt, ...item }: any) => ({ ...item, standaloneReceiptId: receipt.id })));
          }
        }
        await tx.delete(deletedReceipts).where(eq(deletedReceipts.id, trash.id));
        return { receiptNumber: trash.receiptNumber, receiptType: trash.receiptType };
      });
      await logAudit({ adminId, adminName, action: "receipt_restored_from_trash", entity: "deletedReceipts", entityId: String(input.trashId), after: restored, ipAddress: ctx.req.ip });
      return { success: true, ...restored };
    }),

  excluirReciboPermanentemente: adminOrManusAuthProcedure
    .input(z.object({ trashId: z.number().int().positive(), confirmation: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      const adminUser = requireReceiptsSuperadmin(ctx as any);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [trash] = await db.select().from(deletedReceipts).where(eq(deletedReceipts.id, input.trashId)).limit(1);
      if (!trash) throw new TRPCError({ code: "NOT_FOUND", message: "Apenas recibos presentes na lixeira podem ser excluídos permanentemente." });
      await db.delete(deletedReceipts).where(eq(deletedReceipts.id, trash.id));
      await logAudit({ adminId: adminUser.adminId, adminName: adminUser.name, action: "receipt_permanently_deleted_from_trash", entity: "deletedReceipts", entityId: String(trash.id), before: { receiptNumber: trash.receiptNumber, receiptType: trash.receiptType, deletedAt: trash.deletedAt }, after: { permanentlyDeletedAt: Date.now() }, ipAddress: ctx.req.ip });
      return { success: true };
    }),

  getRecibo: adminOrManusAuthProcedure
    .input(z.object({ receiptId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [receipt] = await db.select().from(paymentReceipts)
        .where(eq(paymentReceipts.id, input.receiptId))
        .limit(1);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo não encontrado." });
      const items = await db.select({
        id: orderItems.id,
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        priceAtOrder: orderItems.priceAtOrder,
      }).from(orderItems).where(eq(orderItems.orderId, receipt.orderId));
      return { receipt, items };
    }),

  prepareReceiptWhatsApp: adminOrManusAuthProcedure
    .input(z.object({ receiptId: z.number().int().positive(), phone: z.string().trim().min(10).max(30).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [receipt] = await db.select().from(paymentReceipts)
        .where(eq(paymentReceipts.id, input.receiptId))
        .limit(1);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo não encontrado." });
      const phone = (input.phone || receipt.customerPhone || "").replace(/\D/g, "");
      if (phone.length < 10) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe um número de WhatsApp válido." });
      const message = [
        `Olá, ${receipt.customerName}!`,
        "",
        "Confirmamos o recebimento do seu pagamento.",
        `Recibo: ${receipt.receiptNumber}`,
        `Pedido: #${receipt.orderNumber}`,
        `Valor recebido: ${formatReceiptCurrency(receipt.amount)}`,
        `Forma de pagamento: ${RECEIPT_PAYMENT_LABELS[receipt.paymentMethod] || receipt.paymentMethod}`,
        `Data: ${formatReceiptDate(receipt.paidAt)}`,
        "",
        "Maria Imprime",
      ].join("\n");
      await db.update(paymentReceipts).set({ whatsappPreparedAt: Date.now() })
        .where(eq(paymentReceipts.id, receipt.id));
      await logAudit({
        adminId: (ctx as any).adminUser?.adminId,
        adminName: (ctx as any).adminUser?.name || "Administrador",
        action: "receipt_whatsapp_prepared",
        entity: "paymentReceipts",
        entityId: String(receipt.id),
        after: { receiptNumber: receipt.receiptNumber, phone },
        ipAddress: ctx.req.ip,
      });
      return { whatsappUrl: `https://wa.me/55${phone.replace(/^55/, "")}?text=${encodeURIComponent(message)}` };
    }),

  sendReceiptEmail: adminOrManusAuthProcedure
    .input(z.object({ receiptId: z.number().int().positive(), email: z.string().email().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [receipt] = await db.select().from(paymentReceipts)
        .where(eq(paymentReceipts.id, input.receiptId))
        .limit(1);
      if (!receipt) throw new TRPCError({ code: "NOT_FOUND", message: "Recibo não encontrado." });
      const recipientEmail = input.email || receipt.customerEmail;
      if (!recipientEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o e-mail do cliente para enviar o recibo." });
      const result = await sendPaymentReceiptEmail(recipientEmail, {
        customerName: receipt.customerName,
        receiptNumber: receipt.receiptNumber,
        orderNumber: receipt.orderNumber,
        amount: formatReceiptCurrency(receipt.amount),
        paymentMethod: RECEIPT_PAYMENT_LABELS[receipt.paymentMethod] || receipt.paymentMethod,
        paidAt: formatReceiptDate(receipt.paidAt),
      });
      if (!result.success) throw new TRPCError({ code: "BAD_GATEWAY", message: result.error || "Não foi possível enviar o e-mail do recibo." });
      const sentAt = Date.now();
      await db.update(paymentReceipts).set({ emailSentAt: sentAt }).where(eq(paymentReceipts.id, receipt.id));
      await db.insert(emailHistory).values({
        orderId: receipt.orderId,
        recipientEmail,
        recipientName: receipt.customerName,
        emailType: "other",
        subject: `Recibo ${receipt.receiptNumber} — Pedido #${receipt.orderNumber}`,
        templateName: "sendPaymentReceiptEmail",
        status: "sent",
      });
      await logAudit({
        adminId: (ctx as any).adminUser?.adminId,
        adminName: (ctx as any).adminUser?.name || "Administrador",
        action: "receipt_email_sent",
        entity: "paymentReceipts",
        entityId: String(receipt.id),
        after: { receiptNumber: receipt.receiptNumber, recipientEmail, sentAt },
        ipAddress: ctx.req.ip,
      });
      return { success: true, recipientEmail };
    }),

  // ── Atualizar Status Retirada ───────────────────────────────────────────────
  atualizarStatusRetirada: adminOrManusAuthProcedure
    .input(z.object({
      orderId: z.number(),
      status: z.enum(["aguardando_producao", "pronto_retirada", "pago", "retirado_cliente", "retirado_terceiros"]),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const paidAt = Date.now();
      const confirmsPayment = input.status === "pago" || input.status === "retirado_cliente" || input.status === "retirado_terceiros";

      // Mapeia status do financeiro para status do pedido
      const orderStatusMap: Record<string, any> = {
        aguardando_producao: "em_producao",
        pronto_retirada: "pronto_retirada",
        pago: "pagamento_retirada",
        retirado_cliente: "entregue",
        retirado_terceiros: "entregue",
      };

      const newOrderStatus = orderStatusMap[input.status];
      if (newOrderStatus) {
        await db.update(orders)
          .set({
            status: newOrderStatus,
            paymentStatus: confirmsPayment ? "pago" : "pendente",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, input.orderId));
      }

      // Upsert na tabela financeiro
      const existing = await db.select().from(financeiro)
        .where(eq(financeiro.pedidoId, input.orderId)).limit(1);

      const finData: any = {
        status: input.status,
        observacoes: input.observacoes,
        atualizadoEm: new Date(),
      };
      if (confirmsPayment) {
        finData.dataPagamento = paidAt;
      }

      if (existing.length > 0) {
        await db.update(financeiro).set(finData).where(eq(financeiro.pedidoId, input.orderId));
      } else {
        const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
        if (order.length > 0) {
          const o = order[0];
          await db.insert(financeiro).values({
            pedidoId: o.id,
            orderNumber: o.orderNumber,
            cliente: o.guestName || o.deliveryFullName || "Cliente",
            telefone: o.deliveryPhone || "",
            email: o.guestEmail || "",
            valor: o.totalPrice,
            formaPagamento: "pagar_na_retirada",
            formaEntrega: "retirada_loja",
            status: input.status,
            observacoes: input.observacoes,
            criadoPor: ctx.adminUser.adminId,
          });
        }
      }

      if (confirmsPayment) {
        const [paidOrder] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
        const [financeiroRecord] = await db.select({ id: financeiro.id })
          .from(financeiro)
          .where(eq(financeiro.pedidoId, input.orderId))
          .limit(1);
        if (paidOrder) {
          await ensurePaymentReceipt(
            db,
            paidOrder,
            financeiroRecord?.id ?? null,
            paidOrder.paymentMethod || "pagar_na_retirada",
            paidAt,
            (ctx as any).adminUser,
          );
        }
      }

      return { success: true };
    }),

  // ── Fluxo de Caixa ──────────────────────────────────────────────────────────
  getFluxoCaixa: adminOrManusAuthProcedure
    .input(z.object({
      startDate: z.number().optional(),
      endDate: z.number().optional(),
      groupBy: z.enum(["day", "week", "month"]).default("day"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = Date.now();
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const start = input.startDate ?? monthAgo;
      const end = input.endDate ?? now;

      // Entradas automáticas vêm do registro financeiro confirmado, que possui
      // a data de pagamento real e evita distorções pela data de criação do pedido.
      const [paidRecords, paidRecordsBeforeStart, manualEntries, manualEntriesBeforeStart, trashedReceivedAccounts] = await Promise.all([
        db.select().from(financeiro).where(and(
          eq(financeiro.status, "pago"),
          isNotNull(financeiro.dataPagamento),
          gte(financeiro.dataPagamento, start),
          lte(financeiro.dataPagamento, end)
        )),
        db.select().from(financeiro).where(and(
          eq(financeiro.status, "pago"),
          isNotNull(financeiro.dataPagamento),
          lt(financeiro.dataPagamento, start)
        )),
        db.select().from(cashFlowEntries)
          .where(and(gte(cashFlowEntries.entryDate, start), lte(cashFlowEntries.entryDate, end)))
          .orderBy(desc(cashFlowEntries.entryDate)),
        db.select().from(cashFlowEntries).where(lt(cashFlowEntries.entryDate, start)),
        db.select({ orderId: deletedReceivedAccounts.orderId }).from(deletedReceivedAccounts),
      ]);

      const trashedOrderIds = new Set(trashedReceivedAccounts.map((item) => item.orderId));
      const visiblePaidRecords = paidRecords.filter((record) => !record.pedidoId || !trashedOrderIds.has(record.pedidoId));
      const visiblePaidRecordsBeforeStart = paidRecordsBeforeStart.filter((record) => !record.pedidoId || !trashedOrderIds.has(record.pedidoId));

      const openingIncome = visiblePaidRecordsBeforeStart.reduce((total, record) => total + parseFloat(record.valor || "0"), 0)
        + manualEntriesBeforeStart.filter((entry) => entry.entryType === "income").reduce((total, entry) => total + parseFloat(entry.amount || "0"), 0);
      const openingExpense = manualEntriesBeforeStart.filter((entry) => entry.entryType === "expense").reduce((total, entry) => total + parseFloat(entry.amount || "0"), 0);
      const openingBalance = openingIncome - openingExpense;

      const dateMap: Record<string, { income: number; expense: number; entries: any[] }> = {};

      for (const record of visiblePaidRecords) {
        const receivedAt = record.dataPagamento!;
        const date = new Date(receivedAt).toISOString().split("T")[0];
        if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, entries: [] };
        const value = parseFloat(record.valor || "0");
        dateMap[date].income += value;
        dateMap[date].entries.push({
          id: `financeiro_${record.id}`,
          tipo: "income",
          categoria: "Vendas",
          descricao: record.orderNumber ? `Pedido #${record.orderNumber}` : record.cliente || "Recebimento confirmado",
          valor: value,
          data: receivedAt,
          origem: "automatico",
        });
      }

      for (const entry of manualEntries) {
        const date = new Date(entry.entryDate).toISOString().split("T")[0];
        if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0, entries: [] };
        const value = parseFloat(entry.amount || "0");
        if (entry.entryType === "income") dateMap[date].income += value;
        else dateMap[date].expense += value;
        dateMap[date].entries.push({
          id: `manual_${entry.id}`,
          tipo: entry.entryType,
          categoria: entry.category || "Outros",
          descricao: entry.description || "",
          valor: value,
          data: new Date(entry.entryDate),
          origem: "manual",
          entryId: entry.id,
        });
      }

      let runningBalance = openingBalance;
      const timeline = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => {
          const balance = data.income - data.expense;
          const day = {
            date,
            income: data.income,
            expense: data.expense,
            balance,
            openingBalance: runningBalance,
            closingBalance: runningBalance + balance,
            entries: data.entries,
          };
          runningBalance = day.closingBalance;
          return day;
        });

      const totalIncome = timeline.reduce((sum, day) => sum + day.income, 0);
      const totalExpense = timeline.reduce((sum, day) => sum + day.expense, 0);

      return {
        timeline,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        openingBalance,
        closingBalance: openingBalance + totalIncome - totalExpense,
        startDate: start,
        endDate: end,
        manualEntries: manualEntries.map(entry => ({
          id: entry.id,
          tipo: entry.entryType,
          categoria: entry.category,
          descricao: entry.description,
          valor: parseFloat(entry.amount || "0"),
          data: entry.entryDate,
        })),
      };
    }),

  // ── Adicionar Entrada Manual ────────────────────────────────────────────────
  addEntradaManual: adminOrManusAuthProcedure
    .input(z.object({
      tipo: z.enum(["income", "expense"]),
      categoria: z.string(),
      descricao: z.string().optional(),
      valor: z.number().positive(),
      data: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(cashFlowEntries).values({
        entryType: input.tipo,
        category: input.categoria,
        description: input.descricao,
        amount: input.valor.toString(),
        entryDate: input.data,
        createdBy: ctx.adminUser.adminId,
      });

      return { success: true };
    }),

  // ── Editar Entrada Manual ───────────────────────────────────────────────────
  editEntradaManual: adminOrManusAuthProcedure
    .input(z.object({
      id: z.number(),
      tipo: z.enum(["income", "expense"]),
      categoria: z.string(),
      descricao: z.string().optional(),
      valor: z.number().positive(),
      data: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(cashFlowEntries)
        .set({
          entryType: input.tipo,
          category: input.categoria,
          description: input.descricao,
          amount: input.valor.toString(),
          entryDate: input.data,
        })
        .where(eq(cashFlowEntries.id, input.id));

      return { success: true };
    }),

  // ── Excluir Entrada Manual ──────────────────────────────────────────────────
  deleteEntradaManual: adminOrManusAuthProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(cashFlowEntries).where(eq(cashFlowEntries.id, input.id));
      return { success: true };
    }),

  // ── Relatórios ──────────────────────────────────────────────────────────────
  getRelatorio: adminOrManusAuthProcedure
    .input(z.object({
      tipo: z.enum(["diario", "semanal", "mensal", "anual"]),
      startDate: z.number().optional(),
      endDate: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      let start: Date;
      let end: Date = now;

      switch (input.tipo) {
        case "diario":
          start = new Date(now); start.setHours(0, 0, 0, 0);
          break;
        case "semanal":
          start = new Date(now); start.setDate(now.getDate() - 7);
          break;
        case "anual":
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default: // mensal
          start = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      if (input.startDate) start = new Date(input.startDate);
      if (input.endDate) end = new Date(input.endDate);

      const allOrders = await db.select().from(orders)
        .where(and(
          gte(orders.createdAt, start),
          lte(orders.createdAt, end)
        ));

      const paidOrders = allOrders.filter(o => o.paymentStatus === "pago");
      const pendingOrders = allOrders.filter(o => o.paymentStatus === "pendente" && o.status !== "cancelado");

      const receitaBruta = paidOrders.reduce((s, o) => s + parseFloat(o.totalPrice || "0"), 0);
      const fretes = paidOrders.reduce((s, o) => s + parseFloat(o.shippingPrice || "0"), 0);
      const receitaLiquida = receitaBruta - fretes;
      const ticketMedio = paidOrders.length > 0 ? receitaBruta / paidOrders.length : 0;

      // Forma de pagamento
      const pagamentos: Record<string, { count: number; valor: number }> = {};
      for (const o of paidOrders) {
        const m = o.paymentMethod || "outro";
        if (!pagamentos[m]) pagamentos[m] = { count: 0, valor: 0 };
        pagamentos[m].count++;
        pagamentos[m].valor += parseFloat(o.totalPrice || "0");
      }

      // Evolução por dia
      const dailyMap: Record<string, number> = {};
      for (const o of paidOrders) {
        const d = new Date(o.createdAt).toISOString().split("T")[0];
        dailyMap[d] = (dailyMap[d] || 0) + parseFloat(o.totalPrice || "0");
      }

      const evolucaoDiaria = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, valor]) => ({ date, valor }));

      return {
        receitaBruta,
        receitaLiquida,
        ticketMedio,
        pedidosPagos: paidOrders.length,
        pedidosPendentes: pendingOrders.length,
        totalPedidos: allOrders.length,
        formasPagamento: Object.entries(pagamentos).map(([forma, data]) => ({
          forma,
          count: data.count,
          valor: data.valor,
        })),
        evolucaoDiaria,
        periodo: { inicio: start.toISOString(), fim: end.toISOString() },
      };
    }),

  // ── Gerar Pix ───────────────────────────────────────────────────────────────
  gerarPix: adminOrManusAuthProcedure
    .input(z.object({
      orderId: z.number(),
      valor: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const order = await db.select().from(orders)
        .where(eq(orders.id, input.orderId)).limit(1);

      if (!order.length) throw new Error("Pedido não encontrado");
      const o = order[0];

      // Gera payload Pix estático (formato EMV)
      const pixKey = "grafica@pontedigital.com.br"; // chave Pix da empresa
      const nome = "GRAFICA PONTO DIGITAL";
      const cidade = "SAO PAULO";
      const valor = input.valor.toFixed(2);
      const txid = `GPD${o.orderNumber.replace(/\D/g, "").slice(-10)}`;

      // Monta o payload EMV simplificado
      const payload = buildPixPayload(pixKey, nome, cidade, valor, txid);

      // Salva na tabela financeiro
      const existing = await db.select().from(financeiro)
        .where(eq(financeiro.pedidoId, input.orderId)).limit(1);

      if (existing.length > 0) {
        await db.update(financeiro)
          .set({ pixCopiaECola: payload, atualizadoEm: new Date() })
          .where(eq(financeiro.pedidoId, input.orderId));
      } else {
        await db.insert(financeiro).values({
          pedidoId: o.id,
          orderNumber: o.orderNumber,
          cliente: o.guestName || o.deliveryFullName || "Cliente",
          telefone: o.deliveryPhone || "",
          email: o.guestEmail || "",
          valor: o.totalPrice,
          formaPagamento: "pix",
          formaEntrega: mapShippingMethod(o.shippingMethod) as any,
          status: "a_receber",
          pixCopiaECola: payload,
        });
      }

      return {
        pixCopiaECola: payload,
        valor: input.valor,
        orderNumber: o.orderNumber,
        cliente: o.guestName || o.deliveryFullName || "Cliente",
      };
    }),

  // ── Notificações ────────────────────────────────────────────────────────────
  getPendingPixDetails: adminOrManusAuthProcedure
    .input(z.object({ orderIds: z.array(z.number().int().positive()).max(250) }))
    .query(async ({ input, ctx }) => {
      const role = (ctx as any).adminUser?.role ?? (ctx as any).user?.role;
      if (role === "production") throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o Comercial e o Financeiro podem acessar cobranças Pix." });
      if (!input.orderIds.length) return [];
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const payments = await db.select({ orderId: orderPayments.orderId, paymentId: orderPayments.paymentId, expiresAt: orderPayments.expiresAt, status: orderPayments.status, createdAt: orderPayments.createdAt })
        .from(orderPayments)
        .where(and(inArray(orderPayments.orderId, input.orderIds), eq(orderPayments.method, "pix"), eq(orderPayments.status, "pending")))
        .orderBy(desc(orderPayments.createdAt));
      const latestByOrder = new Map<number, typeof payments[number]>();
      for (const payment of payments) if (!latestByOrder.has(payment.orderId)) latestByOrder.set(payment.orderId, payment);
      return Array.from(latestByOrder.values());
    }),

  preparePendingPixWhatsApp: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const role = (ctx as any).adminUser?.role ?? (ctx as any).user?.role;
      if (role === "production") throw new TRPCError({ code: "FORBIDDEN", message: "Apenas o Comercial e o Financeiro podem reenviar cobranças Pix." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order || order.status !== "aguardando_pagamento" || order.paymentStatus !== "pendente" || order.paymentMethod !== "pix") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido não possui um Pix pendente para reenvio." });
      }
      const [payment] = await db.select({ qrCode: orderPayments.qrCode, expiresAt: orderPayments.expiresAt })
        .from(orderPayments)
        .where(and(eq(orderPayments.orderId, order.id), eq(orderPayments.method, "pix"), eq(orderPayments.status, "pending")))
        .orderBy(desc(orderPayments.createdAt)).limit(1);
      if (!payment?.qrCode) throw new TRPCError({ code: "NOT_FOUND", message: "Código Pix pendente não encontrado para este pedido." });
      const expiryTimestamp = payment.expiresAt && /^\d+$/.test(payment.expiresAt) ? Number(payment.expiresAt) : payment.expiresAt ? new Date(payment.expiresAt).getTime() : NaN;
      if (Number.isFinite(expiryTimestamp) && expiryTimestamp <= Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Este Pix expirou. Gere uma nova cobrança antes de reenviá-lo." });
      }
      const rawPhone = String(order.deliveryPhone || "").replace(/\D/g, "");
      if (!rawPhone) throw new TRPCError({ code: "BAD_REQUEST", message: "O pedido não possui telefone para o reenvio por WhatsApp." });
      const phone = rawPhone.startsWith("55") && rawPhone.length > 11 ? rawPhone : `55${rawPhone}`;
      const expiry = payment.expiresAt ? new Date(payment.expiresAt) : null;
      const expiryText = expiry && !Number.isNaN(expiry.getTime()) ? `\nValidade: ${expiry.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}.` : "";
      const customerName = order.guestName || order.deliveryFullName || "cliente";
      const message = `Olá, ${customerName}! Segue novamente o Pix do pedido *#${order.orderNumber}* no valor de *R$ ${Number(order.totalPrice).toFixed(2).replace(".", ",")}*.${expiryText}\n\n*Copia e cola:*\n${payment.qrCode}\n\nApós a confirmação, daremos continuidade ao seu pedido. Maria Imprime.`;
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      await logAudit({ adminId: (ctx as any).adminUser?.adminId, adminName: (ctx as any).adminUser?.name || "Administrador", action: "pending_pix_whatsapp_prepared", entity: "orderPayments", entityId: String(order.id), after: { orderNumber: order.orderNumber, expiresAt: payment.expiresAt }, ipAddress: ctx.req.ip });
      return { whatsappUrl, expiresAt: payment.expiresAt };
    }),

  getNotificacoes: adminOrManusAuthProcedure
    .input(z.object({ apenasNaoLidas: z.boolean().default(false) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = Date.now();
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

      // Pedidos pendentes há mais de 7 dias
      const pendentes7dias = await db.select().from(orders)
        .where(and(
          eq(orders.paymentStatus, "pendente"),
          lte(orders.createdAt, new Date(sevenDaysAgo))
        ));

      // Pedidos prontos para retirada
      const prontoRetirada = await db.select().from(orders)
        .where(or(
          eq(orders.status, "pronto_retirada"),
          eq(orders.status, "pronto_entrega")
        ));

      const alertas = [];

      if (pendentes7dias.length > 0) {
        alertas.push({
          tipo: "pagamento_pendente_7dias",
          mensagem: `${pendentes7dias.length} pedido(s) com pagamento pendente há mais de 7 dias`,
          count: pendentes7dias.length,
          urgencia: "alta",
        });
      }

      if (prontoRetirada.length > 0) {
        alertas.push({
          tipo: "aguardando_retirada",
          mensagem: `${prontoRetirada.length} pedido(s) aguardando retirada`,
          count: prontoRetirada.length,
          urgencia: "media",
        });
      }

      return { alertas, total: alertas.length };
    }),

  // ── Enviar Cobrança WhatsApp ────────────────────────────────────────────────
  enviarCobrancaWhatsApp: adminOrManusAuthProcedure
    .input(z.object({
      orderId: z.number(),
      telefone: z.string(),
      mensagem: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const order = await db.select().from(orders)
        .where(eq(orders.id, input.orderId)).limit(1);

      if (!order.length) throw new Error("Pedido não encontrado");
      const o = order[0];

      const mensagem = input.mensagem ||
        `Olá! Seu pedido *#${o.orderNumber}* no valor de *R$ ${parseFloat(o.totalPrice).toFixed(2)}* está aguardando pagamento. Entre em contato para finalizar. Gráfica Ponto Digital.`;

      const telefone = input.telefone.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;

      // Registra cobrança enviada
      await db.update(financeiro)
        .set({ cobrancaEnviada: true, dataCobranca: Date.now(), atualizadoEm: new Date() })
        .where(eq(financeiro.pedidoId, input.orderId));

      return { whatsappUrl, mensagem };
    }),
});

// ─── Pix Payload Builder ─────────────────────────────────────────────────────

function buildPixPayload(
  key: string,
  name: string,
  city: string,
  amount: string,
  txid: string
): string {
  function field(id: string, value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${id}${len}${value}`;
  }

  const merchantAccountInfo = field("00", "BR.GOV.BCB.PIX") + field("01", key);
  const payload =
    field("00", "01") +
    field("26", merchantAccountInfo) +
    field("52", "0000") +
    field("53", "986") +
    field("54", amount) +
    field("58", "BR") +
    field("59", name.substring(0, 25)) +
    field("60", city.substring(0, 15)) +
    field("62", field("05", txid.substring(0, 25)));

  return payload + field("63", crc16(payload + "6304"));
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}
