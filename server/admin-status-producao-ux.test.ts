import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminStatusProducao.tsx"), "utf8");

describe("painel administrativo de status de produção", () => {
  it("padroniza carregamento e filtros na identidade rosa", () => {
    expect(source).toContain("text-pink-600");
    expect(source).toContain("bg-pink-600 text-white");
    expect(source).not.toContain("bg-orange-500 text-white");
  });

  it("expõe busca, filtros e contagem com estados acessíveis", () => {
    expect(source).toContain('htmlFor="production-status-search"');
    expect(source).toContain('aria-pressed={filterStatus === s}');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-label="Carregando pedidos de produção"');
  });

  it("identifica e protege a alteração de status por pedido", () => {
    expect(source).toContain('id={`production-status-${order.orderId ?? order.id}`}');
    expect(source).toContain('aria-busy={updateProductionMutation.isPending}');
    expect(source).toContain('aria-label={`Ver detalhes do pedido ${order.orderNumber}`}');
  });
});
