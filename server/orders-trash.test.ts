import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerPath = resolve(process.cwd(), "server/ordersTrashRouter.ts");
const pagePath = resolve(process.cwd(), "client/src/pages/admin/AdminOrders.tsx");
const schemaPath = resolve(process.cwd(), "drizzle/schema.ts");

describe("lixeira de Todos os Pedidos", () => {
  it("restaura a lixeira reversível para administradores e mantém a exclusão definitiva restrita", () => {
    const source = readFileSync(routerPath, "utf8");
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain('mysqlTable("deletedOrders"');
    expect(source).toContain("function requireAdmin(ctx: any)");
    expect(source).toContain("function requireSuperadmin(ctx: any)");
    expect(source).toContain('adminUser.role !== "superadmin"');
    expect(source).toContain("moveToTrash: adminOrManusAuthProcedure");
    expect(source).toContain("restore: adminOrManusAuthProcedure");
    expect(source).toContain("permanentlyDelete: adminOrManusAuthProcedure");
    expect(source).toContain('action: "move_order_to_trash"');
    expect(source).toContain('action: "restore_order_from_trash"');
    expect(source).toContain('action: "permanently_delete_order_from_trash"');
  });

  it("reexibe a lixeira para administradores, com exclusão definitiva apenas para Superadmin", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("Lixeira de Todos os Pedidos");
    expect(source).toContain("const canManageTrash = Boolean(adminUser);");
    expect(source).toContain('const canPermanentlyDelete = adminUser?.role === "superadmin";');
    expect(source).toContain("Motivo da exclusão");
    expect(source).toContain("Confirmar restauração");
    expect(source).toContain("Excluir pedido permanentemente?");
    expect(source).toContain("ordersTrash.moveToTrash.useMutation");
    expect(source).toContain("ordersTrash.permanentlyDelete.useMutation");
  });
});
