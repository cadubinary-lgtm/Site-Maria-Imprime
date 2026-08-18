import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboard = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminProductsDashboard.tsx"), "utf8");
const metrics = readFileSync(resolve(import.meta.dirname, "../client/src/lib/product-dashboard-metrics.ts"), "utf8");

describe("painel de indicadores de produtos", () => {
  it("distingue preços de pagamento e cadastros que precisam de revisão", () => {
    expect(metrics).toContain("withPaymentPrices");
    expect(metrics).toContain("readyForCatalog");
    expect(metrics).toContain("needsReview");
    expect(dashboard).toContain("Pix e cartão configurados");
    expect(dashboard).toContain("Revisar cadastro");
  });

  it("anuncia indicadores e organiza a lista recente semanticamente", () => {
    expect(dashboard).toContain('aria-label="Indicadores de qualidade do catálogo"');
    expect(dashboard).toContain('aria-busy={isLoading}');
    expect(dashboard).toContain('aria-live="polite"');
    expect(dashboard).toContain('<ul className="space-y-2" aria-label="Produtos recentes">');
  });
});
