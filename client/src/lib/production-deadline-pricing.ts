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

export function formatProductionDeadlineSurcharge({
  rate,
  multiplier,
  unit,
  surcharge,
  quantity = 1,
}: {
  rate: number | string | null | undefined;
  multiplier: number | string | null | undefined;
  unit: string | null | undefined;
  surcharge: number | string | null | undefined;
  quantity?: number | string | null;
}) {
  const normalizedRate = Number(rate) || 0;
  const normalizedMultiplier = Number(multiplier) || 0;
  const normalizedSurcharge = Number(surcharge) || 0;
  const normalizedQuantity = Math.max(Number(quantity) || 1, 1);
  if (normalizedRate <= 0 || normalizedMultiplier <= 0 || normalizedSurcharge <= 0) return null;

  const format = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
  const commercialUnit = unit || "unidade";
  const unitSuffix = commercialUnit === "m²" ? " m²" : commercialUnit === "metro linear" ? " m" : "";
  const itemPart = normalizedQuantity > 1 ? ` × ${normalizedQuantity} ${normalizedQuantity === 1 ? "item" : "itens"}` : "";
  return `${format(normalizedRate)}/${commercialUnit} × ${normalizedMultiplier.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}${unitSuffix}${itemPart} = ${format(normalizedSurcharge * normalizedQuantity)}`;
}
