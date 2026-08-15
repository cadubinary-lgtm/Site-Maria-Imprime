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
    expect(formSource).toContain("const openCustomItemNameStep");
    expect(formSource).toContain("const confirmCustomItemName");
    expect(formSource).toContain('Informe o nome do Produto / Serviço.');
    expect(formSource).toContain('id="custom-item-name"');
    expect(formSource).toContain('productName,');
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
    expect(formSource).toContain("produto ou serviço fora do catálogo");
    expect(formSource).toContain('className="col-span-3 flex min-w-0 items-center gap-1"');
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
    expect(formSource).toContain('overflow-hidden rounded-lg border border-gray-100 bg-white transition-opacity');
    expect(formSource).toContain('grid grid-cols-12 items-center gap-2 bg-gray-50 px-2 py-2');
    expect(formSource).toContain('title="Anexar arte"');
  });

  it("padroniza Itens personalizados com o cabeçalho e ícone de Produtos / Serviços", () => {
    expect(formSource).toContain('className="space-y-2"');
    expect(formSource).toContain('className="flex items-center gap-2 border-t border-gray-200 pt-4"');
    expect(formSource).toContain('<Package className="h-4 w-4 shrink-0 text-pink-600" />');
    expect(formSource).toContain('<h2 className="font-semibold text-gray-800">Itens personalizados</h2>');
    expect(formSource).toContain('<span className="text-xs text-gray-400">— produto ou serviço fora do catálogo</span>');
  });

  it("alinha a ação de exclusão na coluna final do catálogo", () => {
    expect(formSource).toContain('className="col-span-1 flex justify-end gap-1"');
    expect(formSource).toContain('title="Remover item"');
  });

  it("abre a arte personalizada no mesmo visualizador ampliado do catálogo", () => {
    expect(formSource).toContain('title="Visualizar arte em tamanho ampliado"');
    expect(formSource).toContain("onClick={() => setLightboxImg(item.artFileUrl!)}");
    expect(formSource).toContain('className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"');
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

  it("permite editar o valor unitário e recalcular o total do item personalizado", () => {
    expect(formSource).toContain('aria-label={`Valor unitário de ${item.productName || "item personalizado"}`}');
    expect(formSource).toContain("updateItem(idx, { unitPrice: value });");
    expect(formSource).toContain("next[idx].totalPrice = q * u +");
  });
});
