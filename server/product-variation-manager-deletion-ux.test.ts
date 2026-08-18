import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/components/products/ProductVariationManager.tsx"), "utf8");

describe("exclusões de variações de produto", () => {
  it("substitui todas as confirmações nativas por um diálogo acessível", () => {
    expect(source).toContain("<AlertDialog open={Boolean(pendingDeletion)}");
    expect(source).toContain("handleConfirmDelete");
    expect(source).not.toContain("confirm(");
  });

  it("preserva os quatro fluxos persistentes de exclusão", () => {
    expect(source).toContain('pendingDeletion.kind === "variation"');
    expect(source).toContain('pendingDeletion.kind === "option"');
    expect(source).toContain('pendingDeletion.kind === "cv"');
    expect(source).toContain("deleteOffsetTypeMutation.mutateAsync");
  });

  it("comunica processamento e nomeia a exclusão da variação do produto", () => {
    expect(source).toContain("aria-busy={isDeleting}");
    expect(source).toContain('aria-label={`Excluir variação ${vt.name}`}');
    expect(source).toContain("setPendingDeletion(null)");
  });

  it("mantém o destaque de expansão na identidade rosa", () => {
    expect(source).toContain('"bg-pink-50 border-b border-pink-300"');
    expect(source).not.toContain('"bg-orange-50 border-b border-orange-300"');
  });
});
