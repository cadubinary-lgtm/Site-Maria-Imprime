import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(import.meta.dirname, "../client/src/pages/admin/AdminQuotationForm.tsx"),
  "utf8",
);

describe("seletor de produtos do orçamento por segmento", () => {
  it("oferece segmentos e consulta os produtos do segmento selecionado", () => {
    expect(source).toContain("trpc.productSegments.getAllSegments.useQuery()");
    expect(source).toContain("trpc.productSegments.getProductsBySegment.useQuery(");
    expect(source).toContain("selectedProductSegmentId");
    expect(source).toContain("Todos os segmentos");
  });

  it("mantém a busca geral e amplia a janela compartilhada por admin e vendedor", () => {
    expect(source).toContain("A busca permanece geral");
    expect(source).toContain("!max-w-[96vw]");
    expect(source).toContain("h-[min(90vh,58rem)]");
    expect(source).toContain("Buscar produto em todos os segmentos...");
    expect(source).toContain("grid-cols-1 overflow-hidden rounded-xl border border-gray-200 bg-white lg:grid-cols-[16rem_minmax(0,1fr)]");
    expect(source).toContain('className="flex flex-col gap-1"');
    expect(source).toContain('break-words text-sm font-medium leading-5 text-gray-800');
  });
});
