import { describe, expect, it } from "vitest";
import { paginateProductionDashboardItems } from "../client/src/lib/production-dashboard-pagination";

describe("paginação do dashboard de produção", () => {
  it("retorna somente os itens da página solicitada", () => {
    const page = paginateProductionDashboardItems([1, 2, 3, 4, 5], 2, 2);
    expect(page.items).toEqual([3, 4]);
    expect(page.totalPages).toBe(3);
  });

  it("corrige páginas fora do intervalo", () => {
    const page = paginateProductionDashboardItems([1, 2, 3], 8, 2);
    expect(page.currentPage).toBe(2);
    expect(page.items).toEqual([3]);
  });
});
