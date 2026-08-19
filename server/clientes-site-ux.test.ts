import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ClientsManager.tsx"), "utf8");
const siteWrapper = readFileSync(resolve(import.meta.dirname, "../client/src/pages/admin/ClientesSite.tsx"), "utf8");

describe("central administrativa de clientes do site", () => {
  it("mantém a rota específica vinculada ao tipo site", () => {
    expect(siteWrapper).toContain('defaultType="site"');
    expect(siteWrapper).toContain('title="Clientes Site"');
  });

  it("apresenta indicadores e filtros explícitos para contas da loja", () => {
    expect(source).toContain('const isSiteClientsView = defaultType === "site"');
    expect(source).toContain('aria-label="Indicadores dos clientes do site"');
    expect(source).toContain('aria-label="Filtros de clientes"');
    expect(source).toContain("const clearClientFilters = () => {");
    expect(source).toContain("Limpar filtros");
  });

  it("oferece gerenciamento de acessos sem expor um novo cadastro inadequado", () => {
    expect(source).toContain('setLocation("/admin/clientes-loja")');
    expect(source).toContain("Gerenciar acessos e senhas");
    expect(source).toContain('filterType === "site"');
  });
});
