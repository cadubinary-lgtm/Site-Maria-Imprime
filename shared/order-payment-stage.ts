export type OrderPaymentStage = "aguardando_pagamento" | "pagamento_retirada" | "pagamento_aprovado";

export function getOrderPaymentStage(order: { status?: string | null; paymentStatus?: string | null; paymentMethod?: string | null }): OrderPaymentStage {
  if (order.status === "pagamento_retirada" || order.paymentMethod === "pagar_na_retirada") {
    return "pagamento_retirada";
  }
  if (order.status === "aguardando_pagamento" || order.paymentStatus !== "pago") {
    return "aguardando_pagamento";
  }
  return "pagamento_aprovado";
}
