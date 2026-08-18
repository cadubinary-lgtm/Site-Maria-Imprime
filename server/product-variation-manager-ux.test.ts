import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/components/products/ProductVariationManager.tsx"), "utf8");

describe("gestão de variações de produto", () => {
  it("oferece controles acessíveis para expandir, excluir e reordenar variações", () => {
    expect(source).toContain('aria-controls={`variation-options-${vt.id}`}');
    expect(source).toContain('aria-label={`Excluir variação ${vt.name}`}');
    expect(source).toContain('aria-label={`Arrastar ${vt.name} para reordenar`}');
    expect(source).toContain('id={`variation-options-${vt.id}`}');
  });

  it("associa busca e escolhas de segmento e produto aos seus estados", () => {
    expect(source).toContain('htmlFor="variation-product-search"');
    expect(source).toContain('id="variation-product-search"');
    expect(source).toContain('aria-pressed={selectedSegmentId === null}');
    expect(source).toContain('aria-pressed={selectedProductId === product.id}');
  });

  it("preserva foco visível na reordenação e nos controles de variação", () => {
    expect(source).toContain("focus-visible:ring-pink-300");
    expect(source).toContain('aria-label={`Obrigatoriedade da variação ${vt.name}`}');
  });
});
