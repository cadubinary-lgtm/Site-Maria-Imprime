import { describe, expect, it } from "vitest";
import { NEW_PRODUCT_FIELD_LAYOUT } from "../client/src/lib/new-product-layout";

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
