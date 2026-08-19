import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminProductAttributesLinker.tsx"), "utf8");

describe("vínculo administrativo entre produtos e atributos", () => {
  it("identifica buscas, carregamentos e seleção de produtos de forma acessível", () => {
    expect(source).toContain('htmlFor="product-attribute-search"');
    expect(source).toContain('htmlFor="attribute-product-search"');
    expect(source).toContain('aria-label="Carregando produtos"');
    expect(source).toContain('aria-pressed={selectedProductId === product.id}');
  });

  it("comunica atributos já vinculados e apresenta coleções semanticamente", () => {
    expect(source).toContain("linkedAttributeIds.has(attr.id)");
    expect(source).toContain("Já vinculado");
    expect(source).toContain('aria-label="Atributos disponíveis para vínculo"');
    expect(source).toContain('aria-labelledby="linked-attributes-title"');
  });

  it("vincula múltiplos atributos com estado de processamento e identidade rosa", () => {
    expect(source).toContain("await Promise.all(");
    expect(source).toContain("getProductAttributes.invalidate(selectedProductId)");
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain("aria-busy={isLinking}");
  });

  it("mantém navegação contextual, indicadores e remoção protegida de vínculo", () => {
    expect(source).toContain('href="/admin/atributos"');
    expect(source).toContain('aria-label="Indicadores do vinculador de atributos"');
    expect(source).toContain("unlinkAttributeFromProduct.useMutation");
    expect(source).toContain("Desvincular este atributo do produto?");
    expect(source).toContain("Desvincular atributo");
    expect(source).toContain("aria-busy={unlinkMutation.isPending}");
  });
});
