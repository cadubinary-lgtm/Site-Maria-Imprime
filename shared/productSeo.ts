import { getProductPaymentPrices } from "../client/src/lib/productPrice";

const SITE_URL = "https://mariaimprime.com.br";
const DEFAULT_SHARE_IMAGE = `${SITE_URL}/manus-storage/maria-imprime-compartilhamento_0ede79e1.png`;

type SeoProduct = {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  galleryUrls?: string | null;
  price: string | number;
  pixPrice?: string | number | null;
  cardPrice?: string | number | null;
  resellerPrice?: string | number | null;
  pricePerM2?: string | number | null;
  pixPricePerM2?: string | number | null;
  cardPricePerM2?: string | number | null;
  resellerPricePerM2?: string | number | null;
  calculationType?: string | null;
  unit?: string | null;
  category?: string | null;
  segment?: string | null;
  isActive?: boolean | null;
  rating?: string | number | null;
  reviewCount?: string | number | null;
};

function toAbsoluteUrl(url?: string | null) {
  if (!url) return DEFAULT_SHARE_IMAGE;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getFirstProductImage(product: SeoProduct) {
  if (product.imageUrl) return toAbsoluteUrl(product.imageUrl);
  try {
    const gallery = JSON.parse(product.galleryUrls ?? "[]");
    if (Array.isArray(gallery) && typeof gallery[0] === "string") return toAbsoluteUrl(gallery[0]);
  } catch {
    // A imagem de compartilhamento institucional é usada como fallback seguro.
  }
  return DEFAULT_SHARE_IMAGE;
}

function cleanDescription(description: string | null | undefined, name: string) {
  const clean = (description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const fallback = `${name} na Maria Imprime. Personalize seu produto, envie sua arte e solicite seu orçamento online.`;
  return (clean || fallback).slice(0, 160);
}

function getUnitLabel(suffix: string) {
  if (suffix === "/m²") return "por m²";
  if (suffix === "/ml") return "por metro linear";
  return "por unidade";
}

export function getProductSeoMetadata(product: SeoProduct) {
  const paymentPrices = getProductPaymentPrices(product, "final");
  const price = paymentPrices.pix.value;
  const description = cleanDescription(product.description, product.name);
  const url = `${SITE_URL}/produto/${product.id}`;
  const image = getFirstProductImage(product);
  const title = `${product.name} | Maria Imprime`;
  const keywords = [product.name, product.category, product.segment, "gráfica online", "comunicação visual", "Maria Imprime"]
    .filter(Boolean)
    .join(", ");

  const productSchema: Record<string, unknown> = {
    "@type": "Product",
    name: product.name,
    description,
    image,
    sku: String(product.id),
    url,
    brand: { "@type": "Brand", name: "Maria Imprime" },
    itemCondition: "https://schema.org/NewCondition",
  };

  if (price > 0) {
    productSchema.offers = {
      "@type": "Offer",
      url,
      priceCurrency: "BRL",
      price: price.toFixed(2),
      availability: product.isActive === false
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "BRL",
        price: price.toFixed(2),
        referenceQuantity: {
          "@type": "QuantitativeValue",
          value: 1,
          unitText: getUnitLabel(paymentPrices.pix.suffix),
        },
      },
    };
  }

  const rating = Number(product.rating ?? 0);
  const reviewCount = Number(product.reviewCount ?? 0);
  if (rating > 0 && reviewCount > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      reviewCount,
    };
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      productSchema,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Produtos", item: `${SITE_URL}/catalogo` },
          { "@type": "ListItem", position: 3, name: product.name, item: url },
        ],
      },
    ],
  };

  return {
    title,
    description,
    keywords,
    url,
    image,
    imageAlt: `${product.name} | Maria Imprime`,
    jsonLd,
  };
}

export function getProductSeoScript(jsonLd: Record<string, unknown>) {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}
