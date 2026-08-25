import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("espaçamento do resumo de valores do orçamento", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/admin/AdminQuotationDetail.tsx"), "utf8");
  const summaryStart = source.indexOf('<section className="bg-white rounded-lg border border-gray-200 p-3">', source.indexOf("Produtos / Serviços"));
  const summaryEnd = source.indexOf('<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">', summaryStart);
  const summary = source.slice(summaryStart, summaryEnd);

  it("aplica as margens finais no contêiner do resumo, sem repetir estilos nos valores", () => {
    expect(summary).toContain('className="ml-[9px] mr-[10px] space-y-1 text-sm"');
    expect(summary).not.toContain("marginLeft");
    expect(summary).not.toContain("marginRight");
  });

  it("preserva subtotal, frete, desconto condicional e total no resumo", () => {
    expect(summary).toContain("Subtotal");
    expect(summary).toContain("Frete / Entrega");
    expect(summary).toContain("Desconto");
    expect(summary).toContain(">TOTAL<");
  });
});
