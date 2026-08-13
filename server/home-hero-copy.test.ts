import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const heroSectionPath = resolve(process.cwd(), "client/src/components/home/HeroSection.tsx");

describe("conteúdo do banner principal", () => {
  it("mantém a chamada Pede pra Maria em uma segunda linha", () => {
    const source = readFileSync(heroSectionPath, "utf8");

    expect(source).toContain("Precisou imprimir?<br />");
    expect(source).toContain('Pede pra{" "}');
    expect(source).toContain('<span style={{ color: "#E6005C" }}>Maria.</span>');
    expect(source).not.toContain('Pedi pra{" "}');
  });

  it("conecta a barra de busca exclusivamente aos resultados de produtos", () => {
    const source = readFileSync(heroSectionPath, "utf8");

    expect(source).toContain("trpc.search.global.useQuery");
    expect(source).toContain("const productResults = searchResults?.products ?? []");
    expect(source).toContain("placeholder=\"Buscar produtos...\"");
    expect(source).toContain('navigate(`/produto/${productId}`)');
    expect(source).not.toContain("searchResults?.categories");
    expect(source).not.toContain("searchResults?.materials");
  });

  it("exibe carregamento, miniatura, preço e estado vazio nos resultados", () => {
    const source = readFileSync(heroSectionPath, "utf8");

    expect(source).toContain('aria-label="Buscando produtos"');
    expect(source).toContain("animate-spin");
    expect(source).toContain("product.imageUrl");
    expect(source).toContain("formatProductPrice(product)");
    expect(source).toContain("Nenhum produto encontrado para");
  });
});
