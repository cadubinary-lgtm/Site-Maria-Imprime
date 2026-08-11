import { describe, expect, it } from "vitest";
import { formatProductPrice, getProductPrice } from "../client/src/lib/productPrice";

describe("Preço de exibição da vitrine", () => {
  it("exibe pricePerM2 para a Lona Impressa, mesmo quando price contém o fallback técnico", () => {
    const lonaImpressa = {
      price: "1.00",
      pricePerM2: "75.00",
      calculationType: "m2",
    };

    expect(getProductPrice(lonaImpressa).value).toBe(75);
    expect(formatProductPrice(lonaImpressa)).toBe("R$ 75.00/m²");
  });

  it("mantém price para produtos vendidos por unidade", () => {
    const cartaoDeVisita = {
      price: "90.00",
      calculationType: "unidade",
    };

    expect(formatProductPrice(cartaoDeVisita)).toBe("R$ 90.00");
  });
});
