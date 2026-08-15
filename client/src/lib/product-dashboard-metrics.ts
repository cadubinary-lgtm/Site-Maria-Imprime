export type ProductDashboardSource = {
  id: number;
  imageUrl?: string | null;
  galleryUrls?: string[] | null;
  price?: number | string | null;
  pricePerM2?: number | string | null;
};

export function getProductDashboardMetrics(products: ProductDashboardSource[]) {
  const withImage = products.filter((product) => Boolean(product.imageUrl) || (product.galleryUrls?.length ?? 0) > 0).length;
  const withPrice = products.filter((product) => Number(product.price ?? product.pricePerM2 ?? 0) > 0).length;

  return {
    total: products.length,
    withImage,
    withoutImage: products.length - withImage,
    withPrice,
  };
}
