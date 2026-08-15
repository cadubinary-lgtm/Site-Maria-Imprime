export type DeadlineBillingType = "m2" | "metro_linear" | "unidade" | "pacote" | string | null | undefined;

interface DeadlineSurchargeInput {
  rate: number | string | null | undefined;
  calculationType: DeadlineBillingType;
  billedArea?: number | null;
  linearMeters?: number | null;
}

/**
 * Converte a taxa configurada no prazo para o adicional aplicável à configuração atual.
 * Produtos por área e metro linear cobram a urgência pela mesma base comercial do produto.
 */
export function getProductionDeadlineSurcharge({
  rate,
  calculationType,
  billedArea = 0,
  linearMeters = 0,
}: DeadlineSurchargeInput) {
  const normalizedRate = Number(rate) || 0;
  if (normalizedRate <= 0) return 0;

  if (calculationType === "m2") {
    return normalizedRate * Math.max(Number(billedArea) || 0, 0);
  }

  if (calculationType === "metro_linear") {
    return normalizedRate * Math.max(Number(linearMeters) || 0, 0);
  }

  return normalizedRate;
}
