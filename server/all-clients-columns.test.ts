import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("lista Todos os Clientes", () => {
  it("preserva as colunas comerciais e acrescenta as colunas operacionais", () => {
    const page = readFileSync("client/src/pages/admin/ClientsManager.tsx", "utf8");
    ["Compras", "Produtos", "Última compra", "Situação", "Status", "Cadastro", "Retirada", "Ações"].forEach((column) => {
      expect(page).toContain(`>${column}</th>`);
    });
  });
});
