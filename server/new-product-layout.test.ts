import { describe, expect, it } from "vitest";
import { EDIT_PRODUCT_MODAL_LAYOUT, NEW_PRODUCT_FIELD_LAYOUT } from "../client/src/lib/new-product-layout";

describe("layout horizontal de Novo Produto", () => {
  it("mantém os campos essenciais distribuídos nas doze colunas de tela larga", () => {
    expect(NEW_PRODUCT_FIELD_LAYOUT.grid).toContain("xl:grid-cols-12");
    expect([
      NEW_PRODUCT_FIELD_LAYOUT.name,
      NEW_PRODUCT_FIELD_LAYOUT.calculation,
      NEW_PRODUCT_FIELD_LAYOUT.price,
      NEW_PRODUCT_FIELD_LAYOUT.segment,
    ]).toEqual([
      "xl:col-span-4",
      "xl:col-span-3",
      "xl:col-span-2",
      "xl:col-span-3",
    ]);
    expect(NEW_PRODUCT_FIELD_LAYOUT.description).toBe("xl:col-span-12");
    expect(NEW_PRODUCT_FIELD_LAYOUT.segmentsAlignment).toBe("xl:pt-[86px]");
  });
});

describe("layout de Editar Produto", () => {
  it("usa um modal amplo e a mesma composição horizontal da criação", () => {
    expect(EDIT_PRODUCT_MODAL_LAYOUT.dialog).toContain("xl:max-w-[1480px]");
    expect(EDIT_PRODUCT_MODAL_LAYOUT.details).toContain("xl:grid-cols-12");
    expect(EDIT_PRODUCT_MODAL_LAYOUT.secondary).toContain("xl:grid-cols-");
  });
});
