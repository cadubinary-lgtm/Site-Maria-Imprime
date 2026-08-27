export type CommissionCalculationInput = {
  subtotal: number;
  discountAmount: number;
  commissionRate: number;
};

export type CommissionCalculation = {
  subtotal: number;
  discountAmount: number;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
};

function toCents(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100);
}

/**
 * Calcula a comissão apenas sobre produtos menos descontos. Frete e ajustes
 * comerciais não compõem a base, conforme a regra comercial definida.
 */
export function calculateSellerCommission(input: CommissionCalculationInput): CommissionCalculation {
  const subtotalCents = Math.max(0, toCents(input.subtotal));
  const discountCents = Math.max(0, Math.min(subtotalCents, toCents(input.discountAmount)));
  const baseCents = Math.max(0, subtotalCents - discountCents);
  const rate = Math.max(0, Math.min(100, Number(input.commissionRate) || 0));
  const commissionCents = Math.round((baseCents * rate) / 100);

  return {
    subtotal: subtotalCents / 100,
    discountAmount: discountCents / 100,
    baseAmount: baseCents / 100,
    commissionRate: rate,
    commissionAmount: commissionCents / 100,
  };
}
