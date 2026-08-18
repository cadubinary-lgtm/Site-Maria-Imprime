import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminProducts.tsx"), "utf8");

describe("listagem administrativa de produtos", () => {
  it("padroniza os destaques operacionais na identidade rosa", () => {
    expect(source).toContain('bg-pink-600 hover:bg-pink-700');
    expect(source).toContain('border-pink-500 bg-pink-50');
    expect(source).toContain('border-pink-200 bg-pink-50/60');
  });

  it("expõe busca, filtro de segmento e seleção em massa com estados acessíveis", () => {
    expect(source).toContain('aria-label="Buscar produtos por nome"');
    expect(source).toContain('aria-pressed={selectedSegmentId === null}');
    expect(source).toContain('aria-label={`Selecionar todos os ${filteredProducts.length} produtos filtrados`}');
    expect(source).toContain('aria-live="polite"');
  });

  it("associa os campos do preço rápido aos rótulos do produto", () => {
    expect(source).toContain('htmlFor={`quick-calculation-${product.id}`}');
    expect(source).toContain('id={`quick-pix-${product.id}`}');
    expect(source).toContain('id={`quick-card-${product.id}`}');
    expect(source).toContain('id={`quick-reseller-${product.id}`}');
  });
});
