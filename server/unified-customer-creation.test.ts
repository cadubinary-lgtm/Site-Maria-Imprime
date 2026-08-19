import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminCustomers = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminCustomers.tsx"), "utf8");
const crmRouter = readFileSync(resolve(import.meta.dirname, "../server/routers-crm.ts"), "utf8");
const customerRouter = readFileSync(resolve(import.meta.dirname, "../server/routers/customerAuth.ts"), "utf8");
const dashboard = readFileSync(resolve(import.meta.dirname, "../server/crm-dashboard.ts"), "utf8");
const clientsManager = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ClientsManager.tsx"), "utf8");

describe("cadastro unificado de clientes", () => {
  it("permite escolher site, balcão, revendedor ou agência antes de criar", () => {
    expect(adminCustomers).toContain('useState<"site" | "balcao" | "revendedor" | "agencia">');
    expect(adminCustomers).toContain('<SelectItem value="site">Cliente site</SelectItem>');
    expect(adminCustomers).toContain('<SelectItem value="balcao">Cliente balcão</SelectItem>');
    expect(adminCustomers).toContain('<SelectItem value="revendedor">Revendedor</SelectItem>');
    expect(adminCustomers).toContain('<SelectItem value="agencia">Agência</SelectItem>');
  });

  it("persiste balcão no CRM e os demais tipos no sistema de contas", () => {
    expect(adminCustomers).toContain("const createBalcao = trpc.crm.createClient.useMutation");
    expect(adminCustomers).toContain('clientType: "balcao"');
    expect(adminCustomers).toContain("accountType: accountTypeForCreation");
    expect(crmRouter).toContain("createClient: adminOrManusAuthProcedure");
    expect(crmRouter).toContain('addressState: z.string().max(2).optional()');
    expect(customerRouter).toContain('Este CPF/CNPJ já está cadastrado em outro cliente.');
  });

  it("inclui os quatro tipos nos indicadores consolidados do dashboard", () => {
    expect(dashboard).toContain('clientsByType: { site: 0, balcao: 0, revendedor: 0, agencia: 0 }');
    expect(clientsManager).toContain("Cadastros por tipo de cliente");
    expect(clientsManager).toContain("metrics?.clientsByType?.[item.key]");
  });

  it("confirma a criação somente após a mutação concluir", () => {
    expect(adminCustomers).toContain('position: "top-right", duration: 3500, id: `create-customer-account-${creationClientType}`');
    expect(adminCustomers).toContain('id: "create-customer-balcao"');
    expect(adminCustomers).toContain("onError: (err) => toast.error(err.message)");
  });
});
