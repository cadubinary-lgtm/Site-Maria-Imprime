import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

describe("preço rápido de produtos", () => {
  it("edita Pix, cartão e revenda para produtos por medida e por unidade", () => {
    expect(source).toContain("quickPixPrice");
    expect(source).toContain("quickCardPrice");
    expect(source).toContain("quickResellerPrice");
    expect(source).toContain("pixPricePerM2: measureBased ? normalizedPixPrice");
    expect(source).toContain("cardPricePerM2: measureBased ? normalizedCardPrice");
    expect(source).toContain("resellerPricePerM2: measureBased ? normalizedResellerPrice");
    expect(source).toContain("Preço via Pix por m² (R$)");
    expect(source).toContain("Preço via Cartão por m² (R$)");
    expect(source).toContain("Preço Revendedor por m² (R$)");
  });
});
