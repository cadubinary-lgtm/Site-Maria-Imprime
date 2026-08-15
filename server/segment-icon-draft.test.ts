import { describe, expect, it } from "vitest";
import { clearSegmentIconDraft } from "../client/src/lib/segment-icon-draft";

describe("rascunho de ícone de segmento", () => {
  it("limpa apenas o ícone e o arquivo temporário do segmento em edição", () => {
    expect(clearSegmentIconDraft()).toEqual({ icon: "", iconFile: null });
  });
});
