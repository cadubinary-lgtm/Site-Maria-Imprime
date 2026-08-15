import { describe, expect, it } from "vitest";
import { shouldShowAdminMenuItemIcon } from "../client/src/lib/admin-menu-item-visibility";

describe("ícones dos itens do menu administrativo", () => {
  it("oculta ícones dos itens de Dashboard", () => {
    expect(shouldShowAdminMenuItemIcon("Dashboard de Vendas")).toBe(false);
    expect(shouldShowAdminMenuItemIcon("Dashboard")).toBe(false);
  });

  it("mantém ícones dos demais itens", () => {
    expect(shouldShowAdminMenuItemIcon("Todos os Produtos")).toBe(true);
  });
});
