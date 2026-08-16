import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "client/src/pages/admin/AdminProducts.tsx"), "utf8");

describe("barra lateral de segmentos em Produtos → Todos os Produtos", () => {
  it("filtra a lista administrativa pelas relações reais de segmentos", () => {
    expect(source).toContain("trpc.productSegments.getAllSegments.useQuery()");
    expect(source).toContain("trpc.productSegments.getProductsBySegment.useQuery(");
    expect(source).toContain("selectedSegmentProductIds.has(product.id)");
    expect(source).toContain("Filtrar produtos administrativos por segmento");
    expect(source).toContain("Todos os segmentos");
    expect(source).toContain("xl:grid-cols-[12.5rem_minmax(0,1fr)]");
  });
});
