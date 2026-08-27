import { and, eq, ne } from "drizzle-orm";
import { getDb } from "./db";
import { adminAccounts, orderItems, orders, sellerCommissions, sellers } from "../drizzle/schema";
import { calculateSellerCommission } from "./sellerCommission";

export type CommissionSource = "quotation_conversion" | "seller_order" | "admin_assignment";

export type EnsureCommissionOptions = {
  source: CommissionSource;
  discountAmount?: number;
};

function asNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Cria uma única comissão por pedido e grava todos os valores comerciais como
 * snapshot. Chamadas repetidas preservam o histórico já existente.
 */
export async function ensureSellerCommissionForOrder(
  db: any,
  orderId: number,
  options: EnsureCommissionOptions,
) {
  const [existing] = await db
    .select()
    .from(sellerCommissions)
    .where(eq(sellerCommissions.orderId, orderId))
    .limit(1);
  if (existing) return existing;

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order?.sellerId) return null;

  const [seller] = await db
    .select({
      id: sellers.id,
      commissionRate: sellers.commissionRate,
      sellerStatus: sellers.status,
      sellerName: adminAccounts.name,
    })
    .from(sellers)
    .innerJoin(adminAccounts, eq(sellers.adminAccountId, adminAccounts.id))
    .where(eq(sellers.id, order.sellerId))
    .limit(1);
  if (!seller || seller.sellerStatus !== "active") return null;

  const items = await db
    .select({ quantity: orderItems.quantity, unitPrice: orderItems.priceAtOrder })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));
  const subtotal = items.reduce((total: number, item: any) => total + asNumber(item.quantity) * asNumber(item.unitPrice), 0);
  const calculation = calculateSellerCommission({
    subtotal,
    discountAmount: options.discountAmount ?? 0,
    commissionRate: asNumber(seller.commissionRate),
  });
  const now = Date.now();
  const status = order.paymentStatus === "pago" ? "a_pagar" : "prevista";

  await db.insert(sellerCommissions).values({
    orderId,
    sellerId: seller.id,
    orderNumberSnapshot: order.orderNumber,
    sellerNameSnapshot: seller.sellerName,
    subtotalSnapshot: calculation.subtotal.toFixed(2),
    discountAmountSnapshot: calculation.discountAmount.toFixed(2),
    commissionBaseAmount: calculation.baseAmount.toFixed(2),
    commissionRateSnapshot: calculation.commissionRate.toFixed(2),
    commissionAmount: calculation.commissionAmount.toFixed(2),
    source: options.source,
    status,
    eligibleAt: status === "a_pagar" ? now : null,
    createdAt: now,
    updatedAt: now,
  } as any);

  const [created] = await db
    .select()
    .from(sellerCommissions)
    .where(eq(sellerCommissions.orderId, orderId))
    .limit(1);
  return created ?? null;
}

/** Atualiza somente o estado da comissão — nunca reescreve seu snapshot financeiro. */
export async function reconcileSellerCommissionForOrder(orderId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  await (db as any).transaction(async (tx: any) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order?.sellerId) return;

    let [commission] = await tx
      .select()
      .from(sellerCommissions)
      .where(eq(sellerCommissions.orderId, orderId))
      .limit(1);

    if (!commission && order.status !== "cancelado") {
      commission = await ensureSellerCommissionForOrder(tx, orderId, { source: "seller_order" });
    }
    if (!commission) return;

    const now = Date.now();
    if (order.status === "cancelado" && commission.status !== "paga") {
      await tx.update(sellerCommissions)
        .set({ status: "cancelada", canceledAt: now, canceledReason: "Pedido cancelado", updatedAt: now })
        .where(and(eq(sellerCommissions.id, commission.id), ne(sellerCommissions.status, "paga")));
      return;
    }

    if (order.paymentStatus === "pago" && commission.status === "prevista") {
      await tx.update(sellerCommissions)
        .set({ status: "a_pagar", eligibleAt: now, updatedAt: now })
        .where(and(eq(sellerCommissions.id, commission.id), eq(sellerCommissions.status, "prevista")));
    }
  });
}
