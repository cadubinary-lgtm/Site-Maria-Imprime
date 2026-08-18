import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminPricingRules.tsx"), "utf8");

describe("regras administrativas de precificação", () => {
  it("substitui a confirmação nativa de exclusão por diálogo acessível", () => {
    expect(source).toContain("<AlertDialog open={Boolean(ruleToDelete)}");
    expect(source).toContain("handleConfirmDelete");
    expect(source).toContain('aria-label={`Excluir regra ${rule.name}`}');
    expect(source).not.toContain("confirm(");
  });

  it("comunica processamento e resultados da exclusão", () => {
    expect(source).toContain('aria-busy={deleteMutation.isPending}');
    expect(source).toContain('toast.success("Regra de precificação excluída."');
    expect(source).toContain('toast.error(`Não foi possível excluir a regra: ${error.message}`');
  });

  it("preserva a validação de campos obrigatórios com feedback visual", () => {
    expect(source).toContain('toast.error("Nome e categoria são obrigatórios."');
    expect(source).toContain('setRuleToDelete(null)');
    expect(source).toContain('aria-label={`Excluir regra ${rule.name}`}');
  });
});
