import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAdminDetailLocation,
  getAdminContextualReturnTarget,
  getAdminFallbackPath,
  getAdminReturnTarget,
  isAdminDetailPath,
} from "../client/src/lib/adminNavigation";

const adminLayoutPath = resolve(process.cwd(), "client/src/components/AdminLayout.tsx");
const globalDeliveryOptionsPath = resolve(process.cwd(), "client/src/pages/admin/AdminGlobalDeliveryOptions.tsx");
const receiptPrintPath = resolve(process.cwd(), "client/src/pages/admin/FinanceiroReciboPrint.tsx");

describe("navegação contextual administrativa", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("marca detalhes administrativos sem considerar listagens como detalhes", () => {
    expect(isAdminDetailPath("/admin/pedidos/42")).toBe(true);
    expect(isAdminDetailPath("/admin/os/42")).toBe(true);
    expect(isAdminDetailPath("/admin/pedidos/kanban")).toBe(false);
    expect(isAdminDetailPath("/admin/financeiro/receber")).toBe(false);
  });

  it("anexa uma origem administrativa segura ao abrir um detalhe", () => {
    expect(createAdminDetailLocation("/admin/pedidos/42", "/admin/financeiro/receber"))
      .toBe("/admin/pedidos/42?from=%2Fadmin%2Ffinanceiro%2Freceber");
    expect(createAdminDetailLocation("/admin/pedidos/42", "https://externo.exemplo"))
      .toBe("/admin/pedidos/42");
  });

  it("mantém o retorno padrão quando não há contexto no ambiente de teste", () => {
    expect(getAdminReturnTarget("/admin/pedidos")).toEqual({
      path: "/admin/pedidos",
      label: "Voltar para Pedidos",
    });
  });

  it("define uma rota de retorno segura para listas, subpáginas e telas de impressão", () => {
    expect(getAdminFallbackPath("/admin/pedidos")).toBe("/admin");
    expect(getAdminFallbackPath("/admin/pedidos/kanban")).toBe("/admin/pedidos");
    expect(getAdminFallbackPath("/admin/novo-produto")).toBe("/admin/produtos");
    expect(getAdminFallbackPath("/admin/financeiro/recibos/42/imprimir")).toBe("/admin/financeiro/recibos");
    expect(getAdminFallbackPath("/admin/configuracoes-site/prazos-padrao")).toBe("/admin");
  });

  it("prioriza a página visitada anteriormente e evita retorno para a própria tela", () => {
    expect(getAdminContextualReturnTarget("/admin/novo-produto", "/admin/clientes")).toEqual({
      path: "/admin/clientes",
      label: "Voltar",
    });
    expect(getAdminContextualReturnTarget("/admin/pedidos", "/admin/pedidos")).toEqual({
      path: "/admin",
      label: "Voltar ao Painel",
    });
  });

  it("mantém rótulos específicos para os submenus operacionais e financeiros", () => {
    expect(createAdminDetailLocation("/admin/pedidos/42", "/admin/pre-impressao"))
      .toContain("from=%2Fadmin%2Fpre-impressao");
    expect(createAdminDetailLocation("/admin/pedidos/42", "/admin/financeiro/retirada"))
      .toContain("from=%2Fadmin%2Ffinanceiro%2Fretirada");
  });

  it("retorna para Contas a Receber quando o detalhe recebe a origem financeira", () => {
    vi.stubGlobal("window", {
      location: { search: "?from=%2Fadmin%2Ffinanceiro%2Freceber" },
      sessionStorage: { getItem: () => null },
    });

    expect(getAdminReturnTarget("/admin/pedidos")).toEqual({
      path: "/admin/financeiro/receber",
      label: "Voltar para Contas a Receber",
    });
  });

  it("preserva o retorno para o Kanban legado", () => {
    vi.stubGlobal("window", {
      location: { search: "?from=kanban" },
      sessionStorage: { getItem: () => null },
    });

    expect(getAdminReturnTarget("/admin/pedidos")).toEqual({
      path: "/admin/pedidos/kanban",
      label: "Voltar para Kanban",
    });
  });

  it("considera a query string para destacar somente o submenu administrativo correto", () => {
    const source = readFileSync(adminLayoutPath, "utf8");

    expect(source).toContain('import { Link, useLocation, useSearch } from "wouter";');
    expect(source).toContain("const currentLocation = locationSearch ? `${location}?${locationSearch}` : location;");
    expect(source).toContain("currentLocation === child.href");
    expect(source).toContain("const isActive = item.href ? currentLocation === item.href : false;");
  });

  it("oferece retorno global em todas as páginas que usam o layout administrativo", () => {
    const source = readFileSync(adminLayoutPath, "utf8");

    expect(source).toContain("getAdminContextualReturnTarget(location, previousAdminLocation)");
    expect(source).toContain("aria-label={`Voltar: ${returnTarget.label}`}");
    expect(source).toContain("rememberAdminOrigin(previousLocation)");
  });

  it("mantém retorno contextual nas exceções com cabeçalho próprio", () => {
    expect(readFileSync(globalDeliveryOptionsPath, "utf8")).toContain("getAdminContextualReturnTarget(location)");
    expect(readFileSync(receiptPrintPath, "utf8")).toContain("onClick={() => setLocation(returnTarget.path)}");
  });

  it("mantém a página de Validação de Arquivos fora do menu lateral", () => {
    const source = readFileSync(adminLayoutPath, "utf8");

    expect(source).not.toContain('{ label: "Validação de Arquivos", href: "/admin/validacao-arquivos" }');
  });
});
