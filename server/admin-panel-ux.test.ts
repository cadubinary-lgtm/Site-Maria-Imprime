import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminPanel.tsx"), "utf8");

describe("painel administrativo geral", () => {
  it("usa rosa para criar produtos e identificar segmentos", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain("bg-pink-100 text-pink-700");
    expect(source).toContain('aria-label="Carregando produtos"');
  });

  it("permite criar produtos por submissão de formulário e comunica processamento", () => {
    expect(source).toContain("onSubmit={(event) => { event.preventDefault(); handleCreateProduct(); }}");
    expect(source).toContain("aria-busy={createProductMutation.isPending}");
    expect(source).toContain('type="submit"');
  });

  it("associa filtros e ações de catálogo a identificadores acessíveis", () => {
    expect(source).toContain('htmlFor="admin-panel-search"');
    expect(source).toContain('id="admin-panel-segment-filter"');
    expect(source).toContain('aria-label={`Editar ${product.name}`}');
  });
});
