import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminFooterInformation.tsx"), "utf8");

describe("informações administrativas do rodapé", () => {
  it("espelha no painel os limites aceitos pelo conteúdo público", () => {
    expect(source).toContain("const FOOTER_FIELD_LIMITS");
    expect(source).toContain("maxLength={FOOTER_FIELD_LIMITS.introduction}");
    expect(source).toContain("maxLength={FOOTER_FIELD_LIMITS.newsletterTitle}");
    expect(source).toContain("maxLength={255}");
  });

  it("impede salvar textos vazios ou acima do limite com feedback nomeado", () => {
    expect(source).toContain("const invalidField");
    expect(source).toContain('id: "site-footer-content-validation-error"');
    expect(source).toContain("Revise o campo");
  });

  it("mantém ações de gravação e documentos na identidade rosa e acessíveis", () => {
    expect(source).toContain("aria-busy={saveFooter.isPending}");
    expect(source).toContain("aria-busy={saveDocuments.isPending}");
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain('rel="noopener noreferrer"');
  });
});
