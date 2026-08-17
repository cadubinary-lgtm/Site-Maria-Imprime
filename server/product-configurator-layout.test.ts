import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");

describe("layout do configurador de produto", () => {
  it("não exibe o bloco de diferenciais ao lado do resumo do pedido", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).not.toContain("Nossos diferenciais");
    expect(source).not.toContain("COMPANY_DIFFERENTIALS");
    expect(source).toContain("Resumo do pedido");
    expect(source).toContain("Pagamento Seguro");
  });
});
