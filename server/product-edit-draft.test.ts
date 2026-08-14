import { describe, expect, it } from "vitest";
import { getProductEditDraftKey, parseProductEditDraft, serializeProductEditDraft } from "../client/src/lib/product-edit-draft";

const draft = {
  version: 1 as const,
  savedAt: 1723660000000,
  baselineSignature: "base-signature",
  form: {
    name: "Lona",
    description: "Teste",
    price: "10",
    imageUrl: "",
    imageKey: "",
    galleryUrls: [],
    segmentIds: [],
    calculationType: "unidade",
    pricePerM2: "",
    minWidth: "",
    maxWidth: "",
    minHeight: "",
    maxHeight: "",
    specifications: [],
    tags: [],
    tagPosition: "top-right",
  },
};

describe("rascunho local de edição de produto", () => {
  it("usa uma chave isolada por produto e rejeita dados inválidos", () => {
    expect(getProductEditDraftKey(42)).toBe("maria-imprime:product-edit-draft:42");
    expect(parseProductEditDraft(serializeProductEditDraft(draft))).toEqual(draft);
    expect(parseProductEditDraft('{"version":2}')).toBeNull();
  });
});
