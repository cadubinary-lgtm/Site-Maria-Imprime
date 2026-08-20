import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerPath = resolve(process.cwd(), "server/quotationsRouter.ts");
const pagePath = resolve(process.cwd(), "client/src/pages/admin/AdminQuotations.tsx");

describe("lixeira e dashboard de orçamentos", () => {
  it("restaura a lixeira reversível para administradores e preserva a exclusão definitiva protegida", () => {
    const source = readFileSync(routerPath, "utf8");
    expect(source).toContain("listTrash: adminAnyProcedure");
    expect(source).toContain("moveToTrash: adminAnyProcedure");
    expect(source).toContain("restoreFromTrash: adminAnyProcedure");
    expect(source).toContain("permanentlyDeleteFromTrash: adminAnyProcedure");
    expect(source).toContain("function requireQuotationAdmin(ctx: any)");
    expect(source).toContain("const adminUser = requireQuotationAdmin(ctx);");
    expect(source).toContain('adminUser?.role !== "superadmin"');
    expect(source).toContain("deletedQuotations");
  });

  it("reexibe as ações de lixeira na lista", () => {
    const source = readFileSync(pagePath, "utf8");
    expect(source).toContain("Lixeira de Orçamentos");
    expect(source).toContain("const canManageTrash = Boolean(adminUser);");
    expect(source).toContain('const canPermanentlyDelete = adminUser?.role === "superadmin";');
    expect(source).toContain("Motivo da exclusão");
    expect(source).toContain("Confirmar restauração");
    expect(source).toContain("Excluir orçamento permanentemente?");
  });
});
