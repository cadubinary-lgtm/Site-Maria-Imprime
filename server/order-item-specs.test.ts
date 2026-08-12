import { describe, expect, it } from "vitest";
import { formatShipping } from "../client/src/components/OrderItemSpecs";

describe("formatação de entrega do item", () => {
  it("remove o prefixo repetido de entrega sem alterar o valor do frete", () => {
    expect(formatShipping("Entrega Local - Carro", 12.5)).toBe("Local - Carro — R$ 12,50");
  });

  it("mantém o texto de retirada e informa frete grátis", () => {
    expect(formatShipping("Retirada na Loja", 0)).toBe("Retirada na Loja — Grátis");
  });
});
