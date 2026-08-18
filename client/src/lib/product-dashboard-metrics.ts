export type ProductDashboardSource = {
  id: number;
  imageUrl?: string | null;
  galleryUrls?: string[] | null;
  price?: number | string | null;
  pricePerM2?: number | string | null;
  pixPrice?: number | string | null;
  cardPrice?: number | string | null;
  pixPricePerM2?: number | string | null;
  cardPricePerM2?: number | string | null;
};

export function getProductDashboardMetrics(products: ProductDashboardSource[]) {
  const withImage = products.filter((product) => Boolean(product.imageUrl) || (product.galleryUrls?.length ?? 0) > 0).length;
  const withPrice = products.filter((product) => Number(product.price ?? product.pricePerM2 ?? 0) > 0).length;
  const withPaymentPrices = products.filter((product) => {
    const pix = Number(product.pixPrice ?? product.pixPricePerM2 ?? product.price ?? product.pricePerM2 ?? 0);
    const card = Number(product.cardPrice ?? product.cardPricePerM2 ?? product.price ?? product.pricePerM2 ?? 0);
    return pix > 0 && card > 0;
  }).length;
  const readyForCatalog = products.filter((product) => {
    const hasImage = Boolean(product.imageUrl) || (product.galleryUrls?.length ?? 0) > 0;
    const pix = Number(product.pixPrice ?? product.pixPricePerM2 ?? product.price ?? product.pricePerM2 ?? 0);
    const card = Number(product.cardPrice ?? product.cardPricePerM2 ?? product.price ?? product.pricePerM2 ?? 0);
    return hasImage && pix > 0 && card > 0;
  }).length;

  return {
    total: products.length,
    withImage,
    withoutImage: products.length - withImage,
    withPrice,
    withPaymentPrices,
    readyForCatalog,
    needsReview: products.length - readyForCatalog,
  };
}
