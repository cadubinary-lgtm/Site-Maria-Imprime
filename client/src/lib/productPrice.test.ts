import { describe, expect, it } from "vitest";
import { formatProductPrice, getProductPrice } from "./productPrice";

describe("productPrice", () => {
  it("usa pricePerM2 para produtos calculados por metro quadrado", () => {
    const lonaImpressa = {
      price: "1.00",
      pricePerM2: "75.00",
      calculationType: "m2",
    };

    expect(getProductPrice(lonaImpressa).value).toBe(75);
    expect(formatProductPrice(lonaImpressa)).toBe("R$ 75.00/m²");
  });

  it("mantém o preço padrão para produtos vendidos por unidade", () => {
    const cartaoDeVisita = {
      price: "90.00",
      calculationType: "unidade",
    };

    expect(formatProductPrice(cartaoDeVisita)).toBe("R$ 90.00");
  });
});
