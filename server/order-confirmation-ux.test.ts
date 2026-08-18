import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("confirmação pública de pedido", () => {
  it("adota a identidade rosa nos status, timeline e acompanhamento", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/OrderConfirmation.tsx"), "utf8");

    expect(source).toContain("bg-pink-600");
    expect(source).toContain("border-pink-200");
    expect(source).toContain("text-pink-600");
    expect(source).not.toContain("bg-orange-500 hover:bg-orange-600");
  });

  it("oferece estados e controles acessíveis em confirmação e acompanhamento", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/OrderConfirmation.tsx"), "utf8");

    expect(source).toContain('aria-label="Carregando confirmação do pedido"');
    expect(source).toContain('role="alert"');
    expect(source).toContain('aria-label="Copiar link de acompanhamento"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-label="Etapas do pedido"');
  });

  it("mantém ações de continuidade consistentes quando o pedido está disponível ou ausente", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/OrderConfirmation.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(source).toContain("Explorar catálogo");
    expect(source).toContain("Continuar Comprando");
  });
});
