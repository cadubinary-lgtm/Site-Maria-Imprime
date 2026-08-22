import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { EDIT_PRODUCT_MODAL_LAYOUT, NEW_PRODUCT_FIELD_LAYOUT, PRODUCT_FORM_PANEL } from "../client/src/lib/new-product-layout";

const root = resolve(import.meta.dirname, "..");
const newProductSource = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");
const editProductSource = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");
const globalStyles = readFileSync(resolve(root, "client/src/index.css"), "utf8");

describe("layout horizontal de Novo Produto", () => {
  it("reutiliza a composição comercial e secundária do editor", () => {
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
    expect(newProductSource).toContain("EDIT_PRODUCT_MODAL_LAYOUT.details");
    expect(newProductSource).toContain("EDIT_PRODUCT_MODAL_LAYOUT.measureFields");
    expect(newProductSource).toContain("EDIT_PRODUCT_MODAL_LAYOUT.secondary");
    expect(newProductSource).not.toContain("${NEW_PRODUCT_FIELD_LAYOUT.segmentsAlignment}");
  });
});

describe("layout de Editar Produto", () => {
  it("usa um modal amplo e a mesma composição horizontal da criação", () => {
    expect(EDIT_PRODUCT_MODAL_LAYOUT.dialog).toContain("xl:max-w-[1480px]");
    expect(EDIT_PRODUCT_MODAL_LAYOUT.details).toContain("xl:grid-cols-12");
    expect(EDIT_PRODUCT_MODAL_LAYOUT.secondary).toContain("flex flex-col gap-4");
    // Fotos na col-1 row-1, Segmentos na col-2 row-1 (lado a lado), igual ao Novo Produto
    expect(editProductSource).toContain('sm:col-start-1 sm:row-start-1');
    expect(editProductSource).toContain('sm:col-start-2 sm:row-start-1');
    // Gabarito ocupa as 2 colunas na row-2
    expect(editProductSource).toContain('sm:col-span-2 sm:row-start-2');
    // Tags e Descrição do Card em coluna única abaixo (row-3)
    expect(editProductSource).toContain('sm:col-span-2 sm:row-start-3');
  });
});

describe("ordem dos campos de medidas de produto", () => {
  it("mantém Altura Mín antes de Largura Máx em Novo Produto e Editar Produto", () => {
    const newMinWidth = newProductSource.indexOf("Largura Mínima (m)");
    const newMinHeight = newProductSource.indexOf("Altura Mínima (m)");
    const newMaxWidth = newProductSource.indexOf("Largura Máxima (m)");
    const newMaxHeight = newProductSource.indexOf("Altura Máxima (m)");

    expect(newMinWidth).toBeGreaterThanOrEqual(0);
    expect(newMinHeight).toBeGreaterThan(newMinWidth);
    expect(newMaxWidth).toBeGreaterThan(newMinHeight);
    expect(newMaxHeight).toBeGreaterThan(newMaxWidth);

    const editMinWidth = editProductSource.indexOf("Largura Mín (m)");
    const editMinHeight = editProductSource.indexOf("Altura Mín (m)");
    const editMaxWidth = editProductSource.indexOf("Largura Máx (m)");
    const editMaxHeight = editProductSource.indexOf("Altura Máx (m)");

    expect(editMinWidth).toBeGreaterThanOrEqual(0);
    expect(editMinHeight).toBeGreaterThan(editMinWidth);
    expect(editMaxWidth).toBeGreaterThan(editMinHeight);
    expect(editMaxHeight).toBeGreaterThan(editMaxWidth);
  });

  it("mantém a linha de medidas fora da condição exclusiva de m² e metro linear", () => {
    const createConditionalPrices = newProductSource.indexOf(
      '{(createForm.calculationType === "m2" || createForm.calculationType === "metro_linear") && ('
    );
    const createMeasureRow = newProductSource.indexOf("/* Limites de medidas disponíveis para todos os tipos de cobrança. */");
    const editConditionalPrices = editProductSource.indexOf(
      '{((editForm as any).calculationType === "m2" || (editForm as any).calculationType === "metro_linear") && ('
    );
    const editMeasureRow = editProductSource.indexOf("/* Limites de medidas disponíveis para todos os tipos de cobrança. */");

    expect(createConditionalPrices).toBeGreaterThanOrEqual(0);
    expect(createMeasureRow).toBeGreaterThan(createConditionalPrices);
    expect(newProductSource.slice(createConditionalPrices, createMeasureRow)).toContain(")}");
    expect(newProductSource.slice(createMeasureRow)).toContain('id="create-minWidth"');

    expect(editConditionalPrices).toBeGreaterThanOrEqual(0);
    expect(editMeasureRow).toBeGreaterThan(editConditionalPrices);
    expect(editProductSource.slice(editConditionalPrices, editMeasureRow)).toContain(")}");
    expect(editProductSource.slice(editMeasureRow)).toContain('id="edit-minWidth"');
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
    expect(newProductSource).toContain("sm:grid-cols-2 sm:items-stretch");
    expect(editProductSource).toContain("Dados comerciais");
    expect(editProductSource).toContain("PRODUCT_FORM_PANEL.card");
    expect(editProductSource).toContain("sm:grid-cols-2 sm:items-stretch");
    expect(newProductSource.match(/Tags do Produto/g)!.length).toBeGreaterThanOrEqual(1);
    expect(editProductSource.match(/Tags do Produto/g)!.length).toBeGreaterThanOrEqual(1);
  });
});

describe("rolagem do painel administrativo", () => {
  it("mantém a página Novo Produto em uma única área de rolagem", () => {
    expect(globalStyles).toContain("body:has(.admin-visual-system)");
    expect(globalStyles).toContain("#root:has(.admin-visual-system)");
    expect(globalStyles).toContain("overflow: hidden;");
  });
});
