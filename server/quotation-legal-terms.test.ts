import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const detailSource = readFileSync(resolve(process.cwd(), "client/src/pages/admin/AdminQuotationDetail.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/quotationsRouter.ts"), "utf8");
const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");

describe("condições fixas editáveis do orçamento", () => {
  it("mantém um texto padrão quando ainda não há texto salvo", () => {
    expect(detailSource).toContain("DEFAULT_QUOTATION_LEGAL_TERMS");
    expect(detailSource).toContain("return legalTerms?.trim() || DEFAULT_QUOTATION_LEGAL_TERMS;");
  });

  it("persiste as condições em campo próprio sem reaproveitar observações comerciais", () => {
    expect(schemaSource).toContain('legalTerms: longtext("legalTerms")');
    expect(routerSource).toContain("legalTerms: quotations.legalTerms,");
    expect(routerSource).toContain("legalTerms: z.string().trim().min(1).max(12000).optional(),");
    expect(routerSource).toContain("updates.legalTerms = input.legalTerms;");
  });

  it("exige confirmação para salvar e restaura o último texto ao não salvar", () => {
    expect(detailSource).toContain("Salvar alterações das condições?");
    expect(detailSource).toContain("Não salvar");
    expect(detailSource).toContain("setLegalTermsDraft(currentLegalTerms); setIsEditingLegalTerms(false);");
    expect(detailSource).toContain("updateLegalTerms.mutate({ id: q.id, legalTerms: legalTermsDraft.trim() })");
    expect(detailSource).toContain('toast.success("Condições do orçamento salvas.", {');
    expect(detailSource).toContain('position: "top-right",');
    expect(detailSource).toContain('id: `quotation-legal-terms-${quotationId}`,');
  });

  it("usa o conteúdo salvo também no HTML de impressão", () => {
    expect(detailSource).toContain("const legalTermsHtml = formatLegalTermsForPrint(resolveQuotationLegalTerms(q.legalTerms));");
    expect(detailSource).toContain("${legalTermsHtml}");
    expect(detailSource).toContain('id="quotation-legal-terms"');
  });
});
