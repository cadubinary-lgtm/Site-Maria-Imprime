import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("lista de pedidos do cliente", () => {
  it("aplica a identidade rosa às ações, destaques e estados vazios", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/MyOrdersPage.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(source).toContain("text-pink-600");
    expect(source).not.toContain("bg-orange-500 hover:bg-orange-600");
  });

  it("identifica os controles de filtro e expõe uma saída para resultados vazios", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/MyOrdersPage.tsx"), "utf8");

    expect(source).toContain('aria-label="Buscar por número do pedido"');
    expect(source).toContain('aria-label="Filtrar pedidos por status"');
    expect(source).toContain('aria-label="Ordenar pedidos"');
    expect(source).toContain("hasActiveFilters");
    expect(source).toContain("Limpar filtros");
    expect(source).toContain('aria-live="polite"');
  });

  it("nomeia as ações de detalhe e recompra por pedido", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/MyOrdersPage.tsx"), "utf8");

    expect(source).toContain('aria-label={`Ver detalhes do pedido ${order.orderNumber}`}');
    expect(source).toContain('aria-label={`Refazer o pedido ${order.orderNumber}`}');
  });
});
