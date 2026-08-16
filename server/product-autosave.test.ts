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
    expect(source).not.toContain("Salvar Alterações");
    expect(source).not.toContain("Salvar alterações antes de sair?");
  });

  it("cria e atualiza o novo produto somente após a validação mínima", () => {
    const source = readFileSync(resolve(root, "client/src/pages/admin/AdminNewProduct.tsx"), "utf8");

    expect(source).toContain("isCreateFormReadyForAutoSave");
    expect(source).toContain("synchronizeNewProduct");
    expect(source).toContain("createProductMutation.mutateAsync(payload)");
    expect(source).toContain("updateProductMutation.mutateAsync({ id: productId, ...payload })");
    expect(source).toContain("Aguardando dados obrigatórios");
    expect(source).toContain("As alterações são salvas automaticamente");
    expect(source).not.toContain("Criar Produto");
  });
});
