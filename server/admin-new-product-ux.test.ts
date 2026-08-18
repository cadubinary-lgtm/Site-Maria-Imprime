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
});
