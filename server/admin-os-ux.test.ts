import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminOS.tsx"), "utf8");

describe("gestão de ordens de serviço", () => {
  it("usa rosa em controles e destaques não semânticos", () => {
    expect(source).toContain("bg-pink-600 text-white");
    expect(source).toContain("border-pink-200 text-pink-600 hover:bg-pink-50");
    expect(source).toContain("bg-pink-100");
  });

  it("preserva a cor laranja apenas nos status semânticos de análise e produção", () => {
    expect(source).toContain('analisando:         { label: "Analisando",          color: "text-orange-700",  bg: "bg-orange-100" }');
    expect(source).toContain('em_producao:        { label: "Em Produção",         color: "text-orange-700",  bg: "bg-orange-100" }');
  });

  it("identifica busca, filtros, carregamento e impressão", () => {
    expect(source).toContain('htmlFor="os-search"');
    expect(source).toContain("aria-pressed={statusFilter === s}");
    expect(source).toContain('aria-label="Carregando ordens de serviço"');
    expect(source).toContain('aria-label={`Imprimir ordem de serviço ${order.orderNumber}`}');
  });
});
