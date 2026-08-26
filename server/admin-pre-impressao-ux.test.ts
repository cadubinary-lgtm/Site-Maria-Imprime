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

  it("nomeia a continuidade da arte sem exibir uma etapa comercial inexistente", () => {
    expect(source).not.toContain("Aguardando Liberação Comercial");
    expect(source).not.toContain('label="Aguardando liberação"');
    expect(source).not.toContain("awaitingRelease:");
    expect(source).toContain('label="Liberado p/ Análise"');
    expect(source).toContain('aria-label={`Ver detalhes do pedido ${order.orderNumber}`}');
    expect(source).toContain('aria-busy={deleteHistoryMutation.isPending}');
  });

  it("organiza indicadores e oferece uma forma explícita de limpar filtros", () => {
    expect(source).toContain('aria-label="Indicadores da pré-impressão"');
    expect(source).toContain('section className="grid grid-cols-1 gap-3 sm:grid-cols-3"');
    expect(source).toContain("const clearFilters = () => {");
    expect(source).toContain("Limpar filtros");
  });

  it("classifica pedidos em produção somente como Arte Final Aprovada", () => {
    expect(source).toContain('const effectivePreProductionStatus = order.status === "em_producao"');
    expect(source).toContain('order.status !== "em_producao" && (order.preProductionStatus || "liberado_analise") === "liberado_analise"');
    expect(source).toContain('const currentPreStatus = order.status === "em_producao" ? "em_producao"');
    expect(source).toContain('!["pronto_entrega", "pronto_retirada", "entregue", "cancelado"].includes(order.status)');
  });

  it("resume os três estágios atuais de produção com atalhos para a fila operacional", () => {
    expect(source).toContain("const PRODUCTION_DASHBOARD_STAGES = [");
    expect(source).toContain('label: "Pendente"');
    expect(source).toContain('label: "Impresso"');
    expect(source).toContain('label: "Acabamento Finalizado"');
    expect(source).toContain('href: "/admin/status-producao?status=pendente"');
    expect(source).toContain('const stage = order.productionStatus === "pending" ? "pendente" : order.productionStatus || "pendente";');
    expect(source).toContain('aria-label="Status de produção"');
  });
});
