import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("sessão administrativa no CRM", () => {
  it("permite que o painel oficial carregue o dashboard usando admin_session ou Manus OAuth", () => {
    const router = readFileSync("server/routers-crm.ts", "utf8");
    expect(router).toContain('import { adminOrManusAuthProcedure } from "./routers-admin-auth";');
    expect(router).toContain("getOperationalDashboard: adminOrManusAuthProcedure");
    expect(router).toContain("getTopCustomersLastTwoMonths: adminOrManusAuthProcedure");
  });
});
