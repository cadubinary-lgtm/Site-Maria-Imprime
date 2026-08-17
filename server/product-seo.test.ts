import { describe, expect, it } from "vitest";
import { getProductSeoMetadata } from "../shared/productSeo";
import { injectProductSeoTags } from "./productSeo";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const lona = {
  id: 1200001,
  name: "Lona Impressa",
  description: "Lona personalizada para fachadas, eventos e campanhas promocionais.",
  price: "0",
  pricePerM2: "75.00",
  pixPricePerM2: "60.00",
  cardPricePerM2: "75.00",
  calculationType: "m2",
  imageUrl: "/manus-storage/products/lona.png",
  category: "Comunicação visual",
  segment: "Lonas",
  isActive: true,
};

describe("SEO de páginas de produto", () => {
  it("usa o preço Pix correto por m² na oferta estruturada, sem usar o fallback técnico", () => {
    const seo = getProductSeoMetadata(lona);
    const product = seo.jsonLd["@graph"][0] as Record<string, any>;

    expect(seo.title).toBe("Lona Impressa | Maria Imprime");
    expect(product.offers.price).toBe("60.00");
    expect(product.offers.priceCurrency).toBe("BRL");
    expect(product.offers.priceSpecification.referenceQuantity.unitText).toBe("por m²");
    expect(product.image).toBe("https://mariaimprime.com.br/manus-storage/products/lona.png");
  });

  it("substitui as tags da página inicial pelas tags individuais do produto", () => {
    const homeHtml = `<!doctype html><html><head><title>Maria Imprime</title><meta name="description" content="Home" /><meta property="og:title" content="Home" /><meta name="twitter:title" content="Home" /><link rel="canonical" href="https://mariaimprime.com.br/" /></head><body></body></html>`;
    const productHtml = injectProductSeoTags(homeHtml, lona);

    expect(productHtml).toContain("Lona Impressa | Maria Imprime");
    expect(productHtml).toContain('property="og:type" content="product"');
    expect(productHtml).toContain('property="og:url" content="https://mariaimprime.com.br/produto/1200001"');
    expect(productHtml).toContain('id="product-seo-jsonld"');
    expect(productHtml).not.toContain('content="Home"');
  });

  it("mantém o tipo Open Graph de produto também após a navegação no cliente", () => {
    const productDetail = readFileSync(resolve(import.meta.dirname, "../client/src/pages/ecommerce/ProductDetail.tsx"), "utf8");

    expect(productDetail).toContain("updateMeta('meta[property=\"og:type\"]', \"product\")");
  });

  it("preserva a rota original durante a entrega do HTML de desenvolvimento", () => {
    const viteServer = readFileSync(resolve(import.meta.dirname, "./_core/vite.ts"), "utf8");

    expect(viteServer).toContain('injectProductSeoForPath(req.originalUrl.split("?")[0], template)');
  });
});
