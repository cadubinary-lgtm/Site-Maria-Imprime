import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminKanban.tsx"), "utf8");

describe("kanban administrativo", () => {
  it("não mantém confirmação nativa em um fluxo de cancelamento inativo", () => {
    expect(source).not.toContain("confirm(");
    expect(source).not.toContain("const handleCancel");
    expect(source).not.toContain("onCancel={handleCancel}");
  });

  it("mantém o acesso contextual aos detalhes do pedido a partir do kanban", () => {
    expect(source).toContain('href={`/admin/pedidos/${selectedOrderId}?from=kanban`}');
    expect(source).toContain('backRoute="/admin/pedidos/kanban"');
  });
});
