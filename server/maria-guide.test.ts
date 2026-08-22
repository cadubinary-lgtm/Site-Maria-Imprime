import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Guia da Maria global", () => {
  it("mantém uma biblioteca global publicável para todos os configuradores", () => {
    const schema = readFileSync(resolve(root, "drizzle/schema.ts"), "utf8");
    const migration = readFileSync(resolve(root, "drizzle/0061_create_maria_guide_settings.sql"), "utf8");
    const router = readFileSync(resolve(root, "server/siteContentRouter.ts"), "utf8");
    const content = readFileSync(resolve(root, "client/src/lib/mariaGuide.ts"), "utf8");

    expect(schema).toContain('mysqlTable("siteMariaGuideSettings"');
    expect(migration).toContain("CREATE TABLE `siteMariaGuideSettings`");
    expect(router).toContain("getPublicMariaGuide: publicProcedure");
    expect(router).toContain("saveMariaGuideDraft: adminProcedure");
    expect(router).toContain("publishMariaGuide: adminProcedure");
    expect(content).toContain("MARIA_GUIDE_FALLBACK");
    expect(content).toContain('id: "impressao"');
    expect(content).toContain('id: "material"');
    expect(content).toContain('id: "acabamento"');
    expect(content).toContain('id: "entrega"');
    expect(content).toContain('"lona-sanet"');
    expect(content).toContain("Lona Ortofônica / Sanet — Perfurada");
    expect(content).toContain("O corte linear padrão realizado em guilhotinas de alta precisão");
    expect(content).toContain("Película plástica opaca e acetinada que elimina reflexos de luz");
    expect(content).toContain("Laminação Fosca para Lona");
    expect(content).toContain("Hot Stamping");
    expect(content).toContain("Fita Dupla Face Aplicada");
    expect(router).toContain('"lona-sanet"');
  });

  it("substitui os quatro cards promocionais no configurador sem tocar na lógica de pedido", () => {
    const productDetail = readFileSync(resolve(root, "client/src/pages/ecommerce/ProductDetail.tsx"), "utf8");
    const guide = readFileSync(resolve(root, "client/src/components/products/MariaGuide.tsx"), "utf8");

    expect(productDetail).toContain("<MariaGuide compact />");
    expect(productDetail).not.toContain("Qualidade garantida");
    expect(productDetail).not.toContain("Melhor prazo do mercado");
    expect(productDetail).not.toContain("Preço justo");
    expect(productDetail).not.toContain("Satisfação garantida");
    expect(productDetail).toContain("selectedPaymentMethod");
    expect(productDetail).toContain("handleAddToCart");
    expect(guide).toContain("TechnicalIllustration");
    expect(guide).toContain('"lona-ilhos"');
    expect(guide).toContain('"adesivo-perfurado"');
    expect(guide).toContain("laminacao:");
    expect(guide).toContain('"meio-corte"');
    expect(guide).toContain('"lona-sanet"');
    expect(guide).toContain('"hot-stamping"');
    expect(guide).toContain("serrilha:");
    expect(guide).toContain('"borda-arredondada"');
    expect(guide).toContain('"fita-dupla-face"');
    expect(guide).toContain('"verniz-brilho-lona"');
    expect(guide).toContain('"laminacao-fosca-lona"');
    expect(guide).toContain('selectedFinish && <div className="border-b border-pink-100 bg-pink-50/40 px-3 py-3');
    expect(guide).toContain('aria-live="polite"');
    expect(guide).not.toContain("selectedFinish?.illustration &&");
    expect(guide).not.toContain("selectedFinish && !selectedFinish.illustration");
    [
      "refile:", '"corte-especial":', '"meio-corte":', '"laminacao-brilho":', '"laminacao-fosca":',
      '"verniz-localizado":', '"uv-localizado":', "ilhos:", "bastao:", "ponteira:", "solda:", "dobra:",
      "vinco:", "furo:", "enobrecimentos:", "aplicacao:", "embalagem:", "numeracao:", '"hot-stamping":',
      "serrilha:", '"borda-arredondada":', '"fita-dupla-face":', '"verniz-brilho-lona":', '"verniz-fosco-lona":',
      '"laminacao-brilho-lona":', '"laminacao-fosca-lona":',
    ].forEach((drawingKey) => expect(guide).toContain(drawingKey));
    expect(guide).toContain("compact = false");
    expect(guide).toContain("grid-cols-2 md:grid-cols-4");
    expect(guide).toContain("responsivePanelGridClass");
    expect(guide).toContain('panelSpacingClass = compact ? "mt-1.5 gap-1.5"');
    expect(guide).toContain("maria-guide-impressao");
    expect(guide).toContain("maria-guide-material");
    expect(guide).toContain("maria-guide-acabamento");
    expect(guide).toContain("maria-guide-entrega");
    expect(guide).toContain("expandedPanels");
    expect(guide).toContain("togglePanel");
    expect(guide).toContain('new Set<MariaGuideSection["id"]>(["impressao"])');
    expect(guide).toContain("return current.has(section.id) ? new Set() : new Set([section.id])");
    expect(guide).toContain("aria-controls");
    expect(guide).toContain("aria-expanded");
    expect(guide).toContain("Escolha um dos quatro cards acima para expandir");
    expect(guide).toContain("maria-material-${category.id}");
    expect(guide).toContain("openMaterialId === category.id &&");
    expect(guide).toContain("mg-top-card");
    expect(guide).toContain("min-h-[40px]");
    expect(guide).toContain("mg-top-subtitle");
    expect(guide).toContain('{!compact && <p className="mg-top-subtitle');
    expect(guide).toContain("min-h-[104px]");
    expect(guide).toContain("const hasPinkBackground = isExpanded");
    expect(guide).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(guide).toContain('href="/documentos/normas-envio-arte"');
    expect(guide).not.toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(guide).not.toContain('href="#maria-guide-entrega"');
    expect(guide).not.toContain("Falar com a Maria</a>");
    expect(guide).toContain("Ver normas para envio de arte");
    expect(guide).toContain("lg:grid-cols-[minmax(0,1fr)_3rem]");
    expect(guide).toContain('lg:w-12');
    expect(guide).toContain('aria-label="Ver normas para envio da arte"');
    expect(guide).toContain('HOME_SECONDARY_ACTION_CLASS} h-9 min-w-[9.5rem] shrink-0 gap-1 px-3 text-[10px]');
    expect(guide).toContain('<span className="whitespace-nowrap font-semibold lg:sr-only">Ver normas para envio de arte</span>');
    expect(guide).toContain('className="flex w-full justify-center lg:w-12 lg:justify-end"');
  });

  it("oferece edição, ordenação, prévia e publicação no painel administrativo", () => {
    const page = readFileSync(resolve(root, "client/src/pages/admin/AdminMariaGuide.tsx"), "utf8");
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    const layout = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");

    expect(page).toContain("Salvar rascunho");
    expect(page).toContain("Publicar alterações");
    expect(page).toContain("Ver prévia");
    expect(page).toContain("Adicionar categoria");
    expect(page).toContain("Adicionar item");
    expect(page).toContain("moveItem");
    expect(app.match(/path="\/admin\/configuracoes-site\/guia-da-maria" component=\{AdminMariaGuide\}/g)).toHaveLength(2);
    expect(layout).toContain('label: "Guia da Maria", href: "/admin/configuracoes-site/guia-da-maria"');
  });
});
