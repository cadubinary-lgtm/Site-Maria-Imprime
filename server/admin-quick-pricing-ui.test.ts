import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Edição rápida de precificação no painel", () => {
  it("oferece alteração direta de preços Pix e cartão por unidade de cobrança", () => {
    const source = readFileSync("client/src/pages/admin/AdminProducts.tsx", "utf8");

    expect(source).toContain("Preço rápido");
    expect(source).toContain("Unidade de cobrança");
    expect(source).toContain("Preço via Pix por m² (R$)");
    expect(source).toContain("Preço via Cartão por m² (R$)");
    expect(source).toContain("Preço via Pix por metro linear (R$)");
    expect(source).toContain("Preço via Cartão por metro linear (R$)");
    expect(source).toContain("handleQuickPricingSave");
    expect(source).toContain("pricePerM2: measureBased ? normalizedPixPrice : undefined");
    expect(source).toContain('toast.success("Preço atualizado com sucesso"');
    expect(source).toContain('position: "top-right"');
  });
});
