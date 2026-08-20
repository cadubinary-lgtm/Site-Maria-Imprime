import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const editProductSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/admin/AdminProducts.tsx"),
  "utf8",
);
const logisticsSource = readFileSync(
  resolve(import.meta.dirname, "../client/src/components/products/ProductLogisticsTab.tsx"),
  "utf8",
);

describe("Editar Produto — moeda brasileira e avanço automático", () => {
  it("mantém todos os preços em R$ 0,00 quando não há valor cadastrado", () => {
    expect(editProductSource).toContain('const DEFAULT_BRL_PRICE = "0,00";');
    expect(editProductSource).toContain("function toBrazilianEditPrice(value: unknown): string");
    expect(editProductSource).toContain("return formatted || DEFAULT_BRL_PRICE;");
    expect(editProductSource).toContain("resellerPrice: toBrazilianEditPrice(product.resellerPrice)");
    expect(editProductSource).toContain("resellerPricePerM2: toBrazilianEditPrice(product.resellerPricePerM2)");
  });

  it("confirma após 1000 ms todos os campos de digitação do formulário e do preço rápido", () => {
    expect(editProductSource.match(/scheduleProductPriceAutoAdvance/g)?.length).toBeGreaterThanOrEqual(19);
    for (const id of [
      "edit-name",
      "edit-description",
      "edit-pixPrice",
      "edit-cardPrice",
      "edit-resellerPrice",
      "edit-pixPricePerM2",
      "edit-cardPricePerM2",
      "edit-resellerPricePerM2",
      "edit-minWidth",
      "edit-maxWidth",
      "edit-minHeight",
      "edit-maxHeight",
      "edit-card-description-line-1",
      "edit-card-description-line-2",
    ]) {
      expect(editProductSource).toContain(`id="${id}"`);
    }
  });

  it("inclui Peso e Dimensões da logística no mesmo avanço de 1000 ms", () => {
    expect(logisticsSource).toContain("scheduleProductPriceAutoAdvance");
    expect(logisticsSource.match(/scheduleProductPriceAutoAdvance\(e\.currentTarget\)/g)?.length).toBe(4);
  });

  it("preserva o salvamento automático do formulário Editar Produto", () => {
    expect(editProductSource).toContain("await handleSave(true);");
    expect(editProductSource).toContain('setEditAutoSaveState("saved");');
    expect(editProductSource).toContain('"Salvo automaticamente"');
  });
});
