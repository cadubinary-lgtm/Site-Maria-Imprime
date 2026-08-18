import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminQuotationForm.tsx"), "utf8");

describe("formulário administrativo de orçamento", () => {
  it("associa condições comerciais e resumo financeiro aos respectivos controles", () => {
    expect(source).toContain('htmlFor="quotation-payment-method"');
    expect(source).toContain('id="quotation-production-deadline"');
    expect(source).toContain('id="quotation-discount-value"');
    expect(source).toContain('htmlFor="quotation-manual-total"');
  });

  it("anuncia o total e o processamento das ações comerciais", () => {
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('aria-busy={createMutation.isPending || updateMutation.isPending}');
  });

  it("nomeia a busca de produto e a visualização ampliada de arte", () => {
    expect(source).toContain('id="quotation-product-search"');
    expect(source).toContain('aria-label="Prévia ampliada da arte"');
    expect(source).toContain('aria-label="Fechar prévia da arte"');
  });
});
