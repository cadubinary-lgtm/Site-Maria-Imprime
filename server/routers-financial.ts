import { router, protectedProcedure, adminProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  recordFinancialTransaction,
  getOrderFinancialRecords,
  calculateOrderProfit,
  getDailySalesReport,
  getMonthlySalesReport,
  getTopSellingProducts,
  calculateAverageTicket,
  getProductCost,
  updateProductCost,
  getGrossProfitByPeriod,
  recordDailySalesReport,
  getDailySalesReportsByPeriod,
} from "./db-financial";

/**
 * Financial Router - Controle Financeiro e Dashboard
 */
export const financialRouter = router({
  /**
   * Registrar transação financeira (admin only)
   */
  recordTransaction: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
        type: z.enum(["venda", "custo", "lucro", "devolucao"]),
        amount: z.number().positive(),
        description: z.string().optional(),
        paymentMethod: z.enum([
          "dinheiro",
          "cartao_credito",
          "cartao_debito",
          "boleto",
          "pix",
          "transferencia",
          "cheque",
        ]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await recordFinancialTransaction({
        ...input,
        recordedBy: ctx.user.id,
      });
    }),

  /**
   * Obter registros financeiros de um pedido
   */
  getOrderRecords: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return await getOrderFinancialRecords(input.orderId);
    }),

  /**
   * Calcular lucro de um pedido
   */
  calculateOrderProfit: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return await calculateOrderProfit(input.orderId);
    }),

  /**
   * Obter relatório de faturamento diário
   */
  getDailySalesReport: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ input }) => {
      return await getDailySalesReport(input.date);
    }),

  /**
   * Obter relatório de faturamento mensal
   */
  getMonthlySalesReport: protectedProcedure
    .input(z.object({ year: z.number(), month: z.number().min(1).max(12) }))
    .query(async ({ input }) => {
      return await getMonthlySalesReport(input.year, input.month);
    }),

  /**
   * Obter produtos mais vendidos
   */
  getTopSellingProducts: protectedProcedure
    .input(z.object({ limit: z.number().default(10), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await getTopSellingProducts(input.limit, input.days);
    }),

  /**
   * Calcular ticket médio
   */
  calculateAverageTicket: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await calculateAverageTicket(input.days);
    }),

  /**
   * Obter custos de produção de um produto
   */
  getProductCost: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return await getProductCost(input.productId);
    }),

  /**
   * Atualizar custos de produção (admin only)
   */
  updateProductCost: adminProcedure
    .input(
      z.object({
        productId: z.number(),
        materialCost: z.number().optional(),
        laborCost: z.number().optional(),
        equipmentCost: z.number().optional(),
        overheadCost: z.number().optional(),
        profitMarginPercent: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await updateProductCost(input.productId, {
        ...input,
        lastUpdatedBy: ctx.user.id,
      });
    }),

  /**
   * Obter lucro bruto por período
   */
  getGrossProfitByPeriod: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(async ({ input }) => {
      return await getGrossProfitByPeriod(input.startDate, input.endDate);
    }),

  /**
   * Registrar relatório diário de vendas (admin only)
   */
  recordDailySalesReport: adminProcedure
    .input(
      z.object({
        reportDate: z.date(),
        totalSales: z.number(),
        totalCosts: z.number(),
        totalProfit: z.number(),
        ordersCount: z.number(),
        averageTicket: z.number(),
        topProduct: z.string().optional(),
        topProductQuantity: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await recordDailySalesReport(input);
    }),

  /**
   * Obter relatórios diários de um período
   */
  getDailySalesReportsByPeriod: protectedProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(async ({ input }) => {
      return await getDailySalesReportsByPeriod(input.startDate, input.endDate);
    }),
});
