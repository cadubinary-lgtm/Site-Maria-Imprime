import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const quotationDetailPath = resolve(process.cwd(), "client/src/pages/admin/AdminQuotationDetail.tsx");
const source = readFileSync(quotationDetailPath, "utf8");

describe("cabeçalho comercial da proposta", () => {
  it("destaca a proposta e informa o responsável na tela", () => {
    expect(source).toContain('text-[clamp(1.2rem,1.8vw,1.55rem)]');
    expect(source).toContain('q.sellerId ? "Vendedor responsável" : "Administrador responsável"');
    expect(source).toContain('q.responsibleName?.trim() || adminUser?.name?.trim() || "Administração"');
  });

  it("mantém a identificação do responsável também no PDF", () => {
    expect(source).toContain('class="responsible"');
    expect(source).toContain('q.sellerId ? "Vendedor responsável" : "Administrador responsável"');
    expect(source).toContain('escapeHtml(responsibleName)');
  });
});
