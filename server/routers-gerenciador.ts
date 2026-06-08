import { z } from "zod";
import { router, adminProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  orders,
  fiscalNotes,
  fiscalNoteItems,
  fiscalSettings,
  cashFlowEntries,
} from "../drizzle/schema";
import { eq, and, gte, lte, like, desc, sql, or } from "drizzle-orm";

// ============================================================
// GERENCIADOR FINANCEIRO - Router
// Lê dados existentes sem alterar nenhuma tabela existente
// Enums do sistema estão em PORTUGUÊS
// ============================================================

export const gerenciadorFinanceiroRouter = router({
  // ---- DASHBOARD METRICS ----
  getDashboardMetrics: adminProcedure
    .input(
      z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = Date.now();
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const start = input.startDate ?? startOfMonth.getTime();
      const end = input.endDate ?? now;

      const allOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, new Date(start)),
            lte(orders.createdAt, new Date(end))
          )
        );

      // Enums em português: "cancelado", "pago", "pendente", "entregue"
      const totalRevenue = allOrders
        .filter((o) => o.status !== "cancelado")
        .reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0);

      const approvedOrders = allOrders.filter(
        (o) => o.paymentStatus === "pago" || o.status === "entregue"
      );
      const approvedRevenue = approvedOrders.reduce(
        (sum, o) => sum + parseFloat(o.totalPrice || "0"),
        0
      );

      const pendingOrders = allOrders.filter(
        (o) => o.paymentStatus === "pendente" && o.status !== "cancelado"
      );
      const pendingRevenue = pendingOrders.reduce(
        (sum, o) => sum + parseFloat(o.totalPrice || "0"),
        0
      );

      const pickupOrders = allOrders.filter(
        (o) => o.shippingMethod === "retirada" || o.shippingMethod === "pagamento_retirada"
      );
      const pickupRevenue = pickupOrders.reduce(
        (sum, o) => sum + parseFloat(o.totalPrice || "0"),
        0
      );

      const todayOrders = allOrders.filter(
        (o) => new Date(o.createdAt).getTime() >= startOfDay.getTime()
      );
      const todayRevenue = todayOrders
        .filter((o) => o.status !== "cancelado")
        .reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0);

      return {
        totalOrders: allOrders.length,
        totalRevenue,
        approvedOrders: approvedOrders.length,
        approvedRevenue,
        pendingOrders: pendingOrders.length,
        pendingRevenue,
        pickupOrders: pickupOrders.length,
        pickupRevenue,
        todayOrders: todayOrders.length,
        todayRevenue,
        cancelledOrders: allOrders.filter((o) => o.status === "cancelado").length,
        averageTicket:
          approvedOrders.length > 0 ? approvedRevenue / approvedOrders.length : 0,
      };
    }),

  // ---- CONTAS A RECEBER ----
  getAccountsReceivable: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.limit;

      // Busca pedidos com pagamento pendente
      let query = db
        .select()
        .from(orders)
        .where(eq(orders.paymentStatus, "pendente") as any)
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(offset);

      const results = await query;

      const countQuery = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.paymentStatus, "pendente") as any);

      return { orders: results, total: countQuery[0]?.count ?? 0, page: input.page, limit: input.limit };
    }),

  // ---- CONTAS RECEBIDAS ----
  getAccountsReceived: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.limit;

      const conditions: ReturnType<typeof eq>[] = [eq(orders.paymentStatus, "pago") as any];
      if (input.startDate) conditions.push(gte(orders.createdAt, new Date(input.startDate)) as any);
      if (input.endDate) conditions.push(lte(orders.createdAt, new Date(input.endDate)) as any);

      const results = await db
        .select()
        .from(orders)
        .where(and(...conditions) as any)
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(offset);

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(...conditions) as any);

      return { orders: results, total: total[0]?.count ?? 0, page: input.page, limit: input.limit };
    }),

  // ---- PAGAMENTOS NA RETIRADA ----
  getPickupPayments: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.limit;

      const conditions: any[] = [
        or(eq(orders.shippingMethod, "retirada"), eq(orders.shippingMethod, "pagamento_retirada")),
      ];
      if (input.startDate) conditions.push(gte(orders.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(orders.createdAt, new Date(input.endDate)));
      if (input.status) conditions.push(eq(orders.status, input.status as any));

      const results = await db
        .select()
        .from(orders)
        .where(and(...conditions) as any)
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(offset);

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(and(...conditions) as any);

      return { orders: results, total: total[0]?.count ?? 0, page: input.page, limit: input.limit };
    }),

  // ---- FLUXO DE CAIXA ----
  getCashFlow: adminProcedure
    .input(
      z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        groupBy: z.enum(["day", "week", "month"]).default("day"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = Date.now();
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const start = input.startDate ?? startOfMonth.getTime();
      const end = input.endDate ?? now;

      const paidOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.paymentStatus, "pago") as any,
            gte(orders.createdAt, new Date(start)),
            lte(orders.createdAt, new Date(end))
          ) as any
        )
        .orderBy(orders.createdAt);

      const manualEntries = await db
        .select()
        .from(cashFlowEntries)
        .where(
          and(
            gte(cashFlowEntries.entryDate, start),
            lte(cashFlowEntries.entryDate, end)
          ) as any
        )
        .orderBy(cashFlowEntries.entryDate);

      const incomeByDate: Record<string, number> = {};
      const expenseByDate: Record<string, number> = {};

      for (const order of paidOrders) {
        const date = formatDateKey(new Date(order.createdAt), input.groupBy);
        incomeByDate[date] = (incomeByDate[date] ?? 0) + parseFloat(order.totalPrice || "0");
      }

      for (const entry of manualEntries) {
        const date = formatDateKey(new Date(entry.entryDate), input.groupBy);
        if (entry.entryType === "income") {
          incomeByDate[date] = (incomeByDate[date] ?? 0) + parseFloat(entry.amount || "0");
        } else {
          expenseByDate[date] = (expenseByDate[date] ?? 0) + parseFloat(entry.amount || "0");
        }
      }

      const allDates = Array.from(
        new Set([...Object.keys(incomeByDate), ...Object.keys(expenseByDate)])
      ).sort();

      const cashFlowData = allDates.map((date) => ({
        date,
        income: incomeByDate[date] ?? 0,
        expense: expenseByDate[date] ?? 0,
        balance: (incomeByDate[date] ?? 0) - (expenseByDate[date] ?? 0),
      }));

      const totalIncome = Object.values(incomeByDate).reduce((a, b) => a + b, 0);
      const totalExpense = Object.values(expenseByDate).reduce((a, b) => a + b, 0);

      return {
        cashFlowData,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        manualEntries,
      };
    }),

  // ---- ADICIONAR ENTRADA MANUAL ----
  addCashFlowEntry: adminProcedure
    .input(
      z.object({
        entryType: z.enum(["income", "expense"]),
        category: z.string().optional(),
        description: z.string().optional(),
        amount: z.number().positive(),
        entryDate: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(cashFlowEntries).values({
        entryType: input.entryType,
        category: input.category,
        description: input.description,
        amount: input.amount.toString(),
        entryDate: input.entryDate,
        createdBy: ctx.user.id,
      });
      return { success: true };
    }),

  // ---- RELATÓRIOS FINANCEIROS ----
  getFinancialReports: adminProcedure
    .input(
      z.object({
        startDate: z.number().optional(),
        endDate: z.number().optional(),
        reportType: z.enum(["revenue", "orders", "payment_methods"]).default("revenue"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = Date.now();
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const start = input.startDate ?? startOfMonth.getTime();
      const end = input.endDate ?? now;

      const allOrders = await db
        .select()
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, new Date(start)),
            lte(orders.createdAt, new Date(end)),
            eq(orders.paymentStatus, "pago") as any
          ) as any
        )
        .orderBy(desc(orders.createdAt));

      if (input.reportType === "payment_methods") {
        const byMethod: Record<string, { count: number; total: number }> = {};
        for (const order of allOrders) {
          const method = order.paymentMethod || "Não informado";
          if (!byMethod[method]) byMethod[method] = { count: 0, total: 0 };
          byMethod[method].count++;
          byMethod[method].total += parseFloat(order.totalPrice || "0");
        }
        return {
          reportType: "payment_methods",
          data: Object.entries(byMethod).map(([method, stats]) => ({ method, ...stats })),
          orders: allOrders,
          totalRevenue: allOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0),
          totalOrders: allOrders.length,
          averageTicket: allOrders.length > 0 ? allOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0) / allOrders.length : 0,
        };
      }

      return {
        reportType: input.reportType,
        data: [],
        orders: allOrders,
        totalRevenue: allOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0),
        totalOrders: allOrders.length,
        averageTicket: allOrders.length > 0 ? allOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice || "0"), 0) / allOrders.length : 0,
      };
    }),
});

