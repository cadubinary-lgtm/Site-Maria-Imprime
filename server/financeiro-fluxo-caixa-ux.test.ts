import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroFluxoCaixa.tsx"), "utf8");

describe("central financeira de fluxo de caixa", () => {
  it("usa rosa para os controles de período e movimentação", () => {
    expect(source).toContain("bg-pink-600 text-white hover:bg-pink-700");
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50");
  });

  it("mantém saldos positivos e negativos com cores semânticas", () => {
    expect(source).toContain('data.closingBalance >= 0 ? "bg-green-50" : "bg-red-50"');
    expect(source).toContain('data.closingBalance >= 0 ? "text-green-600" : "text-red-600"');
  });

  it("associa campos e escolhas do formulário de movimentação", () => {
    expect(source).toContain('role="radiogroup" aria-label="Tipo de movimentação"');
    expect(source).toContain("aria-checked={form.tipo === opt.value}");
    expect(source).toContain('id="cashflow-category"');
    expect(source).toContain('id="cashflow-value"');
    expect(source).toContain('id="cashflow-entry-date"');
    expect(source).toContain('id="cashflow-entry-form"');
    expect(source).toContain('form="cashflow-entry-form"');
  });
});
