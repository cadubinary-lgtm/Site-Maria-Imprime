import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

describe("card administrativo de produto", () => {
  it("mantém o card compacto e exibe a imagem sem recorte", () => {
    expect(source).toContain('CardContent className="px-4 py-1.5"');
    expect(source).toContain('md:grid-cols-[auto_6rem_minmax(0,1fr)_auto]');
    expect(source).toContain('aspect-square w-24 shrink-0 items-center justify-center rounded-lg bg-gray-50');
    expect(source).toContain('h-full w-full rounded-md object-contain');
    expect(source).not.toContain('h-28 w-full rounded-lg object-cover md:w-36');
    expect(source).toContain('mb-2 line-clamp-2 text-sm text-gray-600');
  });
});
