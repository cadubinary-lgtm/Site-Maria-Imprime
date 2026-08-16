import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EDIT_PRODUCT_MODAL_LAYOUT, NEW_PRODUCT_FIELD_LAYOUT, PRODUCT_FORM_PANEL } from "../client/src/lib/new-product-layout";

const root = resolve(import.meta.dirname, "..");
const newProductSource = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");
const editProductSource = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

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

describe("padrão de painéis dos formulários de produto", () => {
  it("centraliza o acabamento retangular reutilizado pelos dois fluxos", () => {
    expect(PRODUCT_FORM_PANEL.card).toContain("rounded-xl");
    expect(PRODUCT_FORM_PANEL.card).toContain("border");
    expect(PRODUCT_FORM_PANEL.content).toContain("space-y-4");
    expect(PRODUCT_FORM_PANEL.inner).toContain("shadow-sm");
    expect(PRODUCT_FORM_PANEL.inner).toContain("space-y-4");
    expect(newProductSource).toContain("PRODUCT_FORM_PANEL.card");
    expect(newProductSource).toContain("PRODUCT_FORM_PANEL.inner");
    expect(editProductSource).toContain("Dados comerciais");
    expect(editProductSource).toContain("PRODUCT_FORM_PANEL.card");
  });
});
