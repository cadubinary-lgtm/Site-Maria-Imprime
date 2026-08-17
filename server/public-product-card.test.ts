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
  it("mantém a composição compacta e só exibe urgência de m² quando ela estiver configurada", () => {
    expect(publicCardSource).toContain("getProductPaymentPrices(product, priceAudience)");
    expect(publicCardSource).toContain("getPixDiscountInfo(product, priceAudience)");
    expect(publicCardSource).toContain("parseSpecifications(product.specifications)");
    expect(publicCardSource).toContain("object-contain");
    expect(publicCardSource).not.toContain("object-cover");
    expect(publicCardSource).toContain("max-h-full max-w-full object-contain");
    expect(publicCardSource).not.toContain("group-hover:scale-105");
    expect(publicCardSource).not.toContain('aspect-square overflow-hidden bg-gray-50');
    expect(publicCardSource).not.toContain("Desconto no Pix");
    expect(publicCardSource).toContain('className="px-4 pb-4 pt-1"');
    expect(publicCardSource).toContain('text-[17px]');
    expect(publicCardSource).toContain("mt-1.5 grid gap-2");
    expect(publicCardSource).not.toContain("product.description &&");
    expect(publicCardSource).not.toContain("operationalFacts");
    expect(publicCardSource).toContain("sameDayUrgency");
    expect(publicCardSource).toContain("Produção no mesmo dia");
    expect(publicCardSource).toContain("cardDescriptionLines.length > 0 || sameDayUrgency");
    expect(publicCardSource).toContain("flex-col gap-0.5");
    expect(publicCardSource).toContain('className="truncate"');
    expect(publicCardSource).toContain("whitespace-nowrap");
    expect(publicCardSource).toContain("text-[9px]");
    expect(publicCardSource).toContain("hover:bg-pink-700 hover:shadow-md");
    expect(publicCardSource).not.toContain("group-hover:bg-pink-700");
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
