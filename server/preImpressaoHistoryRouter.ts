import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  automationLogs,
  emailHistory,
  fileValidations,
  financialRecords,
  fiscalNotes,
  orderArtPreviews,
  orderItems,
  orderPayments,
  orders,
  orderStatusHistory,
  productionJobs,
  shipments,
} from "../drizzle/schema";
import { logAudit } from "./admin-auth";
import { getDb } from "./db";
import { router } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";

const HISTORY_STATUSES = ["pronto_entrega", "pronto_retirada", "entregue"] as const;

export const preImpressaoHistoryRouter = router({
  getHistory: adminOrManusAuthProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

      const whereClause = inArray(orders.status, HISTORY_STATUSES);
      const [summary] = await db.select({ total: sql<number>`count(*)` }).from(orders).where(whereClause);
      const total = Number(summary?.total ?? 0);
      const data = await db.select().from(orders)
        .where(whereClause)
        .orderBy(desc(orders.updatedAt), desc(orders.createdAt))
        .limit(input.limit)
        .offset((input.page - 1) * input.limit);

      return {
        data,
        total,
        page: input.page,
        totalPages: Math.max(1, Math.ceil(total / input.limit)),
      };
    }),

  deleteHistoryRecord: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = (ctx as any).adminUser;
      if (adminUser?.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Superadmin pode excluir permanentemente registros do histórico." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Registro histórico não encontrado." });
      if (!HISTORY_STATUSES.includes(order.status as typeof HISTORY_STATUSES[number])) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Somente pedidos presentes no Histórico da Pré-Impressão podem ser excluídos nesta tela." });
      }

      await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, input.orderId));
      await db.delete(orderArtPreviews).where(eq(orderArtPreviews.orderId, input.orderId));
      await db.delete(productionJobs).where(eq(productionJobs.orderId, input.orderId));
      await db.delete(financialRecords).where(eq(financialRecords.orderId, input.orderId));
      await db.delete(fileValidations).where(eq(fileValidations.orderId, input.orderId));
      await db.delete(automationLogs).where(eq(automationLogs.orderId, input.orderId));
      await db.delete(shipments).where(eq(shipments.orderId, input.orderId));
      await db.delete(fiscalNotes).where(eq(fiscalNotes.orderId, input.orderId));
      await db.delete(orderPayments).where(eq(orderPayments.orderId, input.orderId));
      await db.delete(emailHistory).where(eq(emailHistory.orderId, input.orderId));
      await db.delete(orderItems).where(eq(orderItems.orderId, input.orderId));
      await db.delete(orders).where(eq(orders.id, input.orderId));

      await logAudit({
        adminId: adminUser.adminId,
        adminName: adminUser.name,
        action: "permanently_delete_prepress_history_record",
        entity: "orders",
        entityId: String(input.orderId),
        before: { orderNumber: order.orderNumber, status: order.status, totalPrice: order.totalPrice },
        ipAddress: ctx.req.ip,
      });

      return { success: true };
    }),
});
