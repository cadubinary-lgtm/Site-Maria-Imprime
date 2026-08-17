import { getProductById } from "./db";
import { getProductSeoMetadata, getProductSeoScript } from "../shared/productSeo";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function injectProductSeoTags(html: string, product: Parameters<typeof getProductSeoMetadata>[0]) {
  const seo = getProductSeoMetadata(product);
  const head = `
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="keywords" content="${escapeHtml(seo.keywords)}" />
    <link rel="canonical" href="${escapeHtml(seo.url)}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Maria Imprime" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:url" content="${escapeHtml(seo.url)}" />
    <meta property="og:image" content="${escapeHtml(seo.image)}" />
    <meta property="og:image:alt" content="${escapeHtml(seo.imageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${escapeHtml(seo.image)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(seo.imageAlt)}" />
    <script id="product-seo-jsonld" type="application/ld+json">${getProductSeoScript(seo.jsonLd)}</script>`;

  const withoutHomeSeo = html
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="(?:description|keywords)"[^>]*>/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
    .replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, "")
    .replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, "")
    .replace(/<script\s+id="product-seo-jsonld"[\s\S]*?<\/script>/gi, "");

  return withoutHomeSeo.replace("</head>", `${head}\n  </head>`);
}

export async function injectProductSeoForPath(pathname: string, html: string) {
  const match = pathname.match(/^\/produto\/(\d+)\/?$/);
  if (!match) return html;

  const product = await getProductById(Number(match[1]));
  if (!product || product.isActive === false) return html;
  return injectProductSeoTags(html, product);
}
