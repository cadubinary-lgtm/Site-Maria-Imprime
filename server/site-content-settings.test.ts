import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("configurações públicas do rodapé", () => {
  it("persiste textos do rodapé e documentos com acesso administrativo", () => {
    const schema = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
    const router = readFileSync(resolve(root, "server/siteContentRouter.ts"), "utf8");
    const content = readFileSync(resolve(root, "client/src/lib/siteContent.ts"), "utf8");

    expect(schema).toContain('mysqlTable("siteFooterSettings"');
    expect(schema).toContain('footerProductSegmentIds: text("footerProductSegmentIds")');
    expect(schema).toContain('mysqlTable("siteDocuments"');
    expect(router).toContain("saveFooter: adminProcedure");
    expect(router).toContain("saveFooterProductSegments: adminProcedure");
    expect(router).toContain("segmentIds: z.array(z.number().int().positive()).min(1");
    expect(router).toContain("inArray(segments.id, input.segmentIds)");
    expect(router).toContain("saveDocuments: adminProcedure");
    expect(router).toContain("getPublicDocuments: publicProcedure");
    expect(content).toContain("mergeFooterContent");
    expect(content).toContain("parseFooterProductSegmentIds");
    expect(content).toContain("overrides?.introduction ?? FOOTER_CONTENT_FALLBACK.introduction");
  });

  it("inclui o item Configurações do site no menu e a página de Informações do rodapé", () => {
    const sidebar = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const page = readFileSync(resolve(root, "client/src/pages/admin/AdminFooterInformation.tsx"), "utf8");

    expect(sidebar).toContain('label: "CONFIGURAÇÕES DO SITE"');
    expect(sidebar).toContain('label: "Informações do rodapé", href: "/admin/configuracoes-site/rodape"');
    expect(app).toContain('path="/admin/configuracoes-site/rodape" component={AdminFooterInformation}');
    expect(page).toContain("Salvar textos do rodapé");
    expect(page).toContain("Salvar documentos públicos");
    expect(page).toContain("Produtos exibidos no rodapé");
    expect(page).toContain("Salvar produtos do rodapé");
    expect(page).toContain("MAX_FOOTER_PRODUCT_SEGMENTS = 8");
    expect(page).toContain("moveFooterSegment");
    expect(page).toContain('id: "site-footer-content-save"');
    expect(page).toContain('id: "site-documents-save"');
  });

  it("reflete no rodapé público os segmentos configurados em sua ordem persistida", () => {
    const footer = readFileSync(resolve(root, "client/src/components/home/Footer.tsx"), "utf8");

    expect(footer).toContain("trpc.segments.list.useQuery");
    expect(footer).toContain("parseFooterProductSegmentIds(savedFooterContent?.footerProductSegmentIds)");
    expect(footer).toContain("footerProductSegments.length > 0");
    expect(footer).toContain("href={`/catalogo?segmentId=${segment.id}`}");
  });
});
