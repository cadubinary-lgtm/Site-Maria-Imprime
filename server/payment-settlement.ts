import { eq } from "drizzle-orm";
import { financeiro, orders } from "../drizzle/schema";

export type ApprovedOnlinePaymentMethod = "pix" | "cartao_credito";

function mapShippingMethod(method: string | null): "retirada_loja" | "moto_express" | "transportadora" | "correios" | "outro" {
  if (!method) return "outro";
  if (method === "pickup" || method === "retirada" || method === "pagamento_retirada") return "retirada_loja";
  if (method === "moto_express") return "moto_express";
  if (method.startsWith("carrier_")) return "transportadora";
  if (method === "correios") return "correios";
  return "outro";
}

/**
 * Registra uma aprovação online sem alterar o estágio operacional já alcançado
 * pelo pedido. A mesma operação alimenta a visão de Contas Recebidas.
 */
export async function settleApprovedOnlinePayment(
  db: any,
  input: { orderId: number; paymentMethod: ApprovedOnlinePaymentMethod; paidAt?: number },
) {
  const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!order) throw new Error("Pedido não encontrado para registrar o pagamento aprovado.");

  const paidAt = input.paidAt ?? Date.now();
  await db.update(orders)
    .set({
      paymentStatus: "pago",
      paymentMethod: input.paymentMethod,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, input.orderId));

  const [existingFinanceRecord] = await db.select({ id: financeiro.id })
    .from(financeiro)
    .where(eq(financeiro.pedidoId, input.orderId))
    .limit(1);

  if (existingFinanceRecord) {
    await db.update(financeiro)
      .set({
        status: "pago",
        dataPagamento: paidAt,
        formaPagamento: input.paymentMethod,
        atualizadoEm: new Date(),
      })
      .where(eq(financeiro.pedidoId, input.orderId));
  } else {
    await db.insert(financeiro).values({
      pedidoId: order.id,
      orderNumber: order.orderNumber,
      cliente: order.guestName || order.deliveryFullName || "Cliente",
      telefone: order.deliveryPhone || "",
      email: order.guestEmail || "",
      valor: order.totalPrice,
      formaPagamento: input.paymentMethod,
      formaEntrega: mapShippingMethod(order.shippingMethod),
      status: "pago",
      dataPagamento: paidAt,
      observacoes: "Pagamento online aprovado automaticamente.",
    });
  }

  return { orderId: order.id, paymentMethod: input.paymentMethod, paidAt };
}
