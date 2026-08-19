import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("vitrine pública de produtos em destaque", () => {
  it("usa conteúdo confiável e associa a seção ao seu título", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/FeaturedProducts.tsx"), "utf8");

    expect(source).toContain("Produtos em destaque");
    expect(source).toContain("materiais de comunicação visual");
    expect(source).not.toContain("Confira os favoritos dos nossos clientes");
    expect(source).toContain('aria-labelledby="featured-products-title"');
  });

  it("trata carregamento, falha e ausência de itens com continuidade para o catálogo", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/FeaturedProducts.tsx"), "utf8");

    expect(source).toContain("isError");
    expect(source).toContain('role="alert"');
    expect(source).toContain("Novos produtos serão exibidos aqui em breve.");
    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain('href="/catalogo"');
  });

  it("alinha seis cards ao mesmo limite horizontal do Acesso rápido", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/FeaturedProducts.tsx"), "utf8");

    expect(source).toContain("grid-cols-2");
    expect(source).toContain("md:grid-cols-4");
    expect(source).toContain("xl:grid-cols-6");
    expect(source).toContain("xl:gap-3");
    expect(source).toContain('className="mx-auto max-w-7xl"');
    expect(source).not.toContain("2xl:max-w-[1840px]");
    expect(source).toContain("featured-products-grid");
    expect(source).toContain("<PublicProductCard key={product.id} product={product} priceAudience={priceAudience} />");
  });
});
