import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("checkout público", () => {
  it("padroniza controles de pagamento e continuidade na identidade rosa", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/CheckoutPage.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("bg-pink-600 text-white shadow-md");
    expect(source).toContain("border-pink-600 bg-pink-50 shadow-md");
    expect(source).toContain("text-pink-600");
    expect(source).toContain("Alterar forma de envio");
  });

  it("expõe estados e controles de checkout com nomes acessíveis", () => {
    const source = readFileSync(resolve(root, "client/src/pages/ecommerce/CheckoutPage.tsx"), "utf8");

    expect(source).toContain('aria-label="Etapas do checkout"');
    expect(source).toContain('aria-current={s.id === step ? "step" : undefined}');
    expect(source).toContain('aria-label="Pagar via PIX"');
    expect(source).toContain('aria-label="Pagar com cartão de débito ou crédito"');
    expect(source).toContain("aria-expanded={isExpanded}");
  });
});
