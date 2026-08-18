import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Experiência do carrinho completo", () => {
  it("protege a limpeza de todos os itens com confirmação explícita", () => {
    const page = readFileSync(resolve(root, "client/src/pages/ecommerce/CartPage.tsx"), "utf8");

    expect(page).toContain("Limpar todo o carrinho?");
    expect(page).toContain("AlertDialogTrigger asChild");
    expect(page).toContain('onClick={() => clearCart.mutate()}');
    expect(page).toContain("Esta ação removerá todos os itens adicionados.");
  });

  it("mantém controles de item acessíveis e ações principais na identidade rosa", () => {
    const page = readFileSync(resolve(root, "client/src/pages/ecommerce/CartPage.tsx"), "utf8");

    expect(page).toContain("aria-label={`Remover ${item.productName} do carrinho`}");
    expect(page).toContain("aria-label={`Diminuir quantidade de ${item.productName}`}");
    expect(page).toContain("aria-label={`Aumentar quantidade de ${item.productName}`}");
    expect(page).toContain("bg-pink-600 hover:bg-pink-700");
    expect(page).toContain("Ambiente protegido — navegação segura e proteção dos seus dados.");
  });
});
