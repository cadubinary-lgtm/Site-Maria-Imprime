import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("central pública de documentação", () => {
  it("registra rotas próprias para a central e para cada documento", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");

    expect(app).toContain('import DocumentationPage from "./pages/public/DocumentationPage"');
    expect(app).toContain('<Route path="/documentos" component={DocumentationPage} />');
    expect(app).toContain('<Route path="/documentos/:documentId" component={DocumentationPage} />');
  });

  it("exibe conteúdo individual sem alterar a central do configurador", () => {
    const page = readFileSync(resolve(root, "client/src/pages/public/DocumentationPage.tsx"), "utf8");
    const terms = readFileSync(resolve(root, "client/src/components/TermsAcceptance.tsx"), "utf8");

    expect(page).toContain("mergePublicDocuments");
    expect(page).toContain("siteContent.getPublicDocuments");
    expect(page).toContain("/documentos/:documentId");
    expect(page).toContain("currentDocument.content");
    expect(page).toContain("<Footer />");
    expect(terms).toContain("CHECKOUT_DOCUMENTS.map");
    expect(terms).toContain("setDocumentationOpen");
  });

  it("permite localizar documentos por busca com estado vazio orientado", () => {
    const page = readFileSync(resolve(root, "client/src/pages/public/DocumentationPage.tsx"), "utf8");

    expect(page).toContain('id="document-search"');
    expect(page).toContain("setDocumentQuery");
    expect(page).toContain("filteredDocuments");
    expect(page).toContain('aria-label="Limpar busca de documentos"');
    expect(page).toContain("Nenhum documento encontrado");
    expect(page).toContain('role="status"');
    expect(page).toContain('aria-live="polite"');
  });
});
