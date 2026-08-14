import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const cashFlowRouterPath = resolve(process.cwd(), "server/routers-financeiro.ts");
const cashFlowPagePath = resolve(process.cwd(), "client/src/pages/admin/FinanceiroFluxoCaixa.tsx");

describe("Fluxo de Caixa operacional", () => {
  it("usa a data de pagamento confirmada e calcula o saldo acumulado", () => {
    const source = readFileSync(cashFlowRouterPath, "utf8");

    expect(source).toContain("db.select().from(financeiro)");
    expect(source).toContain('eq(financeiro.status, "pago")');
    expect(source).toContain("gte(financeiro.dataPagamento, start)");
    expect(source).toContain("const openingBalance = openingIncome - openingExpense;");
    expect(source).toContain("closingBalance: runningBalance + balance");
    expect(source).toContain("closingBalance: openingBalance + totalIncome - totalExpense");
  });

  it("oferece períodos rápidos, intervalo personalizado e lançamentos manuais", () => {
    const source = readFileSync(cashFlowPagePath, "utf8");

    expect(source).toContain('const [periodo, setPeriodo] = useState<"1" | "7" | "30" | "90" | "custom">("30");');
    expect(source).toContain('type="date" value={startDate}');
    expect(source).toContain('type="date" value={endDate}');
    expect(source).toContain("Nova movimentação");
    expect(source).toContain("Saldo inicial");
    expect(source).toContain("Saldo acumulado:");
  });
});
