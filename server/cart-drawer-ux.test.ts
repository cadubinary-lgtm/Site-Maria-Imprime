import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Experiência do carrinho lateral", () => {
  it("oferece feedback de remoção e atalhos de compra no painel exibido ao cliente", () => {
    const drawer = readFileSync(resolve(root, "client/src/components/CartSidePanel.tsx"), "utf8");

    expect(drawer).toContain('toast.success("Produto removido do carrinho."');
    expect(drawer).toContain('id: "cart-item-removed"');
    expect(drawer).toContain("Continuar comprando");
    expect(drawer).toContain('setLocation("/carrinho")');
    expect(drawer).toContain('onClick={closeCart}');
    expect(drawer).toContain("grid grid-cols-2 gap-3");
  });

  it("mantém ações de quantidade e remoção acessíveis enquanto atualiza o carrinho", () => {
    const drawer = readFileSync(resolve(root, "client/src/components/CartSidePanel.tsx"), "utf8");

    expect(drawer).toContain("aria-label={`Remover ${item.productName} do carrinho`}");
    expect(drawer).toContain("aria-label={`Diminuir quantidade de ${item.productName}`}");
    expect(drawer).toContain("aria-label={`Aumentar quantidade de ${item.productName}`}");
    expect(drawer).toContain("disabled={isUpdating}");
    expect(drawer).toContain("setUpdatingId(id)");
  });
});
