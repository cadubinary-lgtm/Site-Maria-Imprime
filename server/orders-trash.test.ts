import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerPath = resolve(process.cwd(), "server/ordersTrashRouter.ts");
const pagePath = resolve(process.cwd(), "client/src/pages/admin/AdminOrders.tsx");
const schemaPath = resolve(process.cwd(), "drizzle/schema.ts");

describe("lixeira de Todos os Pedidos", () => {
  it("mantém operações de mover, restaurar e excluir permanentemente restritas a Superadmin", () => {
    const source = readFileSync(routerPath, "utf8");
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain('mysqlTable("deletedOrders"');
    expect(source).toContain('adminUser?.role !== "superadmin"');
    expect(source).toContain("moveToTrash: adminOrManusAuthProcedure");
    expect(source).toContain("restore: adminOrManusAuthProcedure");
    expect(source).toContain("permanentlyDelete: adminOrManusAuthProcedure");
    expect(source).toContain('action: "move_order_to_trash"');
    expect(source).toContain('action: "restore_order_from_trash"');
    expect(source).toContain('action: "permanently_delete_order_from_trash"');
  });

  it("expõe no painel o motivo, a restauração e a confirmação de exclusão definitiva", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("Lixeira de Todos os Pedidos");
    expect(source).toContain("Motivo da exclusão");
    expect(source).toContain("Confirmar restauração");
    expect(source).toContain("Excluir pedido permanentemente?");
    expect(source).toContain("ordersTrash.moveToTrash.useMutation");
    expect(source).toContain("ordersTrash.permanentlyDelete.useMutation");
  });
});
