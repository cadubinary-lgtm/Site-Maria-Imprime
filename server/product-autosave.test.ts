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
    expect(source).toContain("As próximas alterações serão salvas automaticamente.");
    expect(source).toContain("Preencha os dados obrigatórios e clique em Criar produto para iniciar o autosalvamento.");
  });
});
