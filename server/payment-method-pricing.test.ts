import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getProductPaymentPrices } from "../client/src/lib/productPrice";

const root = resolve(import.meta.dirname, "..");

describe("preços por forma de pagamento", () => {
  it("mantém Pix e cartão independentes, inclusive em produtos por medida", () => {
    const prices = getProductPaymentPrices({
      price: "0",
      pricePerM2: "75.00",
      pixPricePerM2: "70.00",
      cardPricePerM2: "75.00",
      calculationType: "m2",
    });

    expect(prices.pix).toMatchObject({ value: 70, label: "R$ 70.00/m²" });
    expect(prices.card).toMatchObject({ value: 75, label: "R$ 75.00/m²" });
  });

  it("oferece no Admin campos independentes de Pix e cartão", () => {
    const newProduct = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");
    const editProduct = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

    expect(newProduct).toContain("Preço via Pix (R$) *");
    expect(newProduct).toContain("Preço via Cartão (R$) *");
    expect(editProduct).toContain("Preço via Pix (R$)");
    expect(editProduct).toContain("Preço via Cartão (R$)");
    expect(newProduct).toContain("Preço via Pix por m² (R$)");
    expect(editProduct).toContain("Preço via Cartão por m² (R$)");
  });

  it("exibe os dois valores no configurador e usa o snapshot correto no checkout", () => {
    const productDetail = readFileSync(resolve(root, "client/src/pages/ecommerce/ProductDetail.tsx"), "utf8");
    const checkout = readFileSync(resolve(root, "client/src/pages/ecommerce/CheckoutPage.tsx"), "utf8");
    const routers = readFileSync(resolve(root, "server/routers.ts"), "utf8");

    expect(productDetail).toContain("no Pix");
    expect(productDetail).toContain("No cartão de crédito");
    expect(productDetail).toContain("pixPriceAtCart: effectivePrice");
    expect(productDetail).toContain("cardPriceAtCart: cardEffectivePrice");
    expect(checkout).toContain('paymentMethod === "cartao"');
    expect(checkout).toContain("item.cardPriceAtCart ?? item.priceAtCart");
    expect(routers).toContain('input.paymentMethod === "cartao_credito"');
    expect(routers).toContain("item.cardPriceAtCart ?? item.priceAtCart");
  });
});
