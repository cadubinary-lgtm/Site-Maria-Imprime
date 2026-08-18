import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const contact = readFileSync(resolve(import.meta.dirname, "../client/src/pages/public/ContactPage.tsx"), "utf8");
const app = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const footer = readFileSync(resolve(import.meta.dirname, "../client/src/components/home/Footer.tsx"), "utf8");

describe("página pública de contato", () => {
  it("reutiliza dados reais da empresa e os canais públicos configurados", () => {
    expect(contact).toContain("useCompanySettings");
    expect(contact).toContain("useWhatsAppButtonVisibility");
    expect(contact).toContain("getCompanyAddressLine");
    expect(contact).toContain("getCompanyLocationLine");
  });

  it("protege canais externos e mantém continuidade para catálogo", () => {
    expect(contact).toContain('target="_blank" rel="noopener noreferrer"');
    expect(contact).toContain('href="/catalogo"');
    expect(contact).toContain('aria-labelledby="contact-page-title"');
  });

  it("registra a rota e conecta o suporte do rodapé à página","", () => {
    expect(app).toContain('Route path="/contato" component={ContactPage}');
    expect(footer).toContain('href="/contato"');
  });
});
