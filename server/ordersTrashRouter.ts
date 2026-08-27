import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  automationLogs,
  cashFlowEntries,
  deletedReceivedAccounts,
  deletedOrders,
  emailHistory,
  fileValidations,
  financeiro,
  financeiroNotificacoes,
  financialRecords,
  fiscalNotes,
  orderArtPreviews,
  orderItems,
  orderPayments,
  orders,
  orderStatusHistory,
  orderProductionStatusHistory,
  productionJobs,
  productionStatusHistory,
  paymentReceipts,
  sellerCommissionPayments,
  sellerCommissions,
  shipments,
} from "../drizzle/schema";
import { logAudit } from "./admin-auth";
import { getDb } from "./db";
import { router } from "./_core/trpc";
import { adminOrManusAuthProcedure } from "./routers-admin-auth";

function isUnavailableProductionStorage(error: unknown) {
  const candidate = error as { code?: string; errno?: number; message?: string; cause?: { message?: string } };
  const message = `${candidate?.message ?? ""} ${candidate?.cause?.message ?? ""}`;
  return candidate?.code === "ER_NO_SUCH_TABLE"
    || candidate?.errno === 1146
    || /production(Job|StatusHistory)/i.test(message) && /doesn't exist|unknown table|not found/i.test(message);
}

async function deleteProductionDependenciesForOrder(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, orderId: number) {
  await db.delete(orderProductionStatusHistory)
    .where(eq(orderProductionStatusHistory.orderId, orderId));

  let productionJobRows: Array<{ id: number }>;
  try {
    productionJobRows = await db.select({ id: productionJobs.id })
      .from(productionJobs)
      .where(eq(productionJobs.orderId, orderId));
  } catch (error) {
    if (isUnavailableProductionStorage(error)) return;
    throw error;
  }

  const productionJobIds = productionJobRows.map((job) => job.id);
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

async function deleteFinancialDependenciesForOrder(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, orderId: number) {
  const [financeiroRows, financialRecordRows] = await Promise.all([
    db.select({ id: financeiro.id }).from(financeiro).where(eq(financeiro.pedidoId, orderId)),
    db.select({ id: financialRecords.id }).from(financialRecords).where(eq(financialRecords.orderId, orderId)),
  ]);
  const financeiroIds = financeiroRows.map((record) => record.id);
  const financialRecordIds = financialRecordRows.map((record) => record.id);

  if (financeiroIds.length > 0) {
    await db.delete(financeiroNotificacoes)
      .where(inArray(financeiroNotificacoes.financeiroId, financeiroIds));
  }

  const cashFlowReferences = [
    and(eq(cashFlowEntries.referenceType, "pedido"), eq(cashFlowEntries.referenceId, orderId)),
    and(eq(cashFlowEntries.referenceType, "order"), eq(cashFlowEntries.referenceId, orderId)),
  ];
  if (financeiroIds.length > 0) {
    cashFlowReferences.push(
      and(eq(cashFlowEntries.referenceType, "financeiro"), inArray(cashFlowEntries.referenceId, financeiroIds)),
    );
  }
  if (financialRecordIds.length > 0) {
    cashFlowReferences.push(
      and(eq(cashFlowEntries.referenceType, "financial_record"), inArray(cashFlowEntries.referenceId, financialRecordIds)),
    );
  }
  await db.delete(cashFlowEntries).where(or(...cashFlowReferences));
  await db.delete(paymentReceipts).where(eq(paymentReceipts.orderId, orderId));
  await db.delete(financeiro).where(eq(financeiro.pedidoId, orderId));
  await db.delete(deletedReceivedAccounts).where(eq(deletedReceivedAccounts.orderId, orderId));
}

async function permanentlyDeleteOrder(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, orderId: number) {
  await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId));
  await db.delete(orderArtPreviews).where(eq(orderArtPreviews.orderId, orderId));
  await deleteProductionDependenciesForOrder(db, orderId);
  await deleteFinancialDependenciesForOrder(db, orderId);
  await db.delete(financialRecords).where(eq(financialRecords.orderId, orderId));
  await db.delete(fileValidations).where(eq(fileValidations.orderId, orderId));
  await db.delete(automationLogs).where(eq(automationLogs.orderId, orderId));
  await db.delete(shipments).where(eq(shipments.orderId, orderId));
  await db.delete(fiscalNotes).where(eq(fiscalNotes.orderId, orderId));
  const commissionRows = await db.select({ id: sellerCommissions.id })
    .from(sellerCommissions)
    .where(eq(sellerCommissions.orderId, orderId));
  const commissionIds = commissionRows.map((commission) => commission.id);
  if (commissionIds.length > 0) {
    await db.delete(sellerCommissionPayments)
      .where(inArray(sellerCommissionPayments.commissionId, commissionIds));
    await db.delete(sellerCommissions)
      .where(eq(sellerCommissions.orderId, orderId));
  }
  await db.delete(orderPayments).where(eq(orderPayments.orderId, orderId));
  await db.delete(emailHistory).where(eq(emailHistory.orderId, orderId));
  await db.delete(orderItems).where(eq(orderItems.orderId, orderId));
  await db.delete(orders).where(eq(orders.id, orderId));
  await db.delete(deletedOrders).where(eq(deletedOrders.orderId, orderId));
}

