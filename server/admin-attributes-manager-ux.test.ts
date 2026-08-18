import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminAttributesManager.tsx"), "utf8");

describe("gestão administrativa de atributos", () => {
  it("oferece busca e contagem de atributos de forma acessível", () => {
    expect(source).toContain('htmlFor="attribute-search"');
    expect(source).toContain('id="attribute-search"');
    expect(source).toContain('aria-label="Limpar busca de atributos"');
    expect(source).toContain('aria-live="polite"');
  });

  it("mantém criação e edição com salvamento acessível na identidade rosa", () => {
    expect(source).toContain('onSubmit={(event) => { event.preventDefault(); handleSave(); }}');
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain('aria-busy={createMutation.isPending || updateMutation.isPending}');
  });

  it("protege a exclusão com confirmação nomeada e processamento explícito", () => {
    expect(source).toContain('aria-label={`Excluir atributo ${attr.name}`}');
    expect(source).toContain('Excluir o atributo “{attributeToDelete?.name}”?');
    expect(source).toContain('aria-busy={deleteMutation.isPending}');
    expect(source).toContain("formatCurrency(attr.basePrice)");
  });
});
