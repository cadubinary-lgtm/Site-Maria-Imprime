import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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

  it("usa o campo comercial correto para todos os tipos de cobrança", () => {
    expect(formatProductPrice({
      price: "1.00",
      pricePerM2: "32.50",
      calculationType: "metro_linear",
    })).toBe("R$ 32.50/ml");

    expect(formatProductPrice({
      price: "120.00",
      calculationType: "pacote",
    })).toBe("R$ 120.00");
  });

  it("obriga cards e busca pública a delegarem a exibição ao helper centralizado", () => {
    const featuredProducts = readFileSync("client/src/components/home/FeaturedProducts.tsx", "utf8");
    const header = readFileSync("client/src/components/layout/Header.tsx", "utf8");

    expect(featuredProducts).toContain('formatProductPrice(product)');
    expect(header).toContain('formatProductPrice(product)');
  });
});
