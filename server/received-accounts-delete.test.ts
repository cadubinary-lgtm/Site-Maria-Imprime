import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const financeiroRouterPath = resolve(process.cwd(), "server/routers-financeiro.ts");
const receivedAccountsPagePath = resolve(process.cwd(), "client/src/pages/admin/FinanceiroContasRecebidas.tsx");

describe("exclusão de Contas Recebidas", () => {
  it("restringe a mutação de exclusão ao perfil Superadmin no servidor", () => {
    const source = readFileSync(financeiroRouterPath, "utf8");

    expect(source).toContain("deleteContaRecebida: adminOrManusAuthProcedure");
    expect(source).toContain('adminUser?.role !== "superadmin"');
    expect(source).toContain('code: "FORBIDDEN"');
    expect(source).toContain('action: "delete_received_account"');
  });

  it("exibe a lixeira somente para Superadmin e exige confirmação", () => {
    const source = readFileSync(receivedAccountsPagePath, "utf8");

    expect(source).toContain('const canDeleteReceivedAccounts = adminUser?.role === "superadmin";');
    expect(source).toContain("{canDeleteReceivedAccounts && <th");
    expect(source).toContain("<Trash2");
    expect(source).toContain("<AlertDialog open={Boolean(receiptToDelete)}");
    expect(source).toContain("Excluir permanentemente");
  });
});
