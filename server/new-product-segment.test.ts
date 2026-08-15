import { describe, expect, it } from "vitest";
import { getLegacySegmentFromSelection } from "../client/src/lib/new-product-segment";

describe("segmento legado do novo produto", () => {
  const segments = [{ id: 1, slug: "lonas" }, { id: 2, slug: "banners" }];

  it("usa o primeiro segmento selecionado para o campo legado", () => {
    expect(getLegacySegmentFromSelection([2, 1], segments)).toBe("banners");
  });

  it("retorna vazio sem segmentos selecionados", () => {
    expect(getLegacySegmentFromSelection([], segments)).toBe("");
  });
});
