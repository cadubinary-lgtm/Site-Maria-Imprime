import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerPath = resolve(process.cwd(), "server/quotationsRouter.ts");
const pagePath = resolve(process.cwd(), "client/src/pages/admin/AdminQuotations.tsx");

describe("restauração de orçamento cancelado", () => {
  it("recupera o último status armazenado antes do cancelamento", () => {
    const source = readFileSync(routerPath, "utf8");

    expect(source).toContain("restoreStatusBeforeCancellation: adminAnyProcedure");
    expect(source).toContain('eq(quotationHistory.newStatus, "cancelado")');
    expect(source).toContain("status: cancellation.previousStatus");
    expect(source).toContain("canceledAt: null");
    expect(source).toContain("Cancelamento desfeito: status anterior restaurado.");
  });

  it("disponibiliza a restauração apenas quando o orçamento está cancelado", () => {
    const source = readFileSync(pagePath, "utf8");

    expect(source).toContain('row.status === "cancelado"');
    expect(source).toContain("Restaurar status anterior");
    expect(source).toContain("restoreStatusBeforeCancellation.useMutation");
  });
});
