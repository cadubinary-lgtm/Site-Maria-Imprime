type ProductRatingSource = {
  rating?: number | string | null;
  reviewCount?: number | string | null;
};

export function getProductRatingDisplay(source: ProductRatingSource) {
  const rating = Number(source.rating);
  const reviewCount = Number(source.reviewCount);

  if (!Number.isFinite(rating) || !Number.isFinite(reviewCount) || rating <= 0 || reviewCount <= 0) {
    return null;
  }

  return {
    rating: Math.min(5, rating).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    reviewCount: Math.round(reviewCount),
  };
}
