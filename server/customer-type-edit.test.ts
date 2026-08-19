import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("edição de tipo de cliente", () => {
  const siteEditor = readFileSync("client/src/pages/admin/AdminCustomers.tsx", "utf8");
  const balcaoEditor = readFileSync("client/src/pages/admin/ClientesBalcao.tsx", "utf8");
  const siteRouter = readFileSync("server/routers/customerAuth.ts", "utf8");
  const crmRouter = readFileSync("server/routers-crm.ts", "utf8");

  it("mostra o tipo ao lado da tabela de preços na edição de clientes do site", () => {
    expect(siteEditor).toContain('accountType: "customer" as "customer" | "reseller" | "agency"');
    expect(siteEditor).toContain('<span>Tipo de cliente</span><Select value={form.accountType}');
    expect(siteEditor).toContain('<span>Tabela de Preços</span><Select value={form.priceTier}');
    expect(siteEditor).toContain('<SelectItem value="customer">Cliente site</SelectItem>');
  });

  it("persiste o tipo da conta do site no procedimento administrativo", () => {
    const section = siteRouter.slice(siteRouter.indexOf("adminUpdateCustomer: publicProcedure"));
    expect(section).toContain('accountType: z.enum(["customer", "reseller", "agency"])');
    expect(section).toContain("accountType: input.accountType,");
  });

  it("mostra e salva o tipo do cliente de balcão ao lado da tabela de preços", () => {
    expect(balcaoEditor).toContain('clientType: "balcao" as "balcao" | "revendedor" | "agencia" | "corporativo"');
    expect(balcaoEditor).toContain('<span>Tipo de cliente</span><Select value={form.clientType}');
    expect(balcaoEditor).toContain('clientType: client.clientType === "revendedor"');
    const section = crmRouter.slice(crmRouter.indexOf("adminUpdateBalcaoClient:"));
    expect(section).toContain('clientType: z.enum(["balcao", "revendedor", "agencia", "corporativo"])');
    expect(section).toContain("clientType: input.clientType,");
  });
});
