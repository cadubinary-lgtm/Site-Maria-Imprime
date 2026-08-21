import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("normas para envio de arte", () => {
  it("disponibiliza o conteúdo inicial como documento público separado", () => {
    const siteContent = read("client/src/lib/siteContent.ts");
    expect(siteContent).toContain('slug: "normas-envio-arte"');
    expect(siteContent).toContain("Como preparar sua arte para impressão");
    expect(siteContent).toContain("Artes criadas por Inteligência Artificial");
    expect(siteContent).toContain("ARTWORK_GUIDELINES_CONTENT = `## Como preparar sua arte para impressão");
  });

  it("direciona o configurador para a página específica em todos os layouts", () => {
    const mariaGuide = read("client/src/components/products/MariaGuide.tsx");
    const checklist = read("client/src/components/home/PrePrintChecklist.tsx");
    expect(mariaGuide).toContain('href="/documentos/normas-envio-arte"');
    expect(mariaGuide).toContain('aria-label="Ver normas para envio da arte"');
    expect(checklist.match(/href="\/documentos\/normas-envio-arte"/g)?.length).toBe(2);
    expect(checklist).toContain('import { HOME_PRIMARY_ACTION_CLASS } from "@/lib/homeActionStyles"');
    expect(checklist.match(/\$\{HOME_PRIMARY_ACTION_CLASS\}/g)?.length).toBe(2);
    expect(checklist).not.toContain("HOME_SECONDARY_ACTION_CLASS");
  });

  it("oferece edição administrativa dedicada com publicação e visualização pública", () => {
    const admin = read("client/src/pages/admin/AdminArtworkGuidelines.tsx");
    const app = read("client/src/App.tsx");
    const layout = read("client/src/components/AdminLayout.tsx");
    expect(admin).toContain("trpc.siteContent.getAdminDocuments.useQuery");
    expect(admin).toContain("trpc.siteContent.saveDocuments.useMutation");
    expect(admin).toContain('href={`/documentos/${SLUG}`}');
    expect(app.match(/admin\/configuracoes-site\/normas-de-arte/g)?.length).toBe(2);
    expect(layout).toContain('label: "Normas de arte"');
  });
});
