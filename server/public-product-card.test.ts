import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicCardSource = readFileSync(resolve(root, "client/src/components/products/PublicProductCard.tsx"), "utf8");
const featuredSource = readFileSync(resolve(root, "client/src/components/home/FeaturedProducts.tsx"), "utf8");
const catalogSource = readFileSync(resolve(root, "client/src/pages/public/Catalog.tsx"), "utf8");
const allProductsSource = readFileSync(resolve(root, "client/src/pages/public/AllProducts.tsx"), "utf8");
const segmentQuerySource = readFileSync(resolve(root, "server/db-product-segments.ts"), "utf8");

describe("cards públicos informativos", () => {
  it("exibe apenas fatos configurados no produto e não inventa alcance de entrega", () => {
    expect(publicCardSource).toContain("getProductPaymentPrices(product, priceAudience)");
    expect(publicCardSource).toContain("getPixDiscountInfo(product, priceAudience)");
    expect(publicCardSource).toContain("parseSpecifications(product.specifications)");
    expect(publicCardSource).toContain("getProductionLabel(deliveryOptions");
    expect(publicCardSource).toContain("product.allowPickup");
    expect(publicCardSource).toContain("hasAllowedCarriers(product.allowedCarriers)");
    expect(publicCardSource).not.toContain("Envio para todo o Brasil");
  });

  it("mantém o mesmo card na home, catálogo segmentado e listagem pública", () => {
    expect(featuredSource).toContain("<PublicProductCard");
    expect(catalogSource).toContain("<PublicProductCard");
    expect(allProductsSource).toContain("<PublicProductCard");
  });

  it("fornece os campos reais ao catálogo segmentado", () => {
    expect(segmentQuerySource).toContain("specifications: products.specifications");
    expect(segmentQuerySource).toContain("allowedCarriers: products.allowedCarriers");
    expect(segmentQuerySource).toContain("minWidth: products.minWidth");
    expect(segmentQuerySource).toContain("pixPrice: products.pixPrice");
    expect(segmentQuerySource).toContain("cardPrice: products.cardPrice");
  });
});
