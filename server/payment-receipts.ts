import { eq } from "drizzle-orm";
import { paymentReceipts } from "../drizzle/schema";

export type ReceiptIssuer = {
  adminId?: number | null;
  name?: string | null;
} | null | undefined;

export async function ensurePaymentReceipt(
  db: any,
  order: any,
  financeiroId: number | null,
  paymentMethod: string,
  paidAt: number,
  issuer?: ReceiptIssuer,
) {
  const [existing] = await db.select().from(paymentReceipts).where(eq(paymentReceipts.orderId, order.id)).limit(1);
  if (existing) return existing;

  const receiptNumber = `REC-${new Date(paidAt).getFullYear()}-${String(order.id).padStart(6, "0")}`;
  await db.insert(paymentReceipts).values({
    receiptNumber,
    orderId: order.id,
    financeiroId,
    orderNumber: order.orderNumber,
    customerName: order.guestName || order.deliveryFullName || "Cliente",
    customerEmail: order.guestEmail || null,
    customerPhone: order.deliveryPhone || null,
    amount: order.totalPrice,
    paymentMethod,
    paidAt,
    issuedAt: Date.now(),
    issuedByAdminId: issuer?.adminId ?? null,
    issuedByAdminName: issuer?.name ?? "Administrador",
  });
  const [receipt] = await db.select().from(paymentReceipts).where(eq(paymentReceipts.orderId, order.id)).limit(1);
  return receipt;
}
