import type { ProductEditSnapshot } from "@/lib/product-edit-guard";

const DRAFT_VERSION = 1;

export type ProductEditDraft = {
  version: typeof DRAFT_VERSION;
  savedAt: number;
  baselineSignature: string;
  form: ProductEditSnapshot;
};

export function getProductEditDraftKey(productId: number): string {
  return `maria-imprime:product-edit-draft:${productId}`;
}

export function serializeProductEditDraft(draft: ProductEditDraft): string {
  return JSON.stringify(draft);
}

export function parseProductEditDraft(value: string | null): ProductEditDraft | null {
  if (!value) return null;

  try {
    const draft = JSON.parse(value) as ProductEditDraft;
    if (
      draft?.version !== DRAFT_VERSION ||
      typeof draft.savedAt !== "number" ||
      typeof draft.baselineSignature !== "string" ||
      !draft.form ||
      typeof draft.form.name !== "string" ||
      !Array.isArray(draft.form.galleryUrls) ||
      !Array.isArray(draft.form.segmentIds)
    ) {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}
