import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroDashboard.tsx"), "utf8");

describe("dashboard financeiro", () => {
  it("padroniza controles de período e evolução financeira na identidade rosa", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50");
    expect(source).toContain("bg-pink-400 transition-all");
  });

  it("preserva pendências e pagamentos com cores semânticas", () => {
    expect(source).toContain('color: "text-orange-600"');
    expect(source).toContain('color: "text-green-600"');
    expect(source).toContain('color: "text-red-600"');
  });

  it("expõe seleção de período e texto alternativo para barras mensais", () => {
    expect(source).toContain("aria-pressed={periodo === p}");
    expect(source).toContain('aria-label={`${m.mes}: ${formatCurrency(m.receita)}`}');
  });
});
