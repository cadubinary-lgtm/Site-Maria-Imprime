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

  it("cria um item personalizado em card editável", () => {
    expect(formSource).toContain("const addCustomItemToQuote");
    expect(formSource).toContain('itemType: "custom"');
    expect(formSource).toContain('aria-label="Nome do item personalizado"');
    expect(formSource).toContain("const renderCustomItemCard");
    expect(formSource).toContain("Nome do Produto / Serviço");
    expect(formSource).toContain("Descrição");
  });

  it("mantém apenas descrição e upload de arte no card personalizado", () => {
    const customCardSource = formSource.slice(
      formSource.indexOf("const renderCustomItemCard"),
      formSource.indexOf("return (", formSource.indexOf("const renderCustomItemCard") + 1)
    );
    expect(customCardSource).not.toContain("specificationFields");
    expect(customCardSource).not.toContain("Largura (m)");
    expect(customCardSource).not.toContain("Altura (m)");
    expect(customCardSource).not.toContain("Tipo de Impressão");
    expect(formSource).toContain("Arte / Layout");
  });

  it("empilha cada item personalizado fora da tabela de produtos de catálogo", () => {
    expect(formSource).toContain('items.some((item) => !item.isCustom)');
    expect(formSource).toContain('items.some((item) => item.isCustom)');
    expect(formSource).toContain('items.map((item, idx) => item.isCustom ? renderCustomItemCard(item, idx) : null)');
    expect(formSource).toContain("Itens personalizados");
  });

  it("mantém o valor personalizado integrado ao total do orçamento", () => {
    expect(formSource).toContain("item.isCustom ? (");
    expect(formSource).toContain("unitPrice: value / Math.max(1, item.quantity)");
    expect(formSource).toContain("const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);");
  });
});
