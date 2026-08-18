import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("detalhes de pedido do cliente", () => {
  it("padroniza os destaques operacionais e ações do pedido na identidade rosa", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/OrderDetailPage.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(source).toContain("bg-pink-600");
    expect(source).toContain("text-pink-600");
    expect(source).toContain("border-pink-200");
  });

  it("oferece estados e interações acessíveis nos detalhes e na linha do tempo", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/OrderDetailPage.tsx"), "utf8");

    expect(source).toContain('role="alert"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-label="Etapas do pedido"');
    expect(source).toContain('aria-label="Visualização da arte aprovada"');
    expect(source).toContain('aria-label="Fechar visualização da arte"');
    expect(source).toContain('aria-label={`Refazer o pedido ${order.orderNumber}`}');
  });

  it("mantém o pagamento pendente com uma cor de alerta semântica", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/OrderDetailPage.tsx"), "utf8");

    expect(source).toContain('"bg-yellow-100 text-yellow-800"');
    expect(source).toContain('"bg-green-100 text-green-800"');
    expect(source).toContain('"bg-red-100 text-red-800"');
  });
});
