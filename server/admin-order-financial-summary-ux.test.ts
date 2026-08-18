import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminOrderDetail.tsx"), "utf8");

describe("resumo financeiro administrativo", () => {
  it("formata métodos de pagamento sem expor identificadores técnicos", () => {
    expect(source).toContain('credit_card: "Cartão de débito/crédito"');
    expect(source).toContain("formatPaymentMethod(o.paymentMethod)");
  });

  it("comunica frete gratuito e total na identidade rosa", () => {
    expect(source).toContain('shippingAmount <= 0 ? "Grátis"');
    expect(source).toContain('text-pink-700');
    expect(source).toContain('text-pink-600');
  });

  it("agrupa a composição financeira em uma estrutura anunciada", () => {
    expect(source).toContain('role="list" aria-label="Composição financeira do pedido"');
    expect(source).toContain('role="listitem"');
  });
});
