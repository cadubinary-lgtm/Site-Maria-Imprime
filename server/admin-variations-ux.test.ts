import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminVariations.tsx"), "utf8");

describe("página administrativa de variações", () => {
  it("mantém um retorno identificado e alinhado à identidade rosa", () => {
    expect(source).toContain("border-pink-200 text-pink-700 hover:bg-pink-50 hover:text-pink-800");
    expect(source).toContain('type="button"');
    expect(source).toContain('aria-hidden="true"');
  });

  it("reutiliza o gerenciador central de variações", () => {
    expect(source).toContain("<ProductVariationManager />");
  });
});
