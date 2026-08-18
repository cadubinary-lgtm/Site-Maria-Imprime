import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/RelatoriosFinanceiros.tsx"), "utf8");

describe("página alternativa de relatórios financeiros", () => {
  it("usa rosa nos filtros, carregamento e valores dos relatórios", () => {
    expect(source).toContain('period === p ? "bg-pink-600 text-white"');
    expect(source).toContain('reportType === r.key ? "bg-pink-600 text-white"');
    expect(source).toContain("border-pink-600 border-t-transparent");
    expect(source).toContain("font-semibold text-pink-600");
  });

  it("expõe seleção de filtros e carregamento para tecnologias assistivas", () => {
    expect(source).toContain("aria-pressed={period === p}");
    expect(source).toContain("aria-pressed={reportType === r.key}");
    expect(source).toContain('aria-label="Carregando relatório financeiro"');
  });

  it("mantém o retorno como link sem botão interno", () => {
    expect(source).toContain('Link href="/admin/gerenciador-financeiro">');
    expect(source).not.toContain('Link href="/admin/gerenciador-financeiro">\n              <Button');
  });
});
