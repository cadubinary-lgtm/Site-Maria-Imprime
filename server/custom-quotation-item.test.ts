import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("itens personalizados em Orçamentos", () => {
  const formSource = readFileSync(
    resolve(process.cwd(), "client/src/pages/admin/AdminQuotationForm.tsx"),
    "utf8"
  );
  const routerSource = readFileSync(
    resolve(process.cwd(), "server/quotationsRouter.ts"),
    "utf8"
  );
  const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");

  it("permite um item sem vínculo obrigatório com o catálogo", () => {
    const quotationItemsSchema = schemaSource.slice(
      schemaSource.indexOf('export const quotationItems'),
      schemaSource.indexOf('export type QuotationItem')
    );
    expect(quotationItemsSchema).toContain('productId: int("productId"),');
    expect(routerSource).toContain('productId: z.number().nullable(),');
  });

  it("cria um item personalizado com nome livre e marcador de especificação", () => {
    expect(formSource).toContain("const addCustomItemToQuote");
    expect(formSource).toContain('itemType: "custom"');
    expect(formSource).toContain('Nome do Produto / Serviço');
  });

  it("mantém o valor personalizado integrado ao total do orçamento", () => {
    expect(formSource).toContain("item.isCustom ? (");
    expect(formSource).toContain("unitPrice: value / Math.max(1, item.quantity)");
    expect(formSource).toContain("const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);");
  });
});
