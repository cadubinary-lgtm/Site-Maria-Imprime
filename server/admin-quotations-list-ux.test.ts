import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminQuotations.tsx"), "utf8");

describe("listagem administrativa de orçamentos", () => {
  it("expõe filtros de período e status com identificadores e estados claros", () => {
    expect(source).toContain('aria-pressed={period === item.value}');
    expect(source).toContain('id="quotation-period-start"');
    expect(source).toContain('htmlFor="admin-quotations-search"');
    expect(source).toContain('id="admin-quotations-status"');
  });

  it("anuncia os indicadores e estrutura a tabela de orçamentos", () => {
    expect(source).toContain('aria-label="Indicadores operacionais de orçamentos"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('scope="col"');
    expect(source).toContain('role="status"');
  });

  it("nomeia as ações operacionais de cada orçamento", () => {
    expect(source).toContain('aria-label={`Visualizar orçamento ${row.quotationNumber}`}');
    expect(source).toContain('aria-label={`Editar orçamento ${row.quotationNumber}`}');
    expect(source).toContain('aria-label={`Mais ações para o orçamento ${row.quotationNumber}`}');
    expect(source).toContain('aria-busy={convertToOrder.isPending}');
  });
});
