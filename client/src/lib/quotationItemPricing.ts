export function roundQuotationMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((Math.max(0, value) + Number.EPSILON) * 100) / 100;
}

export function parseQuotationCurrency(value: string): number {
  const sanitized = value.replace(/[R$\s]/g, "").trim();
  if (!sanitized) return 0;
  const normalized = sanitized.includes(",")
    ? sanitized.replace(/\./g, "").replace(",", ".")
    : sanitized;
  return roundQuotationMoney(Number.parseFloat(normalized));
}

export function resolveQuotationItemTotal(total: number, quantity: number) {
  const safeQuantity = Math.max(1, Math.trunc(quantity) || 1);
  const roundedTotal = roundQuotationMoney(total);
  return {
    totalPrice: roundedTotal,
    unitPrice: roundQuotationMoney(roundedTotal / safeQuantity),
  };
}
