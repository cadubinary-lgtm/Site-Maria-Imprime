import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "server/routers-financeiro.ts"), "utf8");

describe("paginação do Financeiro", () => {
  it("pagina contas a receber diretamente no banco", () => {
    expect(source).toContain("getContasReceber: adminOrManusAuthProcedure");
    expect(source).toContain(".limit(input.limit)");
    expect(source).toContain(".offset(offset)");
    expect(source).toContain("select({ total: sql<number>`count(*)` })");
  });

  it("calcula o resumo de contas recebidas no banco", () => {
    expect(source).toContain("getContasRecebidas: adminOrManusAuthProcedure");
    expect(source).toContain("coalesce(sum(${orders.totalPrice}), 0)");
  });
});
