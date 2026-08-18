import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ClientsManager.tsx"), "utf8");

describe("listagem administrativa de clientes", () => {
  it("mantém expansões isoladas por origem e identificador do cliente", () => {
    expect(source).toContain("const getCustomerActionKey");
    expect(source).toContain('expandedActionClientIds.has(customerActionKey)');
    expect(source).toContain('key={customerActionKey}');
  });

  it("rotula os filtros e anuncia a quantidade encontrada", () => {
    expect(source).toContain('aria-label="Buscar clientes por nome, e-mail ou telefone"');
    expect(source).toContain('aria-labelledby="customer-type-filter-label"');
    expect(source).toContain('aria-labelledby="customer-activity-filter-label"');
    expect(source).toContain('aria-live="polite"');
  });

  it("expõe cabeçalhos de tabela e estado das ações expansíveis", () => {
    expect(source).toContain('scope="col"');
    expect(source).toContain('aria-expanded={isActionExpanded}');
    expect(source).toContain('agencia:     { label: "Agência",     color: "bg-pink-100 text-pink-800" }');
  });
});
