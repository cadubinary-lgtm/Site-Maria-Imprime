import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const featuredProducts = readFileSync(
  resolve(process.cwd(), "client/src/components/home/FeaturedProducts.tsx"),
  "utf8",
);
const catalog = readFileSync(
  resolve(process.cwd(), "client/src/pages/public/AllProducts.tsx"),
  "utf8",
);

describe("visibilidade de produtos na vitrine pública", () => {
  it("filtra itens inativos da seção de produtos em destaque", () => {
    expect(featuredProducts).toContain("filter((product: any) => Boolean(product.isActive))");
  });

  it("filtra itens inativos do catálogo público", () => {
    expect(catalog).toContain("products.filter((product) => Boolean(product.isActive))");
  });
});
