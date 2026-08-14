import { describe, expect, it } from "vitest";
import { getOrderTotal, getShippingSummary } from "../client/src/lib/shipping-summary";

describe("resumo de frete do pedido", () => {
  it("não apresenta entrega como grátis antes de o cliente selecionar uma opção", () => {
    expect(getShippingSummary({ selectedShipping: null, shippingCalculated: false })).toMatchObject({
      label: "Calcule o frete",
      isPending: true,
      isFree: false,
    });
  });

  it("exibe o valor calculado e o inclui no total após a seleção", () => {
    const shipping = getShippingSummary({
      selectedShipping: { price: 23.9 },
      shippingCalculated: true,
    });

    expect(shipping).toMatchObject({ amount: 23.9, label: "R$ 23.90", isPending: false });
    expect(getOrderTotal(225, shipping.amount)).toBe(248.9);
  });

  it("mantém grátis apenas para uma opção de retirada ou entrega sem custo", () => {
    expect(getShippingSummary({ selectedShipping: { price: 0 }, shippingCalculated: true })).toMatchObject({
      label: "Grátis",
      isFree: true,
      isPending: false,
    });
  });
});
