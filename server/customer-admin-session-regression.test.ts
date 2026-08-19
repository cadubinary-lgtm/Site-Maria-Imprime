import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("regressão de sessão administrativa nos cadastros de clientes", () => {
  const customerRouter = readFileSync("server/routers/customerAuth.ts", "utf8");
  const crmRouter = readFileSync("server/routers-crm.ts", "utf8");

  it("permite a listagem de clientes do site pela sessão administrativa oficial ou pelo OAuth Manus", () => {
    expect(customerRouter).toContain('ctx.user?.role === "admin" || ctx.user?.role === "superadmin"');
    expect(customerRouter).toContain("adminListCustomers: publicProcedure");
    expect(customerRouter).toContain(".query(async ({ input, ctx }) => {\n      await requireCustomerAdmin(ctx);");
  });

  it("protege ações de clientes do site pelo verificador de sessão unificado", () => {
    for (const procedure of [
      "adminUpdateCustomerStatus",
      "adminUpdateCustomerPriceTier",
      "adminDeleteCustomer",
      "adminToggleStorePickup",
      "adminGetCustomerDetail",
      "adminSetCustomerPassword",
    ]) {
      const section = customerRouter.slice(customerRouter.indexOf(procedure));
      expect(section).toContain("await requireCustomerAdmin(ctx);");
    }
  });

  it("aceita a sessão administrativa oficial nas operações e na listagem de balcão", () => {
    for (const procedure of [
      "createClient",
      "adminListBalcaoClients",
      "adminGetBalcaoClientDetail",
      "adminUpdateBalcaoClient",
      "adminDeleteBalcaoClient",
      "adminToggleBalcaoPickup",
    ]) {
      const section = crmRouter.slice(crmRouter.indexOf(procedure));
      expect(section).toContain("adminOrManusAuthProcedure");
    }
  });
});
