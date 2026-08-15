import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("lista Todos os Clientes", () => {
  it("preserva as colunas comerciais e acrescenta as colunas operacionais", () => {
    const page = readFileSync("client/src/pages/admin/ClientsManager.tsx", "utf8");
    ["Compras", "Produtos", "Última compra", "Situação", "Status", "Cadastro", "Retirada", "Ações"].forEach((column) => {
      expect(page).toContain(`>${column}</th>`);
    });
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
