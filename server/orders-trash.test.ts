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

  it("reexibe no painel a lixeira reversível e preserva a exclusão definitiva protegida", () => {
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

  it("remove dependências de produção com segurança quando o armazenamento legado não está disponível", () => {
    const source = readFileSync(routerPath, "utf8");
    const cleanupStart = source.indexOf("async function deleteProductionDependenciesForOrder");
    const cleanupEnd = source.indexOf("async function permanentlyDeleteOrder", cleanupStart);
    const cleanupSource = source.slice(cleanupStart, cleanupEnd);

    expect(source).toContain("function isUnavailableProductionStorage(error: unknown)");
    expect(source).toContain('candidate?.code === "ER_NO_SUCH_TABLE"');
    expect(cleanupSource).toContain("productionStatusHistory");
    expect(cleanupSource).toContain("inArray(productionStatusHistory.productionJobId, productionJobIds)");
    expect(cleanupSource.indexOf("db.delete(productionStatusHistory)")).toBeLessThan(cleanupSource.indexOf("db.delete(productionJobs)"));
    expect(source).toContain("await deleteProductionDependenciesForOrder(db, orderId);");
  });

  it("remove os registros que alimentam todos os subitens financeiros antes do pedido", () => {
    const source = readFileSync(routerPath, "utf8");
    const helperStart = source.indexOf("async function deleteFinancialDependenciesForOrder");
    const helperEnd = source.indexOf("async function permanentlyDeleteOrder", helperStart);
    const helperSource = source.slice(helperStart, helperEnd);

    expect(helperSource).toContain("financeiroNotificacoes");
    expect(helperSource).toContain("cashFlowEntries");
    expect(helperSource).toContain("paymentReceipts");
    expect(helperSource).toContain("deletedReceivedAccounts");
    expect(helperSource.indexOf("db.delete(financeiroNotificacoes)")).toBeLessThan(helperSource.indexOf("db.delete(financeiro)"));
    expect(source).toContain("await deleteFinancialDependenciesForOrder(db, orderId);");
    expect(source.indexOf("await deleteFinancialDependenciesForOrder(db, orderId);")).toBeLessThan(source.indexOf("await db.delete(orders).where(eq(orders.id, orderId));"));
  });
});
