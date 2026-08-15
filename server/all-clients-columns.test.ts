import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("lista Todos os Clientes", () => {
  it("reproduz as sete colunas enxutas da referência e preserva a tag de tipo", () => {
    const page = readFileSync("client/src/pages/admin/ClientsManager.tsx", "utf8");
    const generalCustomerTable = page.slice(page.indexOf("{/* Lista de clientes */}"), page.indexOf("<CustomerDetailsDialog"));
    ["Cliente", "Contato", "E-mail", "Status", "Cadastro", "Retirada", "Ações"].forEach((column) => {
      expect(generalCustomerTable).toContain(`>${column}</th>`);
    });
    ["Compras", "Produtos", "Última compra", "Situação"].forEach((column) => {
      expect(generalCustomerTable).not.toContain(`>${column}</th>`);
    });
    expect(generalCustomerTable).not.toContain(">Tabela de Preços</th>");
    expect(page).toContain("TYPE_LABELS[client.clientType]");
  });

  it("consulta na lista geral as contas de Cliente Site, Revendedor e Agência", () => {
    const dataSource = readFileSync("server/db-crm.ts", "utf8");
    expect(dataSource).toContain('site: "customer"');
    expect(dataSource).toContain('revendedor: "reseller"');
    expect(dataSource).toContain('agencia: "agency"');
    expect(dataSource).toContain("toSiteDashboardClients(siteAccountRows)");
  });

  it("mantém detalhes completos e ações de bloquear e excluir para todas as origens", () => {
    const page = readFileSync("client/src/pages/admin/ClientsManager.tsx", "utf8");
    expect(page).toContain("CustomerDetailsDialog");
    expect(page).toContain("adminGetCustomerDetail");
    expect(page).toContain("adminGetBalcaoClientDetail");
    expect(page).toContain("handleToggleBlock");
    expect(page).toContain("Bloquear");
    expect(page).toContain("Desbloquear");
    expect(page).toContain("Excluir");
  });

  it("exibe indicadores operacionais somente no Dashboard de Clientes", () => {
    const page = readFileSync("client/src/pages/admin/ClientsManager.tsx", "utf8");
    expect(page).toContain("{isDashboardView && (");
    expect(page).toContain("Clientes ativos");
    expect(page).toContain("Volume comprado");
  });

  it("recolhe as ações secundárias por cliente sob uma seta cinza com hover rosa", () => {
    const page = readFileSync("client/src/pages/admin/ClientsManager.tsx", "utf8");
    expect(page).toContain("expandedActionClientIds");
    expect(page).toContain("toggleActionExpansion");
    expect(page).toContain("ChevronDown");
    expect(page).toContain("text-gray-400 hover:bg-transparent hover:text-pink-600");
    expect(page).toContain("{isActionExpanded && <>");
  });

  it("inclui no Dashboard de Clientes o ranking dos 30 maiores compradores recentes", () => {
    const page = readFileSync("client/src/pages/admin/ClientsManager.tsx", "utf8");
    expect(page).toContain("getTopCustomersLastTwoMonths.useQuery");
    expect(page).toContain("30 clientes que mais compraram nos últimos dois meses");
    expect(page).toContain("Total no período");
  });

  it("aplica o padrão de tabela legível às listas de todas as origens", () => {
    const files = [
      "client/src/pages/admin/AdminCustomers.tsx",
      "client/src/pages/admin/ClientesBalcao.tsx",
    ];

    files.forEach((file) => {
      const page = readFileSync(file, "utf8");
      expect(page).toContain("customer-list-standard");
      expect(page).toContain(">Tabela de Preços</th>");
      expect(page).toContain("priceTier");
    });

    const styles = readFileSync("client/src/index.css", "utf8");
    expect(styles).toContain("overflow-wrap: anywhere");
    expect(styles).toContain("data-customer-actions");
  });
});
