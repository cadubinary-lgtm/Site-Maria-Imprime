import { describe, expect, it } from "vitest";
import { createProductEditSignature, hasUnsavedProductChanges, type ProductEditSnapshot } from "../client/src/lib/product-edit-guard";

const form: ProductEditSnapshot = {
  name: "Lona impressa",
  description: "Produto de teste",
  price: "100",
  imageUrl: "/principal.webp",
  imageKey: "principal",
  galleryUrls: ["/verso.webp"],
  segmentIds: [2, 1],
  calculationType: "m2",
  pricePerM2: "100",
  minWidth: "1",
  maxWidth: "3",
  minHeight: "1",
  maxHeight: "2",
  specifications: [{ label: "Material", value: "" }],
  tags: ["Novo", "Destaque"],
  tagPosition: "top-right",
};

describe("proteção de edição de produto", () => {
  it("reconhece alterações reais, mas ignora a ordem de segmentos e tags", () => {
    const baseline = createProductEditSignature(form);

    expect(hasUnsavedProductChanges(baseline, { ...form, segmentIds: [1, 2], tags: ["Destaque", "Novo"] })).toBe(false);
    expect(hasUnsavedProductChanges(baseline, { ...form, name: "Lona frontlight" })).toBe(true);
  });
});
