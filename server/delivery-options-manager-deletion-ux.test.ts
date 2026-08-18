import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/components/products/DeliveryOptionsManager.tsx"), "utf8");

describe("prazos de produção do produto", () => {
  it("substitui confirmação nativa por diálogo acessível", () => {
    expect(source).toContain("<AlertDialog open={Boolean(optionToDelete)}");
    expect(source).toContain("handleConfirmDelete");
    expect(source).not.toContain("confirm(");
  });

  it("identifica o prazo e comunica processamento durante a exclusão", () => {
    expect(source).toContain('aria-label={`Excluir prazo ${option.name}`}');
    expect(source).toContain("aria-busy={deleteMutation.isPending}");
    expect(source).toContain("setOptionToDelete(null)");
  });

  it("usa a identidade rosa nos controles principais de prazo", () => {
    expect(source).toContain("bg-pink-600 hover:bg-pink-700 text-white");
    expect(source).not.toContain("bg-orange-500");
    expect(source).not.toContain("hover:bg-orange-600");
  });
});
