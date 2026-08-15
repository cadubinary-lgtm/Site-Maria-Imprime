import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("mutações de Segmentos", () => {
  it("aceita a sessão administrativa usada pelo painel para salvar edições", () => {
    const source = readFileSync("server/routers.ts", "utf8");
    const segmentBlock = source.slice(source.indexOf("segments: router({"), source.indexOf("// Categories - Público"));

    expect(segmentBlock).toContain("create: adminAnyProcedure");
    expect(segmentBlock).toContain("update: adminAnyProcedure");
    expect(segmentBlock).toContain("delete: adminAnyProcedure");
    expect(segmentBlock).toContain("reorder: adminAnyProcedure");
  });
});
