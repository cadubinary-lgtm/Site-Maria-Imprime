import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

describe("rodapé institucional da Maria Imprime", () => {
  it("organiza apresentação, navegação, newsletter, pagamentos e segurança", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(source).toContain("Fique por dentro!");
    expect(source).toContain("Formas de pagamento");
    expect(source).toContain("Google Safe Browsing");
    expect(source).toContain("Ambiente protegido");
    expect(source).toContain("Navegação segura e proteção dos seus dados.");
    expect(source).toContain('documentationUrl("termos-venda")');
    expect(source).toContain('documentationUrl("privacidade-lgpd")');
    expect(source).toContain('documentationUrl("faq")');
  });

  it("usa dados reais da empresa e mantém layout responsivo", () => {
    const source = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(source).toContain("useCompanySettings");
    expect(source).toContain("company.legalName");
    expect(source).toContain("company.cnpj");
    expect(source).toContain("lg:grid-cols");
    expect(source).toContain("md:grid-cols-3");
  });

  it("permite abrir cada documento específico da Central pelo rodapé", () => {
    const terms = readFileSync(resolve(root, "client/src/components/TermsAcceptance.tsx"), "utf8");
    expect(terms).toContain('id: "aprovacao-arte"');
    expect(terms).toContain('id: "trocas-reembolsos"');
    expect(terms).toContain('get("document")');
    expect(terms).toContain("setDocumentationOpen");
  });

  it("mantém a rolagem pública contida sem criar espaço após o rodapé", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const home = readFileSync(resolve(root, "client/src/pages/public/Home.tsx"), "utf8");
    expect(app).toContain('id="public-site-scroll-container" className="min-h-0 flex-1 overflow-y-auto"');
    expect(app).toContain('flex h-screen min-h-0 overflow-hidden');
    expect(home).toContain('<div className="bg-white">');
    expect(home).not.toContain('min-h-screen bg-white');
  });

  it("usa marcas oficiais nos meios de pagamento e no selo Google", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(footer).toContain('from "react-icons/si"');
    expect(footer).toContain('SiPix');
    expect(footer).toContain('SiVisa');
    expect(footer).toContain('SiMastercard');
    expect(footer).toContain('SiGoogle');
    expect(footer).toContain('SSL / TLS');
  });
});
