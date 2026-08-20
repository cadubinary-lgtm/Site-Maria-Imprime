import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("catálogo segmentado", () => {
  it("mostra a quantidade real do carrinho e permite abrir o painel lateral", () => {
    const source = readFileSync(resolve(root, "client/src/pages/public/Catalog.tsx"), "utf8");

    expect(source).toContain("trpc.cart.getCount.useQuery()");
    expect(source).toContain("useCartDrawer");
    expect(source).toContain("onClick={openCart}");
    expect(source).toContain("Abrir carrinho com ${cartCount}");
  });

  it("mantém filtros úteis e paginação acessíveis sem exibir uma faixa de preço", () => {
    const source = readFileSync(resolve(root, "client/src/pages/public/Catalog.tsx"), "utf8");

    expect(source).toContain("aria-pressed={activeSegment === seg.id}");
    expect(source).toContain('htmlFor="search"');
    expect(source).not.toContain("Faixa de Preço");
    expect(source).not.toContain("priceRange");
    expect(source).not.toContain("setPriceRange");
    expect(source).not.toContain('>Segmento</Label>');
    expect(source).toContain('CardContent className="px-6 pb-6 pt-3 space-y-6"');
    expect(source).toContain('aria-label="Página anterior"');
    expect(source).toContain('aria-label="Próxima página"');
    expect(source).toContain('aria-current={currentPage === i + 1 ? "page" : undefined}');
    expect(source).not.toContain('<img src={seg.icon}');
  });
});
