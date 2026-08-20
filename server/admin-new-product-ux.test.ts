import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminNewProduct.tsx"), "utf8");

describe("cadastro administrativo de produtos", () => {
  it("mantém o estado do salvamento visível também em telas pequenas", () => {
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).not.toContain('hidden sm:inline-flex items-center rounded-full');
  });

  it("padroniza o botão de criação e comunica seu processamento", () => {
    expect(source).toContain('aria-busy={createProductMutation.isPending}');
    expect(source).toContain('bg-pink-600 hover:bg-pink-700');
  });

  it("permite confirmar a criação pelo envio do formulário", () => {
    expect(source).toContain('onSubmit={(event) => { event.preventDefault(); handleCreateProduct(); }}');
  });

  it("confirma a criação com sucesso animado, contextual e sem duplicidade", () => {
    expect(source).toContain('toast.success("Produto criado com sucesso"');
    expect(source).toContain('animate-[pulse_1.2s_ease-in-out_2]');
    expect(source).toContain('position: "top-right"');
    expect(source).toContain('id: `new-product-created-${productId}`');
  });

  it("redireciona para a lista destacando o novo produto", () => {
    expect(source).toContain('navigate(`/admin/produtos?destacar=${productId}`);');
  });

  it("padroniza os campos monetários em moeda brasileira e avanço de 1000 ms", () => {
    expect(source).toContain('const DEFAULT_BRL_PRICE = "0,00";');
    expect(source).toContain('toBrazilianPriceInput');
    expect(source.match(/scheduleProductPriceAutoAdvance/g)?.length).toBeGreaterThanOrEqual(20);
    expect(source).toContain('id="create-name"');
    expect(source).toContain('id="create-description"');
    expect(source).toContain('id="create-minWidth"');
    expect(source).toContain('id="create-maxWidth"');
    expect(source).toContain('id="create-minHeight"');
    expect(source).toContain('id="create-maxHeight"');
    expect(source).toContain('id="create-card-description-line-1"');
    expect(source).toContain('id="create-card-description-line-2"');
    expect(source).toContain('placeholder="Ex: Lona 440g impermeável, costura dupla, ilhós a cada 50cm..."');
    expect(source).toContain('id="create-weight"');
    expect(source).toContain('id="create-log-width"');
    expect(source).toContain('id="create-log-height"');
    expect(source).toContain('id="create-log-length"');
  });
});
