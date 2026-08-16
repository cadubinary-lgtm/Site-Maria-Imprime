export function calculatePixDiscountedPrice(cardPrice: unknown, discountPercent: unknown): number | null {
  const price = Number.parseFloat(String(cardPrice ?? 0)) || 0;
  const percent = Math.max(0, Math.min(99.99, Number(discountPercent) || 0));
  if (price <= 0) return null;
  return Math.round(price * (1 - percent / 100) * 100) / 100;
}
