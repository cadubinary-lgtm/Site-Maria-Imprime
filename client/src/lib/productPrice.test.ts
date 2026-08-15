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

  it("usa a tabela de revenda por unidade quando ela estiver configurada", () => {
    const cartaoDeVisita = { price: "90.00", resellerPrice: "65.00", calculationType: "unidade" };

    expect(formatProductPrice(cartaoDeVisita, "reseller")).toBe("R$ 65.00");
  });

  it("usa a tabela de revenda por m² e recua para a tabela final quando ela não existir", () => {
    const lonaComRevenda = { price: "0", pricePerM2: "75.00", resellerPricePerM2: "54.00", calculationType: "m2" };
    const lonaSemRevenda = { price: "0", pricePerM2: "75.00", calculationType: "m2" };

    expect(formatProductPrice(lonaComRevenda, "reseller")).toBe("R$ 54.00/m²");
    expect(formatProductPrice(lonaSemRevenda, "reseller")).toBe("R$ 75.00/m²");
  });
});
