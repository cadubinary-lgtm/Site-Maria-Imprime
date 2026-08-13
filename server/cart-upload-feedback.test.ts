import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");

describe("feedback de upload ao adicionar ao carrinho", () => {
  it("exibe o percentual do upload no botão de compra", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain('uploadState.isUploading ? `Enviando arquivo... ${uploadState.progress}%` : "Processando..."');
  });

  it("orienta o cliente a aguardar enquanto o arquivo é enviado", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain("Seu arquivo está sendo enviado. Aguarde a conclusão para adicionarmos o produto ao carrinho.");
    expect(source).toContain('aria-live="polite"');
  });
});
