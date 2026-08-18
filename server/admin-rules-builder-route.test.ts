import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const builderSource = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/AdminRulesBuilder.tsx"), "utf8");
const appSource = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");

describe("rotas administrativas de regras", () => {
  it("mantém a rota legada no gerenciador operacional, sem construtor paralelo", () => {
    expect(builderSource).toContain('export { default } from "./AdminRulesManager"');
    expect(builderSource).not.toContain("TODO: Implementar mutation para salvar regra");
  });

  it("preserva as duas rotas administrativas durante a transição", () => {
    expect(appSource).toContain('path="/admin/regras-builder" component={AdminRulesBuilder}');
    expect(appSource).toContain('path="/admin/regras-dinamicas" component={AdminRulesManager}');
  });
});
