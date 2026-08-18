import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ContasReceber.tsx"), "utf8");

describe("página legada de contas a receber", () => {
  it("usa rosa nos valores, carregamento e paginação", () => {
    expect(source).toContain("font-semibold text-pink-600");
    expect(source).toContain("border-pink-600 border-t-transparent");
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50");
  });

  it("mantém status de produção e indicadores de pendência semânticos", () => {
    expect(source).toContain('analisando: { label: "Analisando", color: "bg-orange-100 text-orange-700"');
    expect(source).toContain('em_producao: { label: "Em Produção", color: "bg-orange-100 text-orange-700"');
    expect(source).toContain("border border-orange-200 bg-orange-50");
  });

  it("identifica busca, paginação e links sem botões internos", () => {
    expect(source).toContain('aria-label="Buscar contas a receber"');
    expect(source).toContain('aria-label={`Ver pedido ${order.id}`}');
    expect(source).toContain('aria-label="Página anterior"');
    expect(source).not.toContain('Link href="/admin/gerenciador-financeiro">\n            <Button');
  });
});
