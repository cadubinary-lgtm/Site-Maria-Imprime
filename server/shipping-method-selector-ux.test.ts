import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("seletor de entrega do checkout", () => {
  it("padroniza opções e ações na identidade rosa", () => {
    const source = readFileSync(resolve(root, "client/src/components/checkout/ShippingMethodSelector.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("border-pink-600 bg-pink-50");
    expect(source).toContain("hover:border-pink-300");
    expect(source).toContain("Confirmar Entrega");
  });

  it("mantém retirada e opções calculadas acessíveis", () => {
    const source = readFileSync(resolve(root, "client/src/components/checkout/ShippingMethodSelector.tsx"), "utf8");

    expect(source).toContain('aria-label="Retirar o pedido na loja, grátis"');
    expect(source).toContain('aria-label="Opções de entrega calculadas"');
    expect(source).toContain('aria-pressed={selectedMethod === "retirada"}');
  });
});
