import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const aliasSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminProductionKanban.tsx"), "utf8");
const routesSource = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");

describe("Kanban de produção administrativo", () => {
  it("reutiliza o Kanban de pedidos já padronizado para preservar comportamento e acessibilidade", () => {
    expect(aliasSource).toContain('import AdminKanban from "./AdminKanban"');
    expect(aliasSource).toContain("return <AdminKanban />;");
  });

  it("permanece disponível na rota administrativa de produção nos dois fluxos de autenticação", () => {
    expect(routesSource.match(/path="\/admin\/producao\/kanban" component=\{AdminProductionKanban\}/g)).toHaveLength(2);
  });
});
