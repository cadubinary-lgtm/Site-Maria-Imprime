import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const abandonedCartsPagePath = resolve(process.cwd(), "client/src/pages/admin/AdminAbandonedCarts.tsx");

describe("detalhe de carrinho abandonado", () => {
  it("exibe atributos como texto preto, sem badges em formato de retângulo", () => {
    const source = readFileSync(abandonedCartsPagePath, "utf8");

    expect(source).toContain('className="mt-2 space-y-1"');
    expect(source).toContain('className="text-xs text-gray-900"');
    expect(source).toContain('<span className="font-medium">{variation.name}:</span>');
    expect(source).not.toContain('variant="secondary" className="font-normal">{variation.name}: {variation.value}</Badge>');
  });
});
