import { describe, expect, it } from "vitest";
import { ADMIN_MENU_GROUP_ICON_CLASS, getAdminMenuGroupColors } from "../client/src/lib/admin-menu-group-colors";

describe("cores dos grupos principais do menu administrativo", () => {
  it("mantém nomes e ícones em rosa quando o grupo está inativo", () => {
    expect(getAdminMenuGroupColors(false, false)).toContain("text-pink-400");
  });

  it("preserva contraste branco quando o item ativo ocupa fundo rosa", () => {
    expect(getAdminMenuGroupColors(false, true)).toContain("text-white");
  });

  it("mantém o ícone branco sem alterar o rosa do nome do grupo", () => {
    expect(ADMIN_MENU_GROUP_ICON_CLASS).toBe("text-white");
  });
});
