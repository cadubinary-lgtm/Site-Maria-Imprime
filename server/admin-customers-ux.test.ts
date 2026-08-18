import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminCustomers.tsx"), "utf8");

describe("central administrativa de clientes", () => {
  it("usa rosa nos controles não semânticos de clientes", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).toContain("text-pink-600 border-pink-200 hover:bg-pink-50");
    expect(source).toContain('aria-label="Carregando clientes"');
  });

  it("mantém retirada liberada como estado semântico verde", () => {
    expect(source).toContain("text-green-700 border-green-200 hover:bg-green-50 text-xs");
    expect(source).toContain("aria-busy={toggleStorePickup.isPending}");
  });

  it("identifica busca, tabela de preços e ações por cliente", () => {
    expect(source).toContain('htmlFor="admin-customers-search"');
    expect(source).toContain('aria-label={`Tabela de preços de ${customer.firstName} ${customer.lastName}`}');
    expect(source).toContain('aria-label={`Ver detalhes de ${customer.firstName} ${customer.lastName}`}');
  });
});
