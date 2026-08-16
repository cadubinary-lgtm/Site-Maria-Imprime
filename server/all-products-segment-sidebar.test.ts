import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "client/src/pages/public/AllProducts.tsx"), "utf8");

describe("barra lateral de segmentos em Todos os Produtos", () => {
  it("usa os segmentos dinâmicos para filtrar a listagem pela barra lateral", () => {
    expect(source).toContain("trpc.productSegments.getAllSegments.useQuery()");
    expect(source).toContain("trpc.productSegments.getProductsBySegment.useQuery(");
    expect(source).toContain("Buscar por segmento");
    expect(source).toContain("Todos os segmentos");
    expect(source).toContain('aria-label="Filtrar produtos por segmento"');
    expect(source).toContain("setSelectedSegmentId(seg.id)");
    expect(source).toContain("lg:grid-cols-[15rem_minmax(0,1fr)]");
  });
});
