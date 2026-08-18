import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("cabeçalho público", () => {
  it("aplica a identidade rosa aos controles públicos e remove o laranja legado", () => {
    const source = readFileSync(resolve(root, "client/src/components/layout/Header.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(source).toContain("bg-pink-600");
    expect(source).not.toContain("bg-orange-500 hover:bg-orange-600");
  });

  it("nomeia carrinho, busca e menu móvel para tecnologias assistivas", () => {
    const source = readFileSync(resolve(root, "client/src/components/layout/Header.tsx"), "utf8");

    expect(source).toContain("Abrir carrinho com ${cartCount}");
    expect(source).toContain('aria-label="Buscar produtos, materiais ou serviços"');
    expect(source).toContain('aria-controls="mobile-navigation"');
    expect(source).toContain('aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}');
    expect(source).toContain('id="header-search-results"');
  });

  it("leva categorias da busca ao catálogo segmentado existente", () => {
    const source = readFileSync(resolve(root, "client/src/components/layout/Header.tsx"), "utf8");

    expect(source).toContain("/catalogo?segmentId=${category.id}");
    expect(source).not.toContain("/categoria/${category.id}");
  });
});
