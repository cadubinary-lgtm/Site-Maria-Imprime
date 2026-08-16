import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(
  resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx"),
  "utf8",
);

describe("preço inicial do configurador por m²", () => {
  it("mantém o preço-base de 1 m² enquanto as medidas ainda não foram informadas", () => {
    expect(source).toContain("if (isM2 && commercialProductPrice > 0)");
    expect(source).toContain("const chargeableArea = billedArea > 0 ? billedArea : 1;");
    expect(source).toContain("const productBase = commercialProductPrice * chargeableArea;");
  });

  it("mantém a validação de largura e altura antes de permitir a compra", () => {
    expect(source).toContain('if (isM2 && area === 0) missing.push({ id: "dimensions"');
  });
});
