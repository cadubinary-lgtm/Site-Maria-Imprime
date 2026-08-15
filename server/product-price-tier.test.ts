import { describe, expect, it } from "vitest";
import { formatProductPrice, getProductPrice } from "../client/src/lib/productPrice";

describe("tabelas comerciais de produto", () => {
  it("mantém o preço final para Unidade e seleciona o preço de revenda quando aplicável", () => {
    const product = { price: "90.00", resellerPrice: "65.00", calculationType: "unidade" };

    expect(formatProductPrice(product, "final")).toBe("R$ 90.00");
    expect(formatProductPrice(product, "reseller")).toBe("R$ 65.00");
  });

  it("seleciona preços por m² e metro linear sem alterar seus sufixos", () => {
    const squareMeter = { price: "0", pricePerM2: "75.00", resellerPricePerM2: "54.00", calculationType: "m2" };
    const linearMeter = { price: "0", pricePerM2: "30.00", resellerPricePerM2: "21.00", calculationType: "metro_linear" };

    expect(getProductPrice(squareMeter, "reseller")).toMatchObject({ value: 54, suffix: "/m²" });
    expect(formatProductPrice(linearMeter, "reseller")).toBe("R$ 21.00/ml");
  });

  it("usa a tabela final quando não houver preço de revendedor configurado", () => {
    const product = { price: "0", pricePerM2: "75.00", calculationType: "m2" };

    expect(formatProductPrice(product, "reseller")).toBe("R$ 75.00/m²");
  });
});
