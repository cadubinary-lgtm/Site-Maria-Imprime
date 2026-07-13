/**
 * Retorna o preço de exibição correto de um produto conforme o tipo de cobrança.
 * - m² e metro_linear: usa pricePerM2 com sufixo "/m²" ou "/ml"
 * - unidade / pacote: usa price
 */
export interface ProductPriceInfo {
  value: number;
  label: string;       // Ex: "R$ 2,00/m²"
  suffix: string;      // Ex: "/m²", "/ml", ""
}

export function getProductPrice(product: {
  price: string | number;
  pricePerM2?: string | number | null;
  calculationType?: string | null;
}): ProductPriceInfo {
  const type = product.calculationType || "unidade";

  if (type === "m2") {
    const val = parseFloat((product.pricePerM2 as any) ?? 0) || 0;
    return {
      value: val,
      label: `R$ ${val.toFixed(2)}/m²`,
      suffix: "/m²",
    };
  }

  if (type === "metro_linear") {
    const val = parseFloat((product.pricePerM2 as any) ?? 0) || 0;
    return {
      value: val,
      label: `R$ ${val.toFixed(2)}/ml`,
      suffix: "/ml",
    };
  }

  // unidade, pacote ou qualquer outro
  const val = parseFloat((product.price as any) ?? 0) || 0;
  return {
    value: val,
    label: `R$ ${val.toFixed(2)}`,
    suffix: "",
  };
}

/** Retorna apenas o texto formatado do preço para uso simples */
export function formatProductPrice(product: {
  price: string | number;
  pricePerM2?: string | number | null;
  calculationType?: string | null;
}): string {
  return getProductPrice(product).label;
}
