import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

describe("salvamento automático de produtos", () => {
  it("agenda a atualização da edição e remove a janela de confirmação de saída", () => {
    const source = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

    expect(source).toContain("setTimeout(async () => {");
    expect(source).toContain("await handleSave(true)");
    expect(source).toContain("Salvando automaticamente...");
    expect(source).toContain("Falha ao salvar: rascunho preservado");
    expect(source).toContain("handleUndoLastAutoSave");
    expect(source).toContain("Desfazer");
    expect(source).toContain("showCloseButton={false}");
    expect(source).toContain("Voltar");
    expect(source).toContain("finalizeEditPrice");
    expect(source).toContain("normalizeProductPriceInput");
    expect(source).toContain("xl:col-span-6 xl:grid-cols-4");
    expect(source).toContain("PRODUCT_FORM_PANEL.card");
    expect(source).not.toContain("Salvar Alterações");
    expect(source).not.toContain("Salvar alterações antes de sair?");
  });

  it("exige criação inicial explícita e só ativa o autosalvamento após o produto existir", () => {
    const source = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");

    expect(source).toContain("isCreateFormReadyForAutoSave");
    expect(source).toContain("synchronizeNewProduct");
    expect(source).toContain("handleCreateProduct");
    expect(source).toContain("if (!autoCreatedProductId)");
    expect(source).toContain("Criar produto");
    expect(source).toContain("createProductMutation.mutateAsync(getCreatePayload())");
    expect(source).toContain("updateProductMutation.mutateAsync({ id: autoCreatedProductId, ...payload })");
    expect(source).toContain("as próximas alterações serão salvas automaticamente.");
    expect(source).toContain("Preencha os dados obrigatórios e clique em Criar produto para iniciar o autosalvamento.");
  });

  it("confirma a criação em toast e permite descartar o rascunho antes do cadastro", () => {
    const source = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");

    expect(source).toContain('toast.success("Produto criado com sucesso"');
    expect(source).toContain('position: "top-right"');
    expect(source).toContain("duration: 3500");
    expect(source).toContain("id: `new-product-created-${productId}`");
    expect(source).toContain("handleDiscardDraft");
    expect(source).toContain("Descartar Rascunho");
    expect(source).toContain("Descartar rascunho?");
    expect(source).toContain('window.localStorage.removeItem("maria-imprime-new-product-autosave")');
    expect(source).toContain("setCreateForm(initialForm)");
    expect(source).toContain("setCreateLogistics(initialLogistics)");
    expect(source).toContain("setCreateDeliveryOptions(initialDeliveryOptions)");
    expect(source).toContain('setAutoSaveState("idle")');
  });

  it("preenche Novo Produto ao duplicar um item existente, sem cadastrá-lo automaticamente", () => {
    const newProductSource = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");
    const productsSource = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

    expect(productsSource).toContain('navigate(`/admin/novo-produto?duplicar=${product.id}`)');
    expect(productsSource).toContain("Duplicar");
    expect(newProductSource).toContain("duplicateProductId");
    expect(newProductSource).toContain("trpc.products.getById.useQuery");
    expect(newProductSource).toContain("trpc.productSegments.getProductSegments.useQuery");
    expect(newProductSource).toContain("trpc.deliveryOptions.getByProduct.useQuery");
    expect(newProductSource).toContain("name: `Cópia de ${source.name}`");
    expect(newProductSource).toContain("setAutoCreatedProductId(null)");
    expect(newProductSource).toContain("Produto pronto para duplicação");
    expect(newProductSource).toContain('navigate("/admin/novo-produto", { replace: true })');
  });

  it("permite limpar imagens da cópia e destaca o produto recém-criado na listagem", () => {
    const newProductSource = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");
    const productsSource = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

    expect(newProductSource).toContain("handleClearDuplicateImages");
    expect(newProductSource).toContain("Limpar imagens");
    expect(newProductSource).toContain("Limpar imagens da cópia?");
    expect(newProductSource).toContain('navigate(`/admin/produtos?destacar=${productId}`)');
    expect(productsSource).toContain("highlightedProductId");
    expect(productsSource).toContain("recentlyCreatedProductId");
    expect(productsSource).toContain("Produto recém-criado");
  });

  it("exibe preços lado a lado e recolhe Preço rápido ao clicar novamente", () => {
    const productsSource = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

    expect(productsSource).toContain("getProductPaymentPrices(product)");
    expect(productsSource).toContain('getProductPrice(product, "reseller")');
    expect(productsSource).toContain(">Pix<");
    expect(productsSource).toContain(">Cartão<");
    expect(productsSource).toContain(">Revendedor<");
    expect(productsSource).toContain("toggleQuickEdit");
    expect(productsSource).toContain("if (quickEditingId === product.id)");
    expect(productsSource).toContain("aria-expanded={quickEditingId === product.id}");
  });
});
