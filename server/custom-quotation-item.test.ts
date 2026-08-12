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

  it("permite expandir e recolher cada item personalizado", () => {
    expect(formSource).toContain("const isExpanded = expandedItems.has(idx);");
    expect(formSource).toContain("onClick={() => toggleItem(idx)}");
    expect(formSource).toContain("aria-expanded={isExpanded}");
    expect(formSource).toContain("{isExpanded && <div className=\"space-y-4 p-4\">");
  });

  it("resume o item personalizado fechado no mesmo padrão do catálogo", () => {
    expect(formSource).toContain("— produto ou serviço fora do catálogo");
    expect(formSource).toContain('className="col-span-3 min-w-0 text-left text-sm font-medium text-gray-800 hover:text-pink-600"');
    expect(formSource).toContain('alt={`Arte de ${item.productName || "item personalizado"}`}');
    expect(formSource).toContain('title={isExpanded ? "Recolher item personalizado" : "Expandir item personalizado"}');
  });

  it("usa cabeçalho de colunas para quantidade, valor unitário e total", () => {
    expect(formSource).toContain('className="grid grid-cols-12 gap-2 border-b border-gray-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500"');
    expect(formSource).toContain(">Produto / Serviço</div>");
    expect(formSource).toContain(">Arte</div>");
    expect(formSource).toContain(">Qtd</div>");
    expect(formSource).toContain(">Unit.</div>");
    expect(formSource).toContain(">Total</div>");
  });

  it("usa o mesmo acabamento neutro e a ação de arte dos itens de catálogo", () => {
    expect(formSource).toContain('className="overflow-hidden rounded-lg border border-gray-100 bg-white"');
    expect(formSource).toContain('grid grid-cols-12 items-center gap-2 bg-gray-50 px-2 py-2');
    expect(formSource).toContain('title="Anexar arte"');
    expect(formSource).toContain('h-px flex-1 bg-gray-200');
  });

  it("posiciona a seta de expansão do item de catálogo junto ao valor", () => {
    expect(formSource).toContain('className="col-span-3 flex items-center justify-end gap-1 text-right text-sm font-semibold text-gray-800"');
    expect(formSource).toContain('title={isExpanded ? "Recolher especificações" : "Expandir especificações"}');
  });

  it("mantém o valor personalizado integrado ao total do orçamento", () => {
    expect(formSource).toContain("item.isCustom ? (");
    expect(formSource).toContain("unitPrice: value / Math.max(1, item.quantity)");
    expect(formSource).toContain("const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);");
  });
});
