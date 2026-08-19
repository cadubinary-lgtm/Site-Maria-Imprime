import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminPreImpressao.tsx"), "utf8");

describe("painel administrativo de pré-impressão", () => {
  it("padroniza controles e carregamentos na identidade rosa", () => {
    expect(source).toContain("bg-pink-600 text-white");
    expect(source).toContain("text-pink-600");
    expect(source).not.toContain("bg-orange-500 text-white");
  });

  it("expõe busca, filtros e contagem com estados acessíveis", () => {
    expect(source).toContain('htmlFor="prepress-search"');
    expect(source).toContain('aria-pressed={filterStatus === status}');
    expect(source).toContain('aria-label="Filtros da pré-impressão"');
    expect(source).toContain('aria-label={`Filtrar por ${status === "todos" ? "todos os pedidos" : PRE_PRODUCTION_STATUS[status]?.label ?? status}`');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-label="Carregando pedidos da pré-impressão"');
  });

  it("comunica o bloqueio comercial e nomeia a continuidade para o pedido", () => {
    expect(source).toContain("Aguardando Liberação Comercial");
    expect(source).toContain('aria-label={`Ver detalhes do pedido ${order.orderNumber}`}');
    expect(source).toContain('aria-busy={deleteHistoryMutation.isPending}');
  });

  it("organiza indicadores e oferece uma forma explícita de limpar filtros", () => {
    expect(source).toContain('aria-label="Indicadores da pré-impressão"');
    expect(source).toContain('label="Aguardando liberação"');
    expect(source).toContain("const clearFilters = () => {");
    expect(source).toContain("Limpar filtros");
  });
});
