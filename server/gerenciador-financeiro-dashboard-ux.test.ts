import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/GerenciadorFinanceiroDashboard.tsx"), "utf8");

describe("gerenciador financeiro alternativo", () => {
  it("usa rosa nos filtros de período, atualização e links de navegação", () => {
    expect(source).toContain('period === p ? "bg-pink-600 text-white"');
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50");
    expect(source).toContain("hover:border-pink-300");
  });

  it("preserva indicadores pendentes e de recebimento em suas cores semânticas", () => {
    expect(source).toContain('color: "text-orange-600"');
    expect(source).toContain('color: "text-green-600"');
    expect(source).toContain("text-red-600 mt-1");
  });

  it("expõe seleção de período e evita botão aninhado em link de detalhes", () => {
    expect(source).toContain("aria-pressed={period === p}");
    expect(source).toContain('Link href="/admin/gerenciador-financeiro/fluxo" className="inline-flex');
    expect(source).not.toContain('Link href="/admin/gerenciador-financeiro/fluxo">\n                  <Button');
  });
});
