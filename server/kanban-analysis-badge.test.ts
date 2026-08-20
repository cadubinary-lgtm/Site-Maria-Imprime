import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminLayoutPath = resolve(process.cwd(), "client/src/components/AdminLayout.tsx");

describe("indicador do Kanban de Produção", () => {
  it("não reutiliza indicadores de Pré-Impressão no Kanban de Produção", () => {
    const source = readFileSync(adminLayoutPath, "utf8");

    expect(source).toContain('{ label: "Produção Kanban", href: "/admin/producao/kanban" }');
    expect(source).not.toContain("awaitingAnalysisCount");
    expect(source).not.toContain('badge: awaitingAnalysisCount || undefined');
  });
});
