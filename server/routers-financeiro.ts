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
} from "../drizzle/schema";
import { eq, ne, and, gte, lte, desc, sql, or, like, isNull, isNotNull } from "drizzle-orm";

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
      const whereClause = and(...conditions);
      const offset = (input.page - 1) * input.limit;
      const [summary] = await db
        .select({ total: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause);
      const paginated = await db.select().from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
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
      const total = Number(summary?.total ?? 0);
      const totalValor = Number(summary?.totalValor ?? 0);

      return {
        data: paginated.map(mapOrderToFinanceiro),
        total,
        totalValor,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  // Move um recebimento para a lixeira sem apagar o pedido ou suas dependências.
  moveContaRecebidaToTrash: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = (ctx as any).adminUser;
      if (adminUser?.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Superadmin pode excluir uma conta recebida." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Recebimento não encontrado." });
      if (order.paymentStatus !== "pago") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Somente recebimentos confirmados podem ser movidos para a lixeira nesta tela." });
      }

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
        deletedAt: Date.now(),
      });

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "move_received_account_to_trash",
        entity: "deletedReceivedAccounts",
        entityId: String(input.orderId),
        before: { orderNumber: order.orderNumber, totalPrice: order.totalPrice, paymentStatus: order.paymentStatus },
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),

  listDeletedContasRecebidas: adminOrManusAuthProcedure
    .query(async ({ ctx }) => {
      const adminUser = (ctx as any).adminUser;
      if (adminUser?.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Superadmin pode acessar a lixeira de contas recebidas." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const rows = await db.select({
        trashId: deletedReceivedAccounts.id,
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        cliente: orders.guestName,
        deliveryFullName: orders.deliveryFullName,
        valor: orders.totalPrice,
        deletedAt: deletedReceivedAccounts.deletedAt,
        deletedByAdminName: deletedReceivedAccounts.deletedByAdminName,
      })
        .from(deletedReceivedAccounts)
        .innerJoin(orders, eq(deletedReceivedAccounts.orderId, orders.id))
        .orderBy(desc(deletedReceivedAccounts.deletedAt));

      return rows.map((row) => ({ ...row, cliente: row.cliente || row.deliveryFullName || "Cliente" }));
    }),

  restoreContaRecebida: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = (ctx as any).adminUser;
      if (adminUser?.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Superadmin pode restaurar uma conta recebida." });
      }
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
        await db.delete(productionJobs).where(eq(productionJobs.orderId, orderId));
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
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Atualiza o pedido existente (apenas paymentStatus e paymentMethod)
      await db.update(orders)
        .set({
          paymentStatus: "pago",
          paymentMethod: input.formaPagamento,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

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
              dataPagamento: Date.now(),
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
            dataPagamento: Date.now(),
            observacoes: input.observacoes,
            criadoPor: ctx.adminUser.adminId,
          });
        }
      }

      return { success: true };
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
            paymentStatus: input.status === "pago" || input.status === "retirado_cliente" || input.status === "retirado_terceiros" ? "pago" : "pendente",
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
      if (input.status === "pago" || input.status === "retirado_cliente" || input.status === "retirado_terceiros") {
        finData.dataPagamento = Date.now();
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

      // Entradas automáticas dos pedidos pagos
      const paidOrders = await db.select().from(orders)
        .where(and(
          eq(orders.paymentStatus, "pago"),
          gte(orders.createdAt, new Date(start)),
          lte(orders.createdAt, new Date(end))
        ));

      // Entradas/saídas manuais
      const manualEntries = await db.select().from(cashFlowEntries)
        .where(and(
          gte(cashFlowEntries.entryDate, start),
          lte(cashFlowEntries.entryDate, end)
        ))
        .orderBy(desc(cashFlowEntries.entryDate));

      // Agrupar por data
      const dateMap: Record<string, { income: number; expense: number; entries: any[] }> = {};

      for (const o of paidOrders) {
        const d = new Date(o.createdAt).toISOString().split("T")[0];
        if (!dateMap[d]) dateMap[d] = { income: 0, expense: 0, entries: [] };
        const val = parseFloat(o.totalPrice || "0");
        dateMap[d].income += val;
        dateMap[d].entries.push({
          id: `order_${o.id}`,
          tipo: "income",
          categoria: "Vendas",
          descricao: `Pedido #${o.orderNumber}`,
          valor: val,
          data: o.createdAt,
          origem: "automatico",
        });
      }

      for (const e of manualEntries) {
        const d = new Date(e.entryDate).toISOString().split("T")[0];
        if (!dateMap[d]) dateMap[d] = { income: 0, expense: 0, entries: [] };
        const val = parseFloat(e.amount || "0");
        if (e.entryType === "income") {
          dateMap[d].income += val;
        } else {
          dateMap[d].expense += val;
        }
        dateMap[d].entries.push({
          id: `manual_${e.id}`,
          tipo: e.entryType,
          categoria: e.category || "Outros",
          descricao: e.description || "",
          valor: val,
          data: new Date(e.entryDate),
          origem: "manual",
          entryId: e.id,
        });
      }

      const timeline = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({
          date,
          income: data.income,
          expense: data.expense,
          balance: data.income - data.expense,
          entries: data.entries,
        }));

      const totalIncome = timeline.reduce((s, d) => s + d.income, 0);
      const totalExpense = timeline.reduce((s, d) => s + d.expense, 0);

      return {
        timeline,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        manualEntries: manualEntries.map(e => ({
          id: e.id,
          tipo: e.entryType,
          categoria: e.category,
          descricao: e.description,
          valor: parseFloat(e.amount || "0"),
          data: e.entryDate,
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
