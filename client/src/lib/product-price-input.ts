/**
 * Normaliza a entrada monetária para o formato decimal aceito pela API.
 * Aceita tanto vírgula quanto ponto durante a digitação.
 */
export function normalizeProductPriceInput(value: string): string {
  const rawValue = value.trim().replace(/^R\$\s*/i, "");
  if (!rawValue) return "";

  const normalizedSeparator = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : rawValue;
  const amount = Number(normalizedSeparator);

  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : rawValue;
}

/** Retorna um número para validações sem perder a vírgula brasileira. */
export function parseProductPriceInput(value: string): number {
  const normalized = normalizeProductPriceInput(value);
  return normalized ? Number(normalized) : Number.NaN;
}

/** Formata o campo ao final da edição, completando os centavos visíveis. */
export function formatProductPriceInput(value: string): string {
  const normalized = normalizeProductPriceInput(value);
  return normalized ? normalized.replace(".", ",") : "";
}
