import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const formSource = readFileSync(resolve(process.cwd(), "client/src/pages/admin/AdminQuotationForm.tsx"), "utf8");
const routerSource = readFileSync(resolve(process.cwd(), "server/quotationsRouter.ts"), "utf8");

describe("total manual de orçamento", () => {
  it("permite editar o total diretamente no resumo superior", () => {
    expect(formSource).toContain('aria-label="Total do orçamento"');
    expect(formSource).toContain("setAcertoTotal(event.target.value)");
    expect(formSource).toContain("const hasManualTotal = acertoTotal.trim() !== \"\";");
    expect(formSource).toContain("const [isEditingManualTotal, setIsEditingManualTotal] = useState(false);");
    expect(formSource).toContain("value={hasManualTotal || isEditingManualTotal ? acertoTotal : formatManualTotal(calculatedTotal)}");
    expect(formSource).toContain('if (!hasManualTotal) setAcertoTotal("");');
  });

  it("substitui o total calculado pelo Acerto Total informado em formato brasileiro", () => {
    expect(formSource).toContain('aria-label="Acerto Total"');
    expect(formSource).toContain("function parseManualTotal(value: string)");
    expect(formSource).toContain("const total = hasManualTotal ? acertoValue : calculatedTotal;");
    expect(formSource).toContain("formatManualTotal(parseManualTotal(acertoTotal))");
  });

  it("restaura o cálculo e explica o ajuste ao limpar o Acerto Total", () => {
    expect(formSource).toContain("const clearManualTotal = () => {");
    expect(formSource).toContain('aria-label="Limpar Acerto Total"');
    expect(formSource).toContain('onClick={clearManualTotal}>Limpar</button>');
    expect(formSource).toContain('aria-label="Como funciona o Acerto Total"');
    expect(formSource).toContain("Substitui o valor final calculado do orçamento.");
    expect(formSource).toContain("onClick={clearManualTotal}");
  });

  it("envia e persiste o total manual na criação e atualização", () => {
    expect(formSource).toContain("manualTotal: hasManualTotal ? acertoValue : null");
    expect(routerSource).toContain("manualTotal: z.number().min(0).nullable().optional()");
    expect(routerSource).toContain("manualTotal: input.manualTotal?.toFixed(2) ?? null");
    expect(routerSource).toContain("const total = input.manualTotal ?? calculatedTotal;");
  });
});
