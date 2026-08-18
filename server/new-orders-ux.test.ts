import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/NewOrders.tsx"), "utf8");

describe("novos pedidos administrativos", () => {
  it("usa a identidade rosa para controles de marca sem alterar o status analisando", () => {
    expect(source).toContain("bg-orange-100 text-orange-800 border-orange-200");
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white gap-1 w-full");
    expect(source).toContain("border-l-pink-400");
  });

  it("nomeia busca, ações por pedido e estados de processamento", () => {
    expect(source).toContain('aria-label="Buscar novos pedidos"');
    expect(source).toContain('aria-label={`Abrir pedido ${order.orderNumber}`}');
    expect(source).toContain('aria-label={`Excluir pedido ${order.orderNumber}`}');
    expect(source).toContain('aria-label="Carregando novos pedidos"');
    expect(source).toContain("aria-busy={deleteOrderMutation.isPending}");
  });
});
