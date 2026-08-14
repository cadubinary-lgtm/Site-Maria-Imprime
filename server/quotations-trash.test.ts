import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerPath = resolve(process.cwd(), "server/quotationsRouter.ts");
const pagePath = resolve(process.cwd(), "client/src/pages/admin/AdminQuotations.tsx");

describe("lixeira e dashboard de orçamentos", () => {
  it("protege as operações da lixeira para Superadmin", () => {
    const source = readFileSync(routerPath, "utf8");
    expect(source).toContain("listTrash: adminAnyProcedure");
    expect(source).toContain("moveToTrash: adminAnyProcedure");
    expect(source).toContain("restoreFromTrash: adminAnyProcedure");
    expect(source).toContain("permanentlyDeleteFromTrash: adminAnyProcedure");
    expect(source).toContain('adminUser?.role !== "superadmin"');
    expect(source).toContain("deletedQuotations");
  });

  it("exibe indicadores corrigidos e ações de lixeira na lista", () => {
    const source = readFileSync(pagePath, "utf8");
    expect(source).toContain("Lixeira de Orçamentos");
    expect(source).toContain("Motivo da exclusão");
    expect(source).toContain("Confirmar restauração");
    expect(source).toContain("Excluir orçamento permanentemente?");
    expect(source).toContain("kpis.convertidos");
    expect(source).toContain("Distribuição do funil de orçamentos");
    expect(source).toContain("kpis.ativos");
    expect(source).toContain("kpis.pendentes");
  });
});
