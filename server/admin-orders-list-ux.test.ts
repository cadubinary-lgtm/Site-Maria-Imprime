import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminOrders.tsx"), "utf8");

describe("listagem administrativa de pedidos", () => {
  it("padroniza a operação na identidade rosa e preserva aviso semântico", () => {
    expect(source).toContain('text-pink-600');
    expect(source).toContain('bg-pink-600 text-white hover:bg-pink-700');
    expect(source).toContain('bg-amber-100 text-amber-800');
    expect(source).not.toContain('bg-orange-100 text-orange-800');
  });

  it("expõe busca, filtros e resultados com estados acessíveis", () => {
    expect(source).toContain('htmlFor="admin-orders-search"');
    expect(source).toContain('aria-expanded={showFilters}');
    expect(source).toContain('aria-controls="admin-order-status-filters"');
    expect(source).toContain('aria-pressed={filter === opt.id}');
    expect(source).toContain('aria-live="polite"');
  });

  it("nomeia a tabela e as ações operacionais dos pedidos", () => {
    expect(source).toContain('scope="col"');
    expect(source).toContain('aria-label={`Ver detalhes do pedido ${order.orderNumber}`}');
    expect(source).toContain('aria-label={`Mover o pedido ${order.orderNumber} para a lixeira`}');
  });
});
