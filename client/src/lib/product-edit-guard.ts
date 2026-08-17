import { normalizeProductPriceInput } from "./product-price-input";

export type ProductEditSnapshot = {
  name: string;
  description: string;
  price: string;
  pixPrice: string;
  cardPrice: string;
  resellerPrice: string;
  imageUrl: string;
  imageKey: string;
  galleryUrls: string[];
  segment: string;
  segmentIds: number[];
  calculationType: string;
  pricePerM2: string;
  pixPricePerM2: string;
  cardPricePerM2: string;
  resellerPricePerM2: string;
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  maxHeight: string;
  specifications: { label: string; value: string }[];
  tags: string[];
  tagPosition: string;
  cardDescription: string;
};

export function createProductEditSignature(form: ProductEditSnapshot): string {
  return JSON.stringify({
    ...form,
    price: normalizeProductPriceInput(form.price),
    pixPrice: normalizeProductPriceInput(form.pixPrice),
    cardPrice: normalizeProductPriceInput(form.cardPrice),
    resellerPrice: normalizeProductPriceInput(form.resellerPrice),
    pricePerM2: normalizeProductPriceInput(form.pricePerM2),
    pixPricePerM2: normalizeProductPriceInput(form.pixPricePerM2),
    cardPricePerM2: normalizeProductPriceInput(form.cardPricePerM2),
    resellerPricePerM2: normalizeProductPriceInput(form.resellerPricePerM2),
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

export function getProductEditExitAction(baseline: string | null, form: ProductEditSnapshot): "close" | "confirm" {
  return hasUnsavedProductChanges(baseline, form) ? "confirm" : "close";
}
