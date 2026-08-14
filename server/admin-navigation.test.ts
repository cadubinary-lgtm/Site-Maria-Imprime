import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAdminDetailLocation,
  getAdminReturnTarget,
  isAdminDetailPath,
} from "../client/src/lib/adminNavigation";

const adminLayoutPath = resolve(process.cwd(), "client/src/components/AdminLayout.tsx");

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
    expect(source).toContain("const currentLocation = `${location}${locationSearch}`;");
    expect(source).toContain("currentLocation === child.href");
    expect(source).toContain("const isActive = item.href ? currentLocation === item.href : false;");
  });
});
