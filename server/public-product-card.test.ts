import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const publicCardSource = readFileSync(resolve(root, "client/src/components/products/PublicProductCard.tsx"), "utf8");
const globalStyles = readFileSync(resolve(root, "client/src/index.css"), "utf8");
const featuredSource = readFileSync(resolve(root, "client/src/components/home/FeaturedProducts.tsx"), "utf8");
const catalogSource = readFileSync(resolve(root, "client/src/pages/public/Catalog.tsx"), "utf8");
const allProductsSource = readFileSync(resolve(root, "client/src/pages/public/AllProducts.tsx"), "utf8");
const segmentQuerySource = readFileSync(resolve(root, "server/db-product-segments.ts"), "utf8");
const tagBadgeSource = readFileSync(resolve(root, "client/src/components/products/ProductTagBadges.tsx"), "utf8");

describe("cards públicos informativos", () => {
  it("mantém a composição compacta e só exibe urgência de m² quando ela estiver configurada", () => {
    expect(publicCardSource).toContain("getProductPaymentPrices(product, priceAudience)");
    expect(publicCardSource).not.toContain("getPixDiscountInfo(product, priceAudience)");
    expect(publicCardSource).toContain("parseSpecifications(product.specifications)");
    expect(publicCardSource).toContain("object-contain");
    expect(publicCardSource).not.toContain("object-cover");
    expect(publicCardSource).not.toContain("Desconto no Pix");
    expect(publicCardSource).toContain('className="product-card-content relative -mt-3 px-4 pb-4 pt-0"');
    expect(publicCardSource).toContain('text-[17px]');
    expect(publicCardSource).toContain("product-card-content");
    expect(publicCardSource).toContain("product-card-title");
    expect(publicCardSource).toContain("product-card-pix-price");
    expect(publicCardSource).toContain("product-card-card-price");
    expect(publicCardSource).toContain("formatPriceAmount(paymentPrices.pix.value)");
    expect(publicCardSource).toContain("formatPriceAmount(paymentPrices.card.value)");
    expect(publicCardSource).toContain('className="product-card-currency"');
    expect(publicCardSource).toContain('className="sr-only"');
    expect(publicCardSource).toContain("product-card-pix-caption");
    expect(publicCardSource).toContain("product-card-card-caption");
    expect(publicCardSource).toContain('product-card-pix-caption mt-px');
    expect(publicCardSource).toContain('product-card-card-caption mt-px');
    expect(publicCardSource).toContain("product-card-urgency-content");
    expect(publicCardSource).toContain("product-card-area-unit");
    expect(publicCardSource).toContain("product-card-urgency");
    expect(publicCardSource).toContain("mt-1.5 grid gap-2");
    expect(publicCardSource).not.toContain("product.description &&");
    expect(publicCardSource).not.toContain("operationalFacts");
    expect(publicCardSource).toContain("sameDayUrgency");
    expect(publicCardSource).toContain("Produção no mesmo dia");
    expect(publicCardSource).toContain("cardDescriptionLines.length > 0 || sameDayUrgency");
    expect(publicCardSource).toContain("flex-col gap-0.5");
    expect(publicCardSource).toContain('className="truncate"');
    expect(publicCardSource).toContain('className="product-card-urgency-content min-w-0 break-words"');
    expect(publicCardSource).toContain('whitespace-nowrap text-[clamp(0.9375rem,1.7vw,1.1875rem)]');
    expect(publicCardSource.match(/whitespace-nowrap text-\[clamp\(0\.9375rem,1\.7vw,1\.1875rem\)\]/g)).toHaveLength(2);
    expect(publicCardSource).toContain('relative z-10 min-w-0 border-l border-gray-200 bg-white pl-2');
    expect(publicCardSource).toContain('formatCurrency(paymentPrices.pix.value)');
    expect(publicCardSource).toContain('formatCurrency(paymentPrices.card.value)');
    expect(publicCardSource).toContain(">no Pix</p>");
    expect(publicCardSource).not.toContain("% de desconto");
    expect(publicCardSource).not.toContain('formatCurrency(paymentPrices.pix.value, pricingSuffix)');
    expect(publicCardSource).not.toContain('formatCurrency(paymentPrices.card.value, paymentPrices.card.suffix)');
    expect(publicCardSource).toContain("product-card-action");
    expect(publicCardSource).toContain("flex h-4 w-1/2");
    expect(publicCardSource).toContain("mx-auto");
    expect(publicCardSource).toContain("text-[9px]");
    expect(publicCardSource).toContain("text-[9px]");
    expect(publicCardSource).toContain("hover:bg-pink-700 hover:shadow-md");
    expect(publicCardSource).not.toContain("group-hover:bg-pink-700");
    expect(tagBadgeSource).toContain("w-1/2");
    expect(tagBadgeSource).toContain("product-tag-badge flex h-4 w-full");
    expect(tagBadgeSource).toContain("px-0 py-0");
    expect(tagBadgeSource).toContain("top-2 right-2");
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

  it("apresenta uma alternativa visual acessível quando a imagem ainda não está disponível", () => {
    expect(publicCardSource).toContain('aria-label={`Imagem de ${product.name} indisponível`}');
    expect(publicCardSource).toContain("Imagem em atualização");
    expect(publicCardSource).toContain("Confira os detalhes e opções deste produto.");
    expect(publicCardSource).toContain("ImageOff");
    expect(publicCardSource).not.toContain('items-center justify-center text-sm text-gray-400">Sem imagem');
  });

  it("mantém os valores completos na grade compacta de seis produtos", () => {
    expect(globalStyles).toContain(".featured-products-grid .product-card-pix-price");
    expect(globalStyles).toContain(".featured-products-grid .product-card-card-price");
    expect(globalStyles).toContain("white-space: nowrap;");
    expect(globalStyles).toContain("letter-spacing: -0.04em;");
    expect(globalStyles).toContain(".product-card-currency {");
    expect(globalStyles).toContain("font-size: 0.625em;");
    expect(globalStyles).toContain(".product-card-area-unit {");
    expect(globalStyles).toContain("font-size: 2em;");
    expect(globalStyles).toContain(".featured-products-grid .product-card-pix-price {\n      white-space: nowrap;\n      font-size: 0.8125rem;");
    expect(globalStyles).toContain(".featured-products-grid .product-card-card-price {\n      white-space: nowrap;\n      font-size: 0.8125rem;");
    expect(globalStyles).toContain(".featured-products-grid .product-card-action {");
    expect(globalStyles).toContain("width: 50%;");
    expect(globalStyles).toContain("height: 1rem;");
    expect(globalStyles).toContain("margin: 0.5rem auto 0;");
    expect(globalStyles).toContain("font-size: 0.5rem;");
    expect(globalStyles).toContain("font-size: 0.4375rem;");
    expect(globalStyles).toContain("font-size: 0.375rem;");
  });
});
