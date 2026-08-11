import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Edição rápida de precificação no painel", () => {
  it("oferece alteração direta de preço-base e unidade de cobrança na lista de produtos", () => {
    const source = readFileSync("client/src/pages/admin/AdminProducts.tsx", "utf8");

    expect(source).toContain("Preço rápido");
    expect(source).toContain("Unidade de cobrança");
    expect(source).toContain("Preço-base por m² (R$)");
    expect(source).toContain("Preço-base por metro linear (R$)");
    expect(source).toContain("handleQuickPricingSave");
    expect(source).toContain("pricePerM2: measureBased ? normalizedPrice : undefined");
  });
});
