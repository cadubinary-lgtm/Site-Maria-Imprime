import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/FinanceiroRelatorios.tsx"), "utf8");

describe("relatórios financeiros", () => {
  it("padroniza filtros, métricas e gráficos na identidade rosa", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain('color: "text-pink-600", bg: "bg-pink-50"');
    expect(source).toContain("bg-pink-400 transition-all");
  });

  it("mantém a cor semântica do Pix e identifica filtros e barras do gráfico", () => {
    expect(source).toContain('pix: "bg-green-500"');
    expect(source).toContain("aria-pressed={tipo === t && !useCustom}");
    expect(source).toContain('aria-label="Data inicial do período personalizado"');
    expect(source).toContain('aria-label={`${d.date}: ${formatCurrency(d.valor)}`}');
  });
});
