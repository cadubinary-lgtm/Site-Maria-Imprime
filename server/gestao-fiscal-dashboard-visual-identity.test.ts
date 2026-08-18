import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/GestaoFiscalDashboard.tsx"), "utf8");

describe("identidade visual do dashboard fiscal", () => {
  it("usa rosa nos controles fiscais e atalhos não semânticos", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain("text-pink-600 hover:text-pink-700");
    expect(source).toContain("hover:border-pink-300");
  });

  it("preserva cores de estado fiscal e alertas", () => {
    expect(source).toContain('pending: { label: "Pendente", color: "bg-orange-100 text-orange-700"');
    expect(source).toContain('className="bg-amber-50 border border-amber-200');
    expect(source).toContain('color: "text-orange-600"');
  });

  it("oculta ícones decorativos de CTAs para tecnologias assistivas", () => {
    expect(source).toContain('aria-hidden="true" /> Nova Nota');
  });
});
