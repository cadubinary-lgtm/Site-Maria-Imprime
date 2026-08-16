import { describe, expect, it } from "vitest";
import { createProductEditSignature, getProductEditExitAction, hasUnsavedProductChanges, shouldInitializeProductEditSession, type ProductEditSnapshot } from "../client/src/lib/product-edit-guard";
import { formatProductPriceInput, normalizeProductPriceInput } from "../client/src/lib/product-price-input";

const form: ProductEditSnapshot = {
  name: "Lona impressa",
  description: "Produto de teste",
  price: "100",
  pixPrice: "90",
  cardPrice: "100",
  resellerPrice: "",
  imageUrl: "/principal.webp",
  imageKey: "principal",
  galleryUrls: ["/verso.webp"],
  segmentIds: [2, 1],
  calculationType: "m2",
  pricePerM2: "100",
  pixPricePerM2: "90",
  cardPricePerM2: "100",
  resellerPricePerM2: "",
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

  it("não cria uma alteração nova ao completar os centavos do valor informado", () => {
    const baseline = createProductEditSignature(form);

    expect(formatProductPriceInput("60")).toBe("60,00");
    expect(normalizeProductPriceInput("60,00")).toBe("60.00");
    expect(hasUnsavedProductChanges(baseline, { ...form, pixPrice: "90,00", cardPrice: "100,00" })).toBe(false);
  });

  it("inicializa segmentos somente uma vez por sessão de edição", () => {
    expect(shouldInitializeProductEditSession(20, true, [])).toBe(true);
    expect(shouldInitializeProductEditSession(20, false, [])).toBe(false);
    expect(shouldInitializeProductEditSession(null, true, [])).toBe(false);
  });

  it("solicita confirmação somente quando existem mudanças pendentes", () => {
    const baseline = createProductEditSignature(form);
    expect(getProductEditExitAction(baseline, form)).toBe("close");
    expect(getProductEditExitAction(baseline, { ...form, name: "Produto alterado" })).toBe("confirm");
  });
});
