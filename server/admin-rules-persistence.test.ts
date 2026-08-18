import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const databaseSource = readFileSync(resolve(import.meta.dirname, "db-attributes.ts"), "utf8");
const routerSource = readFileSync(resolve(import.meta.dirname, "routers-attributes.ts"), "utf8");

describe("persistência administrativa de regras de atributos", () => {
  it("mantém a atualização da regra e de seus relacionamentos em uma transação", () => {
    expect(databaseSource).toContain("export async function updateAttributeRule");
    expect(databaseSource).toContain("await db.transaction");
    expect(databaseSource).toContain("tx.delete(attributeRuleConditions)");
    expect(databaseSource).toContain("tx.delete(attributeRuleActions)");
  });

  it("permite administrar regras inativas sem expô-las no contrato público", () => {
    expect(databaseSource).toContain("getProductRules(productId: number, includeInactive = false)");
    expect(routerSource).toContain("getProductRulesForAdmin: adminProcedure");
    expect(routerSource).toContain("dbAttributes.getProductRules(input, true)");
  });

  it("expõe apenas operações administrativas validadas para atualizar e excluir regras", () => {
    expect(routerSource).toContain("updateAttributeRule: adminProcedure");
    expect(routerSource).toContain("deleteAttributeRule: adminProcedure.input(z.number())");
    expect(routerSource).toContain("z.number().positive()");
  });
});
