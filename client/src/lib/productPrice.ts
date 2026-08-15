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

export type ProductPriceAudience = "final" | "reseller";

type PriceAwareProduct = {
  price: string | number;
  resellerPrice?: string | number | null;
  pricePerM2?: string | number | null;
  resellerPricePerM2?: string | number | null;
  calculationType?: string | null;
};

function resolvePrice(finalPrice: unknown, resellerPrice: unknown, audience: ProductPriceAudience) {
  const standard = parseFloat((finalPrice as any) ?? 0) || 0;
  const reseller = parseFloat((resellerPrice as any) ?? 0) || 0;
  return audience === "reseller" && reseller > 0 ? reseller : standard;
}

export function getProductPrice(product: PriceAwareProduct, audience: ProductPriceAudience = "final"): ProductPriceInfo {
  const type = product.calculationType || "unidade";

  if (type === "m2") {
    const val = resolvePrice(product.pricePerM2, product.resellerPricePerM2, audience);
    return {
      value: val,
      label: `R$ ${val.toFixed(2)}/m²`,
      suffix: "/m²",
    };
  }

  if (type === "metro_linear") {
    const val = resolvePrice(product.pricePerM2, product.resellerPricePerM2, audience);
    return {
      value: val,
      label: `R$ ${val.toFixed(2)}/ml`,
      suffix: "/ml",
    };
  }

  // unidade, pacote ou qualquer outro
  const val = resolvePrice(product.price, product.resellerPrice, audience);
  return {
    value: val,
    label: `R$ ${val.toFixed(2)}`,
    suffix: "",
  };
}

/** Retorna apenas o texto formatado do preço para uso simples */
export function formatProductPrice(product: PriceAwareProduct, audience: ProductPriceAudience = "final"): string {
  return getProductPrice(product, audience).label;
}
