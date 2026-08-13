import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const kanbanPath = resolve(process.cwd(), "client/src/pages/admin/AdminKanban.tsx");

describe("badge de pendências da coluna Analisando", () => {
  it("destaca a quantidade de itens aguardando análise", () => {
    const source = readFileSync(kanbanPath, "utf8");

    expect(source).toContain('const isAwaitingAnalysis = col.id === "analisando" && colOrders.length > 0;');
    expect(source).toContain('"bg-pink-100 text-pink-700 border border-pink-200"');
    expect(source).toContain('`${colOrders.length} pendente${colOrders.length !== 1 ? "s" : ""}`');
  });
});
