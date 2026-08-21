import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("Informações do rodapé recolhíveis", () => {
  it("mantém os grupos principais recolhidos por padrão e acessíveis por seta", () => {
    const page = read("client/src/pages/admin/AdminFooterInformation.tsx");

    expect(page).toContain('import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"');
    expect(page).toContain('<Accordion type="multiple">');
    expect(page).toContain('value="footer-copy"');
    expect(page).toContain('value="public-documents"');
    expect(page).toContain('aria-label="Expandir ou encolher textos institucionais do rodapé"');
    expect(page).toContain('aria-label="Expandir ou encolher documentos e links públicos"');
  });

  it("permite localizar e editar as Normas para envio de arte", () => {
    const page = read("client/src/pages/admin/AdminFooterInformation.tsx");
    const layout = read("client/src/components/AdminLayout.tsx");

    expect(page).toContain('href="/admin/configuracoes-site/normas-de-arte"');
    expect(page).toContain("Editar Normas para envio de arte");
    expect(page).toContain('document.slug === "normas-envio-arte"');
    expect(page).toContain("Normas de arte");
    expect(layout).toContain('{ label: "Normas de arte", href: "/admin/configuracoes-site/normas-de-arte" }');
  });
});
