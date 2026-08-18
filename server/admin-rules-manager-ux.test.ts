import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminRulesManager.tsx"), "utf8");

describe("gestão administrativa de regras", () => {
  it("usa operações persistentes em vez de comunicar sucessos simulados", () => {
    expect(source).toContain("trpc.attributes.createAttributeRule.useMutation");
    expect(source).toContain("trpc.attributes.updateAttributeRule.useMutation");
    expect(source).toContain("trpc.attributes.deleteAttributeRule.useMutation");
    expect(source).not.toContain("TODO: Implementar chamada tRPC");
  });

  it("fornece busca e seleção explícita de produtos na identidade rosa", () => {
    expect(source).toContain('htmlFor="rules-product-search"');
    expect(source).toContain('aria-pressed={selectedProductId === product.id}');
    expect(source).toContain("bg-pink-600 hover:bg-pink-700");
    expect(source).toContain('aria-label="Carregando produtos"');
  });

  it("protege exclusões e torna os controles de regras identificáveis", () => {
    expect(source).toContain("<AlertDialog open={Boolean(ruleToDelete)}");
    expect(source).toContain('aria-expanded={expandedRuleId === rule.id}');
    expect(source).toContain('aria-label={`Excluir regra ${rule.name}`}');
    expect(source).toContain('onSubmit={(event) => { event.preventDefault(); handleSaveRule(); }}');
  });
});
