export const NEW_ORDER_STATUS = "pagamento_aprovado" as const;

export function isNewOrderStatus(status: string | null | undefined): boolean {
  return status === NEW_ORDER_STATUS;
}
