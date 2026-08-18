import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("área de conta do cliente", () => {
  it("padroniza os destaques e ações principais na identidade rosa", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/MyAccountPage.tsx"), "utf8");

    expect(source).toContain("HOME_PRIMARY_ACTION_CLASS");
    expect(source).toContain("HOME_SECONDARY_ACTION_CLASS");
    expect(source).toContain("text-pink-600");
    expect(source).toContain("bg-pink-100");
    expect(source).not.toContain("bg-orange-500 hover:bg-orange-600");
  });

  it("expõe ações e carregamentos relevantes de modo acessível", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/MyAccountPage.tsx"), "utf8");

    expect(source).toContain('aria-label="Carregando dados da conta"');
    expect(source).toContain('aria-label="Carregando pedidos"');
    expect(source).toContain('aria-label="Cancelar alterações do perfil"');
    expect(source).toContain('aria-label={`Ver detalhes do pedido ${order.orderNumber}`}');
  });

  it("associa os rótulos aos campos editáveis do perfil e endereço", () => {
    const source = readFileSync(resolve(root, "client/src/pages/cliente/MyAccountPage.tsx"), "utf8");

    expect(source).toContain('htmlFor="profile-first-name"');
    expect(source).toContain('id="profile-first-name"');
    expect(source).toContain('htmlFor="profile-zip-code"');
    expect(source).toContain('id="profile-zip-code"');
    expect(source).toContain('htmlFor="profile-address-state"');
    expect(source).toContain('id="profile-address-state"');
  });
});
