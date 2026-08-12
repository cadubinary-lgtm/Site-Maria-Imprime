import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "server/routers-financeiro.ts"), "utf8");

describe("autorização do módulo financeiro", () => {
  it("aceita a sessão administrativa própria usada pelo site oficial", () => {
    expect(source).toContain('import { adminOrManusAuthProcedure } from "./routers-admin-auth";');
    expect(source).not.toMatch(/:\s*adminProcedure/);
    expect(source).toContain("getContasReceber: adminOrManusAuthProcedure");
    expect(source).toContain("getContasRecebidas: adminOrManusAuthProcedure");
    expect(source).toContain("getPagamentosRetirada: adminOrManusAuthProcedure");
    expect(source).toContain("getFluxoCaixa: adminOrManusAuthProcedure");
    expect(source).toContain("getRelatorio: adminOrManusAuthProcedure");
  });
});