// ============================================================
// GESTÃO FISCAL - Router
// ============================================================

export const gestaoFiscalRouter = router({
  // ---- LISTAR NOTAS FISCAIS ----
  listNotes: adminProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        status: z.enum(["pending", "issued", "cancelled", "voided", "error", "all"]).default("all"),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const offset = (input.page - 1) * input.limit;
      const conditions: any[] = [];

      if (input.status !== "all") conditions.push(eq(fiscalNotes.status, input.status));
      if (input.startDate) conditions.push(gte(fiscalNotes.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(fiscalNotes.createdAt, new Date(input.endDate)));
      if (input.search) {
        conditions.push(
          or(
            like(fiscalNotes.customerName, `%${input.search}%`),
            like(fiscalNotes.noteNumber, `%${input.search}%`),
            like(fiscalNotes.customerCpf, `%${input.search}%`),
            like(fiscalNotes.customerCnpj, `%${input.search}%`)
          )
        );
      }

      const results = await db
        .select()
        .from(fiscalNotes)
        .where(conditions.length > 0 ? (and(...conditions) as any) : undefined)
        .orderBy(desc(fiscalNotes.createdAt))
        .limit(input.limit)
        .offset(offset);

      const total = await db
        .select({ count: sql<number>`count(*)` })
        .from(fiscalNotes)
        .where(conditions.length > 0 ? (and(...conditions) as any) : undefined);

      return { notes: results, total: total[0]?.count ?? 0, page: input.page, limit: input.limit };
    }),

  // ---- OBTER NOTA POR ID ----
  getNoteById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const note = await db.select().from(fiscalNotes).where(eq(fiscalNotes.id, input.id)).limit(1);
      if (!note[0]) throw new Error("Nota fiscal não encontrada");
      const items = await db.select().from(fiscalNoteItems).where(eq(fiscalNoteItems.fiscalNoteId, input.id));
      return { ...note[0], items };
    }),

  // ---- OBTER DADOS DO PEDIDO PARA EMISSÃO ----
  getOrderForNote: adminProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const order = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order[0]) throw new Error("Pedido não encontrado");
      const existingNote = await db.select().from(fiscalNotes).where(eq(fiscalNotes.orderId, input.orderId)).limit(1);
      return { order: order[0], existingNote: existingNote[0] ?? null };
    }),

  // ---- CRIAR NOTA FISCAL ----
  createNote: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        noteType: z.enum(["nfse", "nfe"]).default("nfse"),
        customerName: z.string().optional(),
        customerCpf: z.string().optional(),
        customerCnpj: z.string().optional(),
        customerEmail: z.string().optional(),
        customerPhone: z.string().optional(),
        customerAddress: z.string().optional(),
        totalValue: z.number(),
        shippingValue: z.number().default(0),
        discountValue: z.number().default(0),
        paymentMethod: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            productName: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            totalPrice: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [result] = await db.insert(fiscalNotes).values({
        orderId: input.orderId,
        noteType: input.noteType,
        status: "pending",
        customerName: input.customerName,
        customerCpf: input.customerCpf,
        customerCnpj: input.customerCnpj,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerAddress: input.customerAddress,
        totalValue: input.totalValue.toString(),
        shippingValue: input.shippingValue.toString(),
        discountValue: input.discountValue.toString(),
        paymentMethod: input.paymentMethod,
        notes: input.notes,
      });
      const noteId = (result as any).insertId;
      if (input.items.length > 0) {
        await db.insert(fiscalNoteItems).values(
          input.items.map((item) => ({
            fiscalNoteId: noteId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
          }))
        );
      }
      return { success: true, noteId };
    }),

  // ---- ATUALIZAR STATUS DA NOTA ----
  updateNoteStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "issued", "cancelled", "voided", "error"]),
        noteNumber: z.string().optional(),
        errorMessage: z.string().optional(),
        pdfUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const updateData: any = { status: input.status, updatedAt: new Date() };
      if (input.status === "issued") {
        updateData.issueDate = Date.now();
        if (input.noteNumber) updateData.noteNumber = input.noteNumber;
        if (input.pdfUrl) updateData.pdfUrl = input.pdfUrl;
      }
      if (input.status === "cancelled") updateData.cancelDate = Date.now();
      if (input.errorMessage) updateData.errorMessage = input.errorMessage;
      await db.update(fiscalNotes).set(updateData).where(eq(fiscalNotes.id, input.id));
      return { success: true };
    }),

  // ---- CONFIGURAÇÕES FISCAIS ----
  getSettings: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const settings = await db.select().from(fiscalSettings).limit(1);
    return settings[0] ?? null;
  }),

  saveSettings: adminProcedure
    .input(
      z.object({
        companyName: z.string().optional(),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        stateRegistration: z.string().optional(),
        cityRegistration: z.string().optional(),
        address: z.string().optional(),
        zipCode: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        emitMode: z.enum(["manual", "on_payment", "on_completed"]).optional(),
        documentType: z.enum(["nfse", "nfe", "both"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(fiscalSettings).limit(1);
      if (existing[0]) {
        await db.update(fiscalSettings).set(input).where(eq(fiscalSettings.id, existing[0].id));
      } else {
        await db.insert(fiscalSettings).values(input);
      }
      return { success: true };
    }),

  // ---- MÉTRICAS FISCAIS ----
  getFiscalMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const allNotes = await db.select().from(fiscalNotes);
    const issued = allNotes.filter((n) => n.status === "issued");
    const pending = allNotes.filter((n) => n.status === "pending");
    const cancelled = allNotes.filter((n) => n.status === "cancelled");
    const totalIssued = issued.reduce((sum, n) => sum + parseFloat(n.totalValue || "0"), 0);

    return {
      total: allNotes.length,
      issued: issued.length,
      pending: pending.length,
      cancelled: cancelled.length,
      totalIssued,
    };
  }),
});

// Helper para formatar chave de data
function formatDateKey(date: Date, groupBy: "day" | "week" | "month"): string {
  if (groupBy === "month") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  if (groupBy === "week") {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  }
  return date.toISOString().split("T")[0];
}
