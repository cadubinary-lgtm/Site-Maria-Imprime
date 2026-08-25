import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const screen = read("client/src/pages/admin/FinanceiroContasReceber.tsx");
const router = read("server/routers-financeiro.ts");

describe("filtro de período em Contas a Receber", () => {
  it("envia as datas inicial e final inclusivas para a consulta financeira", () => {
    expect(screen).toContain('const [startDate, setStartDate] = useState("");');
    expect(screen).toContain('const [endDate, setEndDate] = useState("");');
    expect(screen).toContain('startDate: startDate ? new Date(`${startDate}T00:00:00`).getTime() : undefined');
    expect(screen).toContain('endDate: endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : undefined');
    expect(screen).toContain("trpc.financeiro.getContasReceber.useQuery(queryInput)");
  });

  it("exibe os campos de data e preserva a filtragem no servidor", () => {
    expect(screen).toContain('id="receivable-start-date"');
    expect(screen).toContain('id="receivable-end-date"');
    expect(screen).toContain("Data inicial");
    expect(screen).toContain("Data final");
    expect(router).toContain("if (input.startDate) conditions.push(gte(orders.createdAt, new Date(input.startDate)))");
    expect(router).toContain("if (input.endDate) conditions.push(lte(orders.createdAt, new Date(input.endDate)))");
  });

  it("permite limpar busca, período e forma de pagamento sem alterar ações financeiras", () => {
    expect(screen).toContain("const clearFilters = () => {");
    expect(screen).toContain('setFormaPagamento("");');
    expect(screen).toContain('setStartDate("");');
    expect(screen).toContain('setEndDate("");');
    expect(screen).toContain("Limpar filtros");
  });
});
