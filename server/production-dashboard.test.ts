import { describe, expect, it } from "vitest";
import { getProductionDashboardOverview, getProductionDashboardSummary, isProductionPriority } from "../client/src/lib/production-dashboard";

describe("dashboard de linha de produção", () => {
  it("agrupa pedidos nas filas operacionais corretas", () => {
    const summary = getProductionDashboardSummary([
      { status: "analisando" },
      { status: "em_producao" },
      { status: "pronto_retirada" },
      { status: "pagamento_aprovado" },
    ]);

    expect(summary.map((lane) => lane.count)).toEqual([1, 1, 1, 1]);
  });

  it("prioriza análise, problemas e produção em andamento", () => {
    expect(isProductionPriority("analisando")).toBe(true);
    expect(isProductionPriority("em_producao")).toBe(true);
    expect(isProductionPriority("pronto_entrega")).toBe(false);
  });

  it("resume o status geral das filas de produção", () => {
    expect(getProductionDashboardOverview([
      { status: "analisando" },
      { status: "em_producao" },
      { status: "pronto_entrega" },
      { status: "com_problemas" },
      { status: "pagamento_aprovado" },
    ])).toEqual({ total: 5, inOperation: 3, ready: 1, needsAttention: 2 });
  });
});
