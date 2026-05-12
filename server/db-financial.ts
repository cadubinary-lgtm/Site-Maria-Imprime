import { getDb } from "./db";
import { financialRecords, dailySalesReports, productCosts, orders, orderItems } from "../drizzle/schema";
import { eq, desc, sql, gte, lte } from "drizzle-orm";

/**
 * Registrar transação financeira
 */
export async function recordFinancialTransaction(data: {
  orderId: number;
  type: "venda" | "custo" | "lucro" | "devolucao";
  amount: number;
  description?: string;
  paymentMethod?: string;
  recordedBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(financialRecords).values({
    orderId: data.orderId,
    type: data.type,
    amount: data.amount as any,
    description: data.description,
    paymentMethod: (data.paymentMethod || undefined) as any,
    status: "pendente",
    recordedBy: data.recordedBy,
  });
}

/**
 * Obter registros financeiros de um pedido
 */
export async function getOrderFinancialRecords(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(financialRecords)
    .where(eq(financialRecords.orderId, orderId))
    .orderBy(desc(financialRecords.createdAt));
}

/**
 * Calcular lucro de um pedido
 */
export async function calculateOrderProfit(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const records = await db
    .select({
      totalVenda: sql<number>`SUM(CASE WHEN ${financialRecords.type} = 'venda' THEN ${financialRecords.amount} ELSE 0 END)`.as("totalVenda"),
      totalCusto: sql<number>`SUM(CASE WHEN ${financialRecords.type} = 'custo' THEN ${financialRecords.amount} ELSE 0 END)`.as("totalCusto"),
    })
    .from(financialRecords)
    .where(eq(financialRecords.orderId, orderId));

  const venda = records[0]?.totalVenda || 0;
  const custo = records[0]?.totalCusto || 0;
  const lucro = venda - custo;

  return { venda, custo, lucro };
}

/**
 * Obter relatório de faturamento diário
 */
export async function getDailySalesReport(date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const report = await db
    .select({
      totalSales: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)`.as("totalSales"),
      ordersCount: sql<number>`COUNT(DISTINCT ${orders.id})`.as("ordersCount"),
    })
    .from(orders)
    .where(
      sql`DATE(${orders.createdAt}) = DATE(${startOfDay})`
    );

  return report[0] || { totalSales: 0, ordersCount: 0 };
}

/**
 * Obter faturamento mensal
 */
export async function getMonthlySalesReport(year: number, month: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const report = await db
    .select({
      totalSales: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)`.as("totalSales"),
      ordersCount: sql<number>`COUNT(DISTINCT ${orders.id})`.as("ordersCount"),
      averageTicket: sql<number>`COALESCE(AVG(${orders.totalPrice}), 0)`.as("averageTicket"),
    })
    .from(orders)
    .where(
      sql`${orders.createdAt} >= ${startDate} AND ${orders.createdAt} <= ${endDate}`
    );

  return report[0] || { totalSales: 0, ordersCount: 0, averageTicket: 0 };
}

/**
 * Obter produtos mais vendidos
 */
export async function getTopSellingProducts(limit: number = 10, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const topProducts = await db
    .select({
      productId: orderItems.productId,
      totalQuantity: sql<number>`SUM(${orderItems.quantity})`.as("totalQuantity"),
      totalRevenue: sql<number>`SUM(CAST(${orderItems.priceAtOrder} AS DECIMAL(15,2)) * ${orderItems.quantity})`.as("totalRevenue"),
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(gte(orders.createdAt, startDate))
    .groupBy(orderItems.productId)
    .orderBy(desc(sql<number>`SUM(${orderItems.quantity})`))
    .limit(limit);

  return topProducts;
}

/**
 * Calcular ticket médio
 */
export async function calculateAverageTicket(days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const result = await db
    .select({
      averageTicket: sql<number>`AVG(${orders.totalPrice})`.as("averageTicket"),
      totalOrders: sql<number>`COUNT(*)`.as("totalOrders"),
    })
    .from(orders)
    .where(gte(orders.createdAt, startDate));

  return result[0] || { averageTicket: 0, totalOrders: 0 };
}

/**
 * Obter custos de produção por produto
 */
export async function getProductCost(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(productCosts)
    .where(eq(productCosts.productId, productId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Atualizar custos de produção
 */
export async function updateProductCost(
  productId: number,
  data: {
    materialCost?: number;
    laborCost?: number;
    equipmentCost?: number;
    overheadCost?: number;
    profitMarginPercent?: number;
    lastUpdatedBy?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular custo total
  const materialCost = data.materialCost || 0;
  const laborCost = data.laborCost || 0;
  const equipmentCost = data.equipmentCost || 0;
  const overheadCost = data.overheadCost || 0;
  const totalCost = materialCost + laborCost + equipmentCost + overheadCost;

  // Verificar se já existe
  const existing = await getProductCost(productId);

  if (existing) {
    return await db
      .update(productCosts)
      .set({
        totalCost: totalCost as any,
        profitMarginPercent: (data.profitMarginPercent || existing.profitMarginPercent) as any,
        lastUpdatedBy: data.lastUpdatedBy,
      })
      .where(eq(productCosts.productId, productId));
  } else {
    return await db.insert(productCosts).values({
      productId,
      materialCost: (data.materialCost || 0) as any,
      laborCost: (data.laborCost || 0) as any,
      equipmentCost: (data.equipmentCost || 0) as any,
      overheadCost: (data.overheadCost || 0) as any,
      totalCost: totalCost as any,
      profitMarginPercent: (data.profitMarginPercent || 30) as any,
      lastUpdatedBy: data.lastUpdatedBy,
    });
  }
}

/**
 * Obter lucro bruto por período
 */
export async function getGrossProfitByPeriod(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Simplificar query: apenas somar totalPrice dos pedidos no período
  const result = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(${orders.totalPrice}), 0)`.as("totalRevenue"),
    })
    .from(orders)
    .where(
      sql`DATE(${orders.createdAt}) >= DATE(${startDate}) AND DATE(${orders.createdAt}) <= DATE(${endDate})`
    );

  const revenue = parseFloat(String(result[0]?.totalRevenue || 0));
  // TODO: Implementar cálculo de custos totais quando tabela productCosts estiver populada
  const costs = 0;
  const profit = revenue - costs;

  return { revenue, costs, profit };
}

/**
 * Registrar relatório diário de vendas
 */
export async function recordDailySalesReport(data: {
  reportDate: Date;
  totalSales: number;
  totalCosts: number;
  totalProfit: number;
  ordersCount: number;
  averageTicket: number;
  topProduct?: string;
  topProductQuantity?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(dailySalesReports).values({
    reportDate: data.reportDate,
    totalSales: data.totalSales as any,
    totalCosts: data.totalCosts as any,
    totalProfit: data.totalProfit as any,
    ordersCount: data.ordersCount,
    averageTicket: data.averageTicket as any,
    topProduct: data.topProduct,
    topProductQuantity: data.topProductQuantity || 0,
  });
}

/**
 * Obter relatórios diários de um período
 */
export async function getDailySalesReportsByPeriod(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(dailySalesReports)
    .where(
      sql`${dailySalesReports.reportDate} >= ${startDate} AND ${dailySalesReports.reportDate} <= ${endDate}`
    )
    .orderBy(desc(dailySalesReports.reportDate));
}