function requireAdmin(ctx: any) {
  const adminUser = ctx.adminUser;
  if (!adminUser) {
    throw new TRPCError({ code: "FORBIDDEN", message: "É necessário estar autenticado como administrador para acessar a lixeira de pedidos." });
  }
  return adminUser;
}

function requireSuperadmin(ctx: any) {
  const adminUser = requireAdmin(ctx);
  if (adminUser.role !== "superadmin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Superadmin pode excluir pedidos permanentemente." });
  }
  return adminUser;
}

export const ordersTrashRouter = router({
  list: adminOrManusAuthProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

    return db.select({
      trashId: deletedOrders.id,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      cliente: orders.deliveryFullName,
      valor: orders.totalPrice,
      status: orders.status,
      deletedAt: deletedOrders.deletedAt,
      deletedByAdminId: deletedOrders.deletedByAdminId,
      deletedByAdminName: deletedOrders.deletedByAdminName,
      deletionReason: deletedOrders.deletionReason,
    }).from(deletedOrders)
      .innerJoin(orders, eq(deletedOrders.orderId, orders.id))
      .orderBy(desc(deletedOrders.deletedAt));
  }),

  moveToTrash: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive(), reason: z.string().trim().min(3, "Informe um motivo com pelo menos 3 caracteres.").max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = requireAdmin(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado." });
      const [existing] = await db.select({ id: deletedOrders.id }).from(deletedOrders).where(eq(deletedOrders.orderId, input.orderId)).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Este pedido já está na lixeira." });

      await db.insert(deletedOrders).values({ orderId: input.orderId, deletedByAdminId: adminUser.adminId, deletedByAdminName: adminUser.name, deletionReason: input.reason, deletedAt: Date.now() });
      await logAudit({ adminId: adminUser.adminId, adminName: adminUser.name, action: "move_order_to_trash", entity: "deletedOrders", entityId: String(input.orderId), before: { orderNumber: order.orderNumber, status: order.status }, after: { deletionReason: input.reason }, ipAddress: ctx.req.ip });
      return { success: true };
    }),

  restore: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = requireAdmin(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [trashItem] = await db.select().from(deletedOrders).where(eq(deletedOrders.orderId, input.orderId)).limit(1);
      if (!trashItem) throw new TRPCError({ code: "NOT_FOUND", message: "Este pedido não está na lixeira." });
      await db.delete(deletedOrders).where(eq(deletedOrders.orderId, input.orderId));
      await logAudit({ adminId: adminUser.adminId, adminName: adminUser.name, action: "restore_order_from_trash", entity: "deletedOrders", entityId: String(input.orderId), before: { deletedAt: trashItem.deletedAt }, after: { restoredAt: Date.now() }, ipAddress: ctx.req.ip });
      return { success: true };
    }),

  permanentlyDelete: adminOrManusAuthProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const adminUser = requireSuperadmin(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      const [trashItem] = await db.select().from(deletedOrders).where(eq(deletedOrders.orderId, input.orderId)).limit(1);
      if (!trashItem) throw new TRPCError({ code: "NOT_FOUND", message: "Apenas pedidos na lixeira podem ser excluídos permanentemente." });
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      await permanentlyDeleteOrder(db, input.orderId);
      await logAudit({ adminId: adminUser.adminId, adminName: adminUser.name, action: "permanently_delete_order_from_trash", entity: "deletedOrders", entityId: String(input.orderId), before: { orderNumber: order?.orderNumber, deletionReason: trashItem.deletionReason }, after: { permanentlyDeletedAt: Date.now() }, ipAddress: ctx.req.ip });
      return { success: true };
    }),
});
