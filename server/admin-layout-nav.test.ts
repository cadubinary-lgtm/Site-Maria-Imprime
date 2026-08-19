import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const appSource = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");

describe("navegação lateral administrativa", () => {
  it("usa o destaque rosa da identidade administrativa nos itens ativos e indicadores", () => {
    const source = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");

    expect(source).toContain('isActive ? "bg-pink-600 text-white font-medium"');
    expect(source).toContain('Badge className="bg-pink-600 text-white text-[10px] px-1.5 py-0 h-4"');
    expect(source).not.toContain('isActive ? "bg-orange-500 text-white font-medium"');
  });

  it("expõe o estado e o conteúdo controlado dos grupos retráteis", () => {
    const source = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");

    expect(source).toContain("aria-expanded={open}");
    expect(source).toContain("aria-controls={groupContentId}");
    expect(source).toContain("id={groupContentId}");
  });

  it("identifica a seção de pedidos e orçamentos como Comercial", () => {
    const source = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");

    expect(source).toContain('label: "COMERCIAL"');
    expect(source).not.toContain('label: "VENDAS"');
  });

  it("mantém dashboards Comercial e Relatórios em rotas distintas", () => {
    const source = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");

    expect(source).toContain('{ label: "Dashboards", href: "/admin/relatorios" }');
    expect(appSource).toContain('path="/admin/relatorios" component={AdminDashboard}');
  });

  it("mantém os dois acessos de Dados da Empresa em rotas distintas", () => {
    const source = readFileSync(resolve(root, "client/src/components/AdminLayout.tsx"), "utf8");

    expect(source).toContain('{ label: "Dados da Empresa", href: "/admin/dados-da-empresa" }');
    expect(source).toContain('{ label: "Dados da Empresa", href: "/admin/configuracoes-site/dados-da-empresa" }');
    expect(appSource).toContain('path="/admin/configuracoes-site/dados-da-empresa" component={AdminCompanySettings}');
  });
});
