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
export type ProductPaymentMethod = "pix" | "card";

type PriceAwareProduct = {
  price: string | number;
  pixPrice?: string | number | null;
  cardPrice?: string | number | null;
  resellerPrice?: string | number | null;
  pricePerM2?: string | number | null;
  pixPricePerM2?: string | number | null;
  cardPricePerM2?: string | number | null;
  resellerPricePerM2?: string | number | null;
  calculationType?: string | null;
};

function toPositivePrice(value: unknown) {
  return parseFloat((value as any) ?? 0) || 0;
}

function resolvePrice(
  pixPrice: unknown,
  cardPrice: unknown,
  legacyPrice: unknown,
  resellerPrice: unknown,
  audience: ProductPriceAudience,
  paymentMethod: ProductPaymentMethod,
) {
  const pix = toPositivePrice(pixPrice);
  const card = toPositivePrice(cardPrice);
  const legacy = toPositivePrice(legacyPrice);
  const reseller = parseFloat((resellerPrice as any) ?? 0) || 0;
  if (audience === "reseller" && reseller > 0) return reseller;
  if (paymentMethod === "card" && card > 0) return card;
  if (paymentMethod === "pix" && pix > 0) return pix;
  return legacy;
}

export function getProductPrice(
  product: PriceAwareProduct,
  audience: ProductPriceAudience = "final",
  paymentMethod: ProductPaymentMethod = "pix",
): ProductPriceInfo {
  const type = product.calculationType || "unidade";

  if (type === "m2") {
    const val = resolvePrice(product.pixPricePerM2, product.cardPricePerM2, product.pricePerM2, product.resellerPricePerM2, audience, paymentMethod);
    return {
      value: val,
      label: `R$ ${val.toFixed(2)}/m²`,
      suffix: "/m²",
    };
  }

  if (type === "metro_linear") {
    const val = resolvePrice(product.pixPricePerM2, product.cardPricePerM2, product.pricePerM2, product.resellerPricePerM2, audience, paymentMethod);
    return {
      value: val,
      label: `R$ ${val.toFixed(2)}/ml`,
      suffix: "/ml",
    };
  }

  // unidade, pacote ou qualquer outro
  const val = resolvePrice(product.pixPrice, product.cardPrice, product.price, product.resellerPrice, audience, paymentMethod);
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

export function getProductPaymentPrices(product: PriceAwareProduct, audience: ProductPriceAudience = "final") {
  return {
    pix: getProductPrice(product, audience, "pix"),
    card: getProductPrice(product, audience, "card"),
  };
}

export function getPixDiscountInfo(product: PriceAwareProduct, audience: ProductPriceAudience = "final") {
  const { pix, card } = getProductPaymentPrices(product, audience);
  const savings = Math.max(0, card.value - pix.value);
  const percentage = card.value > 0 ? Math.round((savings / card.value) * 100) : 0;

  return {
    eligible: savings > 0.004 && percentage > 0,
    savings,
    percentage,
    label: percentage > 0 ? `${percentage}% OFF no Pix` : "Desconto no Pix",
  };
}
