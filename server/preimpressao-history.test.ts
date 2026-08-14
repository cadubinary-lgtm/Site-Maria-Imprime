import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerPath = resolve(process.cwd(), "server/preImpressaoHistoryRouter.ts");
const pagePath = resolve(process.cwd(), "client/src/pages/admin/AdminPreImpressao.tsx");

describe("Histórico da Pré-Impressão", () => {
  it("consulta registros paginados no servidor e restringe a exclusão permanente ao Superadmin", () => {
    const source = readFileSync(routerPath, "utf8");

    expect(source).toContain("getHistory: adminOrManusAuthProcedure");
    expect(source).toContain("limit: z.number().int().min(1).max(50).default(20)");
    expect(source).toContain(".offset((input.page - 1) * input.limit)");
    expect(source).toContain("deleteHistoryRecord: adminOrManusAuthProcedure");
    expect(source).toContain('adminUser?.role !== "superadmin"');
    expect(source).toContain('action: "permanently_delete_prepress_history_record"');
  });

  it("exibe página limitada, paginação e confirmação antes de excluir um registro", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain("preImpressaoHistory.getHistory.useQuery({ page: historyPage, limit: 20 })");
    expect(source).toContain("São exibidos 20 registros por página.");
    expect(source).toContain("setHistoryPage((page) => page - 1)");
    expect(source).toContain("setHistoryPage((page) => page + 1)");
    expect(source).toContain("deleteHistoryRecord.useMutation");
    expect(source).toContain("Excluir este registro histórico permanentemente?");
    expect(source).toContain("Excluir permanentemente");
  });
});
