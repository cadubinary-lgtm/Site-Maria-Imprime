import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const heroSectionPath = resolve(process.cwd(), "client/src/components/home/HeroSection.tsx");
const prePrintChecklistPath = resolve(process.cwd(), "client/src/components/home/PrePrintChecklist.tsx");
const publicHomePath = resolve(process.cwd(), "client/src/pages/public/Home.tsx");

describe("conteúdo do banner principal", () => {
  it("mantém a chamada Pede pra Maria em uma segunda linha", () => {
    const source = readFileSync(heroSectionPath, "utf8");

    expect(source).toContain("Precisou imprimir?<br />");
    expect(source).toContain('Pede pra{" "}');
    expect(source).toContain('<span style={{ color: "#E6005C" }}>Maria.</span>');
    expect(source).not.toContain('Pedi pra{" "}');
  });

  it("apresenta a nova mensagem institucional da Maria Imprime", () => {
    const source = readFileSync(heroSectionPath, "utf8");

    expect(source).toContain("Materiais para sua empresa, eventos e negócios,<br />");
    expect(source).toContain("com praticidade e qualidade.");
    expect(source).not.toContain("Aqui você encontra tudo o que precisa");
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
    expect(source).toContain("formatProductPrice(product, priceAudience)");
    expect(source).toContain("Nenhum produto encontrado para");
  });

  it("informa 300 DPI como resolução mínima na conferência de pré-impressão", () => {
    const source = readFileSync(prePrintChecklistPath, "utf8");

    expect(source).toContain("Resolução mínima de 300 DPI");
    expect(source).not.toContain("Resolução mínima de 150 DPI");
  });

  it("não renderiza a seção Como cuidamos do seu pedido na página inicial", () => {
    const source = readFileSync(publicHomePath, "utf8");

    expect(source).not.toContain('import { Testimonials } from "@/components/home/Testimonials"');
    expect(source).not.toContain("<Testimonials />");
    expect(source).toContain("<PrePrintChecklist />");
    expect(source).toContain("<FAQSupport />");
  });
});
