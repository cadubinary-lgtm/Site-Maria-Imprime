import { describe, expect, it } from "vitest";
import { SEGMENTS_PAGE_CONTENT_CLASS } from "../client/src/lib/segments-page-layout";

describe("layout da página de segmentos", () => {
  it("mantém o conteúdo preparado para o layout administrativo e telas menores", () => {
    expect(SEGMENTS_PAGE_CONTENT_CLASS).toContain("admin-visual-system");
    expect(SEGMENTS_PAGE_CONTENT_CLASS).toContain("sm:p-8");
  });
});
