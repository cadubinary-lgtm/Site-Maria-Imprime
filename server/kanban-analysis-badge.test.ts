import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminLayoutPath = resolve(process.cwd(), "client/src/components/AdminLayout.tsx");

describe("indicador do Kanban de Produção", () => {
  it("prioriza os produtos aguardando análise no indicador da Linha de Produção", () => {
    const source = readFileSync(adminLayoutPath, "utf8");

    expect(source).toContain('const awaitingAnalysisCount = orders?.filter((o: any) => o.status === "analisando").length ?? 0;');
    expect(source).toContain('{ label: "Produção Kanban", href: "/admin/producao/kanban", badge: awaitingAnalysisCount || undefined }');
    expect(source).not.toContain('const inProductionCount = orders?.filter((o: any) => o.status === "em_producao").length ?? 0;');
  });
});
