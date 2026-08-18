import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminProducts.tsx"), "utf8");

describe("exclusão de produtos no painel administrativo", () => {
  it("substitui confirmações nativas de exclusão unitária e em lote", () => {
    expect(source).toContain("<AlertDialog open={Boolean(productToDelete)}");
    expect(source).toContain("<AlertDialog open={isBulkDeleteConfirmOpen}");
    expect(source).toContain("handleConfirmDeleteMultiple");
    expect(source).not.toContain("confirm(");
  });

  it("identifica o produto e informa processamento durante a exclusão", () => {
    expect(source).toContain('Excluir o produto “{productToDelete?.name}”?');
    expect(source).toContain("aria-busy={deleteProductMutation.isPending}");
    expect(source).toContain("aria-busy={deleteMultipleProductsMutation.isPending}");
  });

  it("limpa seleções e confirmações apenas após a exclusão bem-sucedida", () => {
    expect(source).toContain("setProductToDelete(null)");
    expect(source).toContain("setIsBulkDeleteConfirmOpen(false)");
    expect(source).toContain("setSelectedProducts(new Set())");
  });
});
