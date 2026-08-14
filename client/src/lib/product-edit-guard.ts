export type ProductEditSnapshot = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  imageKey: string;
  galleryUrls: string[];
  segmentIds: number[];
  calculationType: string;
  pricePerM2: string;
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  maxHeight: string;
  specifications: { label: string; value: string }[];
  tags: string[];
  tagPosition: string;
};

export function createProductEditSignature(form: ProductEditSnapshot): string {
  return JSON.stringify({
    ...form,
    galleryUrls: [...form.galleryUrls],
    segmentIds: [...form.segmentIds].sort((a, b) => a - b),
    specifications: form.specifications.map((spec) => ({ ...spec })),
    tags: [...form.tags].sort(),
  });
}

export function hasUnsavedProductChanges(baseline: string | null, form: ProductEditSnapshot): boolean {
  return baseline !== null && baseline !== createProductEditSignature(form);
}

export function shouldInitializeProductEditSession(
  editingId: number | null,
  waitingInitialSegments: boolean,
  productSegments: unknown[] | undefined,
): boolean {
  return Boolean(editingId && waitingInitialSegments && productSegments);
}
