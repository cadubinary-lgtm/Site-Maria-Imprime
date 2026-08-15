import { describe, expect, it } from "vitest";
import { getProductionDashboardDateRange, isDateInProductionDashboardRange } from "../client/src/lib/production-dashboard-period";

describe("períodos do dashboard de produção", () => {
  it("calcula os limites do mês atual", () => {
    const range = getProductionDashboardDateRange("this_month", new Date("2026-08-15T12:00:00"));
    expect(range.from?.toISOString().slice(0, 10)).toBe("2026-08-01");
    expect(range.to?.toISOString().slice(0, 10)).toBe("2026-08-31");
  });

  it("inclui o último dia de um intervalo personalizado", () => {
    const range = getProductionDashboardDateRange("custom", new Date(), "2026-08-10", "2026-08-12");
    expect(isDateInProductionDashboardRange("2026-08-12T18:00:00", range)).toBe(true);
    expect(isDateInProductionDashboardRange("2026-08-13T00:00:00", range)).toBe(false);
  });
});
