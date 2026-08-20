import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const financeiroRouterPath = resolve(process.cwd(), "server/routers-financeiro.ts");
const receivedAccountsPagePath = resolve(process.cwd(), "client/src/pages/admin/FinanceiroContasRecebidas.tsx");
const receivableAccountsPagePath = resolve(process.cwd(), "client/src/pages/admin/FinanceiroContasReceber.tsx");

describe("lixeira de Contas Recebidas", () => {
  it("permite a lixeira reversível para administradores e preserva a exclusão definitiva protegida", () => {
    const source = readFileSync(financeiroRouterPath, "utf8");

    expect(source).toContain("moveContaRecebidaToTrash: adminOrManusAuthProcedure");
    expect(source).toContain("restoreContaRecebida: adminOrManusAuthProcedure");
    expect(source).toContain("listDeletedContasRecebidas: adminOrManusAuthProcedure");
    expect(source).toContain("emptyDeletedContasRecebidas: adminOrManusAuthProcedure");
    expect(source).toContain("permanentlyDeleteContaRecebida: adminOrManusAuthProcedure");
    expect(source).toContain("confirmation: z.literal(true)");
    expect(source).toContain("function requireFinanceAdmin(ctx: any)");
    expect(source).toContain("const adminUser = requireFinanceAdmin(ctx);");
    expect(source).toContain('adminUser?.role !== "superadmin"');
    expect(source).toContain('code: "FORBIDDEN"');
    expect(source).toContain('action: "move_receivable_account_to_trash"');
    expect(source).toContain('action: "restore_received_account"');
    expect(source).toContain('action: "permanently_delete_received_account_from_trash"');
    expect(source).toContain("deletedByAdminId: deletedReceivedAccounts.deletedByAdminId");
    expect(source).toContain('reason: z.string().trim().min(3, "Informe um motivo com pelo menos 3 caracteres.").max(1000)');
    expect(source).toContain("deletionReason: input.reason");
    expect(source).toContain("deletionReason: deletedReceivedAccounts.deletionReason");
  });

  it("exibe busca, filtros de data, lixeira e restauração para administradores", () => {
    const source = readFileSync(receivedAccountsPagePath, "utf8");

    expect(source).toContain("const canManageReceivedAccountsTrash = Boolean(adminUser);");
    expect(source).toContain('const canPermanentlyDeleteReceivedAccounts = adminUser?.role === "superadmin";');
    expect(source).toContain("{canManageReceivedAccountsTrash && (");
    expect(source).toContain("{canPermanentlyDeleteReceivedAccounts && <Button");
    expect(source).toContain("<Trash2");
    expect(source).toContain("Buscar por pedido, cliente ou e-mail...");
    expect(source).toContain('type="date"');
    expect(source).toContain("moveContaRecebidaToTrash.useMutation");
    expect(source).toContain("restoreContaRecebida.useMutation");
    expect(source).toContain("Lixeira de Contas Recebidas");
    expect(source).toContain("Restaurar");
    expect(source).toContain("<AlertDialog open={Boolean(receiptToDelete)}");
    expect(source).toContain("<AlertDialog open={Boolean(receiptToRestore)}");
    expect(source).toContain("Restaurar esta conta recebida?");
    expect(source).toContain("Confirmar restauração");
    expect(source).toContain("onClick={() => setReceiptToRestore(item)}");
    expect(source).toContain("emptyDeletedContasRecebidas.useMutation");
    expect(source).toContain("Esvaziar a lixeira permanentemente?");
    expect(source).toContain("Esvaziar Lixeira");
    expect(source).toContain("Esvaziar permanentemente");
    expect(source).toContain("permanentlyDeleteContaRecebida.useMutation");
    expect(source).toContain("Excluir este item permanentemente?");
    expect(source).toContain("Data e hora da exclusão");
    expect(source).toContain("Usuário que excluiu");
    expect(source).toContain("ID do usuário:");
    expect(source).toContain("formatDateTime(item.deletedAt)");
    expect(source).toContain("Motivo da exclusão");
    expect(source).toContain("O motivo é obrigatório e ficará registrado na lixeira e na auditoria.");
    expect(source).toContain("deletionReason.trim().length < 3");
    expect(source).toContain("item.deletionReason || \"Motivo não informado\"");
    expect(source).toContain("Mover para lixeira");
  });

  it("reexibe a lixeira reversível de Contas a Receber para administradores", () => {
    const routerSource = readFileSync(financeiroRouterPath, "utf8");
    const pageSource = readFileSync(receivableAccountsPagePath, "utf8");

    expect(routerSource).toContain("const deletedRows = await db.select({ orderId: deletedReceivedAccounts.orderId }).from(deletedReceivedAccounts);");
    expect(routerSource).toContain("moveContaRecebidaToTrash: adminOrManusAuthProcedure");
    expect(pageSource).toContain("const canManageReceivableTrash = Boolean(adminUser);");
    expect(pageSource).toContain('const canPermanentlyDeleteReceivable = adminUser?.role === "superadmin";');
    expect(pageSource).toContain("{canManageReceivableTrash && <Button");
    expect(pageSource).toContain("moveContaRecebidaToTrash.useMutation");
    expect(pageSource).toContain("Motivo da exclusão");
    expect(pageSource).toContain("deletionReason.trim().length < 3");
    expect(pageSource).toContain("Mover conta a receber para a lixeira");
    expect(pageSource).toContain('const [showTrash, setShowTrash] = useState(false);');
    expect(pageSource).toContain("Lixeira de Contas a Receber");
    expect(pageSource).toContain("listDeletedContasRecebidas.useQuery");
    expect(pageSource).toContain("Restaurar esta conta a receber?");
    expect(pageSource).toContain("Confirmar restauração");
    expect(pageSource).toContain("permanentlyDeleteContaRecebida.useMutation");
    expect(pageSource).toContain("Excluir este item permanentemente?");
    expect(pageSource).toContain("Excluir permanentemente");
  });

  it("remove o histórico de produção antes da ficha vinculada ao pedido", () => {
    const routerSource = readFileSync(financeiroRouterPath, "utf8");
    const helperStart = routerSource.indexOf("async function deleteProductionDependenciesForOrder");
    const helperEnd = routerSource.indexOf("// ─── Router", helperStart);
    const helperSource = routerSource.slice(helperStart, helperEnd);

    expect(helperSource).toContain("productionStatusHistory");
    expect(helperSource).toContain("inArray(productionStatusHistory.productionJobId, productionJobIds)");
    expect(helperSource.indexOf("db.delete(productionStatusHistory)")).toBeLessThan(helperSource.indexOf("db.delete(productionJobs)"));
    expect(routerSource.match(/await deleteProductionDependenciesForOrder\(db,/g)?.length).toBe(2);
  });
});
