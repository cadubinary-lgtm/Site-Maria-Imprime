import { describe, expect, it } from "vitest";
import { getOrderPaymentStage } from "../shared/order-payment-stage";

describe("etapa de pagamento compartilhada", () => {
  it("mantém pagamento na retirada como etapa inicial mesmo que a baixa financeira esteja pendente", () => {
    expect(getOrderPaymentStage({ status: "pagamento_retirada", paymentMethod: "pagar_na_retirada", paymentStatus: "pendente" })).toBe("pagamento_retirada");
  });

  it("mantém Pix pendente em espera", () => {
    expect(getOrderPaymentStage({ status: "aguardando_pagamento", paymentMethod: "pix", paymentStatus: "pendente" })).toBe("aguardando_pagamento");
  });

  it("mostra pagamento aprovado quando a venda online foi quitada", () => {
    expect(getOrderPaymentStage({ status: "pagamento_aprovado", paymentMethod: "pix", paymentStatus: "pago" })).toBe("pagamento_aprovado");
  });
});
