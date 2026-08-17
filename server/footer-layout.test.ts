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
    expect(source).toContain('documentationPath("termos-venda")');
    expect(source).toContain('documentationPath("privacidade-lgpd")');
    expect(source).toContain('documentationPath("faq")');
    expect(source).toContain('documentationPath("formas-pagamento")');
    expect(source).toContain('documentationPath("entrega-retirada")');
    expect(source).not.toContain('/produto/1200001');
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
    expect(terms).toContain("PUBLIC_DOCUMENTS");
    expect(terms).toContain('id: "formas-pagamento"');
    expect(terms).toContain('id: "entrega-retirada"');
    expect(terms).toContain('get("document")');
    expect(terms).toContain("setDocumentationOpen");
  });

  it("mantém a rolagem pública contida sem criar espaço após o rodapé", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const home = readFileSync(resolve(root, "client/src/pages/public/Home.tsx"), "utf8");
    const header = readFileSync(resolve(root, "client/src/components/layout/Header.tsx"), "utf8");
    expect(app).toContain('id="public-site-scroll-container" className="flex-1"');
    expect(app).toContain('className="min-h-screen flex items-stretch"');
    expect(app).not.toContain('flex h-screen min-h-0 overflow-hidden');
    expect(app).not.toContain('overflow-y-auto');
    expect(header).toContain('window.scrollTo({ top: 0, left: 0, behavior: "smooth" })');
    expect(header).not.toContain('publicScrollContainer?.scrollTo');
    expect(home).toContain('<div className="bg-white">');
    expect(home).not.toContain('min-h-screen bg-white');
  });

  it("usa as marcas de pagamento e os selos solicitados no rodapé", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(footer).toContain('from "react-icons/si"');
    expect(footer).toContain('SiVisa');
    expect(footer).toContain('SiMastercard');
    expect(footer).toContain('SiAmericanexpress');
    expect(footer).toContain('SiDinersclub');
    expect(footer).toContain('/manus-storage/elo_78934248.png');
    expect(footer).toContain('/manus-storage/hipercard_0e7a4bf3.png');
    expect(footer).toContain('/manus-storage/cabal_27d82c64.png');
    expect(footer).not.toContain('SiPix');
    expect(footer).not.toContain('/manus-storage/boleto_d74f05f4.jpg');
    expect(footer).toContain('Google Safe Browsing');
    expect(footer).toContain('SSL Certificado');
    expect(footer).toContain('/manus-storage/google-safe-browsing-large_347d2bfd.png');
    expect(footer).toContain('/manus-storage/ssl-certificado_6ff35a41.png');
  });

  it("organiza a faixa em três blocos proporcionais com selos ampliados", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(footer).toContain('lg:grid-cols-[1.72fr_1fr_1.12fr]');
    expect(footer).toContain('grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-7');
    expect(footer).toContain('h-16 w-full min-w-0');
    expect(footer).toContain('h-16 w-16');
    expect(footer).toContain('grid grid-cols-1 gap-2.5 sm:gap-3');
    expect(footer).toContain('h-20 min-w-0 items-center');
    expect(footer).toContain('h-16 w-full object-contain');
    expect(footer).toContain('lg:border-l lg:border-t-0');
    expect(footer).toContain('sm:p-7');
  });

  it("explica as bandeiras no hover e informa as condições de pagamento", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(footer).toContain('title={label}');
    expect(footer).toContain('role="tooltip"');
    expect(footer).toContain('group-hover:opacity-100');
    expect(footer).toContain('group-focus-visible:opacity-100');
    expect(footer).toContain('PaymentBadge label="Visa"');
    expect(footer).toContain('PaymentBadge label="American Express"');
    expect(footer).toContain('PaymentBadge label="Diners Club"');
    expect(footer).toContain('Pagamentos parcelados terão acréscimo de juros da operadora. Nota fiscal sujeita a emissão de acordo com prestador de serviço, conforme legislação pertinente.');
  });

  it("permite validar os dois selos de segurança e explica o status no hover", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(footer).toContain('function SecuritySealLink');
    expect(footer).toContain('https://transparencyreport.google.com/safe-browsing/search?url=mariaimprime.com.br');
    expect(footer).toContain('https://www.sslshopper.com/ssl-checker.html#hostname=mariaimprime.com.br');
    expect(footer).toContain('target="_blank" rel="noopener noreferrer"');
    expect(footer).toContain('Site 100% seguro e verificado');
    expect(footer).toContain('SecuritySealLink href=');
  });

  it("amplia suavemente os selos de segurança no hover e no foco", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(footer).toContain('transition duration-200 ease-out');
    expect(footer).toContain('hover:scale-[1.03]');
    expect(footer).toContain('focus-visible:scale-[1.03]');
    expect(footer).toContain('motion-reduce:hover:scale-100');
  });

  it("abre os canais sociais em nova aba e confirma visualmente a newsletter", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(footer).toContain('target="_blank"');
    expect(footer).toContain('rel="noopener noreferrer"');
    expect(footer).toContain('window.open(`mailto:${company.supportEmail}');
    expect(footer).toContain('setNewsletterStatus("success")');
    expect(footer).toContain('CheckCircle2');
    expect(footer).toContain('Tudo certo! Abrimos seu e-mail para confirmar o cadastro.');
  });

  it("valida o formato de e-mail antes de exibir sucesso na newsletter", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");
    expect(footer).toContain('const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;');
    expect(footer).toContain('if (!emailPattern.test(email))');
    expect(footer).toContain('Digite um endereço de e-mail válido para continuar.');
    expect(footer).toContain('aria-invalid={newsletterStatus === "error"}');
  });
});
