import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("confirmações de exclusão de Segmentos", () => {
  it("exige confirmação interna antes de excluir um segmento ou remover seu ícone", () => {
    const source = readFileSync("client/src/pages/erp/SegmentsManager.tsx", "utf8");

    expect(source).toContain("setSegmentPendingDeletion");
    expect(source).toContain("Excluir segmento?");
    expect(source).toContain("handleDeleteSegment");
    expect(source).toContain("setSegmentIconPendingRemoval");
    expect(source).toContain("Remover ícone do segmento?");
    expect(source).toContain("handleRemoveSegmentIcon");
  });
});
