import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");

describe("layout do configurador de produto", () => {
  it("não exibe o bloco de diferenciais ao lado do resumo do pedido", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).not.toContain("Nossos diferenciais");
    expect(source).not.toContain("COMPANY_DIFFERENTIALS");
    expect(source).toContain("Resumo do pedido");
    expect(source).toContain("Pagamento Seguro");
    expect(source).toContain('xl:grid-cols-[240px_minmax(0,1fr)]');
    expect(source).toContain('lg:grid-cols-[minmax(0,1fr)_280px]');
    expect(source).toContain('h-fit space-y-4 lg:sticky lg:top-4');
    expect(source).toContain("<MariaGuide compact />");
    expect(source).toContain('<div className="hidden lg:block"><MariaGuide compact /></div>');
    expect(source).toContain('<div className="lg:hidden">\n            <MariaGuide compact />');
    expect(source.lastIndexOf('<div className="lg:hidden">\n            <MariaGuide compact />')).toBeGreaterThan(source.indexOf("Resumo do pedido"));
    expect(source).toContain("leading-relaxed lg:line-clamp-5");
    expect(source).toContain("TermsAcceptance checked={acceptedTerms}");
    expect(source).toContain("const [isMobileProductInfoOpen, setIsMobileProductInfoOpen] = useState(false);");
    expect(source).toContain('aria-controls="product-mobile-information"');
    expect(source).toContain('aria-expanded={isMobileProductInfoOpen}');
    expect(source).toContain('className={`space-y-3 ${isMobileProductInfoOpen ? "block" : "hidden"} lg:block`}');
    expect(source).toContain('lg:line-clamp-5');
  });

  it("padroniza os controles interativos e CTAs do configurador na identidade rosa", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain("backgroundColor: isCompleted ? undefined : '#ec4899'");
    expect(source).toContain('bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl text-base h-12');
    expect(source).toContain('border-pink-500 text-pink-700 hover:bg-pink-50');
    expect(source).toContain('border-pink-500 bg-pink-50 shadow-sm');
  });

  it("alinha os rótulos de largura e altura no mobile sem alterar o texto desktop", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain('>Largura (metros)</Label>');
    expect(source).toContain('<span>Altura</span>');
    expect(source).toContain('<span className="block md:inline"> (metros)</span>');
  });
});
