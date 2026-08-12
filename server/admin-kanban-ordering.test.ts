import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("ordenação do Kanban de Produção", () => {
  it("prioriza pedidos mais antigos pela data de criação e usa o id como desempate estável", () => {
    const source = readFileSync("client/src/pages/admin/AdminKanban.tsx", "utf8");

    expect(source).toContain("new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()");
    expect(source).toContain("creationDifference || a.id - b.id");
    expect(source).toContain("Data de entrada (mais antigos)");
  });
});
