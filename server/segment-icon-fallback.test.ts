import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const files = [
  "client/src/pages/admin/AdminProducts.tsx",
  "client/src/pages/public/AllProducts.tsx",
  "client/src/pages/admin/AdminPanel.tsx",
];

describe("ícones de segmentos", () => {
  it("não inventa ícones quando o segmento não possui um ícone cadastrado", () => {
    for (const relativePath of files) {
      const source = readFileSync(resolve(root, relativePath), "utf8");
      expect(source).not.toContain("|| '📦'");
      expect(source).not.toContain('|| "📦"');
    }
  });

  it("mantém a exibição condicional de ícones realmente cadastrados nas barras de segmentos", () => {
    const adminSource = readFileSync(resolve(root, files[0]), "utf8");
    const publicSource = readFileSync(resolve(root, files[1]), "utf8");

    expect(adminSource).toContain("segment.icon ?");
    expect(publicSource).toContain("seg.icon ?");
  });
});
