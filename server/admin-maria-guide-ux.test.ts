import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminMariaGuide.tsx"), "utf8");

describe("Guia da Maria administrativo", () => {
  it("preserva a identidade rosa e informa o estado de publicação", () => {
    expect(source).toContain('className="bg-pink-600 hover:bg-pink-700"');
    expect(source).toContain("aria-busy={saveDraft.isPending || publishGuide.isPending}");
    expect(source).toContain('aria-label="Carregando Guia da Maria"');
  });

  it("mantém a navegação e a prévia com estados explícitos", () => {
    expect(source).toContain("aria-pressed={isPreviewVisible}");
    expect(source).toContain('aria-current={section.id === activeSection.id ? "page" : undefined}');
  });

  it("interrompe a publicação quando o rascunho não pode ser salvo", () => {
    expect(source).toContain("const wasSaved = await handleSaveDraft(false);");
    expect(source).toContain("if (!wasSaved) return;");
    expect(source).toContain("Não foi possível salvar o rascunho");
  });
});
