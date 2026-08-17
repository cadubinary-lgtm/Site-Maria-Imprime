import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { calculatePixDiscountedPrice } from "./product-payment-pricing";

const root = resolve(import.meta.dirname, "..");

describe("desconto Pix em lote", () => {
  it("calcula o preço Pix a partir do cartão sem alterar a precisão de moeda", () => {
    expect(calculatePixDiscountedPrice("100", 10)).toBe(90);
    expect(calculatePixDiscountedPrice("75", 6.5)).toBe(70.13);
    expect(calculatePixDiscountedPrice("0", 10)).toBeNull();
  });

  it("mantém o desconto limitado a uma faixa válida", () => {
    expect(calculatePixDiscountedPrice("100", -10)).toBe(100);
    expect(calculatePixDiscountedPrice("100", 150)).toBe(0.01);
  });

  it("oferece confirmação administrativa e os selos Pix nas vitrines solicitadas", () => {
    const admin = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");
    const home = readFileSync(resolve(root, "client/src/components/home/FeaturedProducts.tsx"), "utf8");
    const catalog = readFileSync(resolve(root, "client/src/pages/public/Catalog.tsx"), "utf8");
    const publicCard = readFileSync(resolve(root, "client/src/components/products/PublicProductCard.tsx"), "utf8");
    const detail = readFileSync(resolve(root, "client/src/pages/ecommerce/ProductDetail.tsx"), "utf8");

    expect(admin).toContain("productPaymentPricing.applyPixDiscount");
    expect(admin).toContain("Aplicar desconto padrão no Pix?");
    expect(admin).toContain("Os preços de cartão e de revenda não serão alterados.");
    expect(home).toContain("<PublicProductCard");
    expect(catalog).toContain("<PublicProductCard");
    expect(publicCard).toContain("Desconto no Pix");
    expect(detail).toContain("Preço especial no Pix");
  });

  it("permite remover a aplicação Pix sem alterar os outros preços", () => {
    const admin = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");
    const database = readFileSync(resolve(root, "server/db.ts"), "utf8");
    const router = readFileSync(resolve(root, "server/routers-product-payment-pricing.ts"), "utf8");

    expect(admin).toContain("Remover aplicação do Pix");
    expect(admin).toContain("productPaymentPricing.removePixDiscount");
    expect(admin).toContain("Remover aplicação do Pix?");
    expect(database).toContain("removePixDiscountFromProducts");
    expect(database).toContain("set({ pixPrice: null, pixPricePerM2: null }");
    expect(router).toContain("removePixDiscount:");
  });
});
