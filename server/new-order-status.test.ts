import { describe, expect, it } from "vitest";
import { isNewOrderStatus } from "../client/src/lib/newOrderStatus";

describe("indicador de Novos Pedidos", () => {
  it("considera apenas pedidos recém-aprovados para a primeira triagem", () => {
    expect(isNewOrderStatus("pagamento_aprovado")).toBe(true);
    expect(isNewOrderStatus("aguardando_pagamento")).toBe(false);
    expect(isNewOrderStatus("pagamento_retirada")).toBe(false);
  });

  it("não reintroduz pedidos de produção, entrega, retirada ou cancelados como novos", () => {
    ["analisando", "em_producao", "pronto_entrega", "pronto_retirada", "entregue", "cancelado", null].forEach((status) => {
      expect(isNewOrderStatus(status)).toBe(false);
    });
  });
});
