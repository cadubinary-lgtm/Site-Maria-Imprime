import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("lista Todos os Clientes", () => {
  it("reproduz as sete colunas enxutas da referência e preserva a tag de tipo", () => {
    const page = readFileSync("client/src/pages/admin/ClientsManager.tsx", "utf8");
    ["Cliente", "Contato", "E-mail", "Status", "Cadastro", "Retirada", "Ações"].forEach((column) => {
      expect(page).toContain(`>${column}</th>`);
    });
    ["Compras", "Produtos", "Última compra", "Situação"].forEach((column) => {
      expect(page).not.toContain(`>${column}</th>`);
    });
    expect(page).toContain("TYPE_LABELS[client.clientType]");
  });

  it("consulta na lista geral as contas de Cliente Site, Revendedor e Agência", () => {
    const dataSource = readFileSync("server/db-crm.ts", "utf8");
    expect(dataSource).toContain('site: "customer"');
    expect(dataSource).toContain('revendedor: "reseller"');
    expect(dataSource).toContain('agencia: "agency"');
    expect(dataSource).toContain("toSiteDashboardClients(siteAccountRows)");
  });

  it("aplica o padrão de tabela legível às listas de todas as origens", () => {
    const files = [
      "client/src/pages/admin/ClientsManager.tsx",
      "client/src/pages/admin/AdminCustomers.tsx",
      "client/src/pages/admin/ClientesBalcao.tsx",
    ];

    files.forEach((file) => {
      expect(readFileSync(file, "utf8")).toContain("customer-list-standard");
    });

    const styles = readFileSync("client/src/index.css", "utf8");
    expect(styles).toContain("overflow-wrap: anywhere");
    expect(styles).toContain("data-customer-actions");
  });
});
