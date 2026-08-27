export const NEW_ORDER_STATUSES = ["pagamento_aprovado", "pagamento_retirada"] as const;
export const NEW_ORDER_STATUS = "pagamento_aprovado" as const;
export function isNewOrderStatus(status: string | null | undefined): boolean {
  return Boolean(status && NEW_ORDER_STATUSES.includes(status as (typeof NEW_ORDER_STATUSES)[number]));
}
