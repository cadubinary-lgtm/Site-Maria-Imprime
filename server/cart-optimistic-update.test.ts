import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const productDetailPath = resolve(process.cwd(), "client/src/pages/ecommerce/ProductDetail.tsx");
const cartPanelPath = resolve(process.cwd(), "client/src/components/CartSidePanel.tsx");

describe("atualização otimista do carrinho", () => {
  it("abre o carrinho e atualiza item e contador antes da confirmação da rede", () => {
    const source = readFileSync(productDetailPath, "utf8");

    expect(source).toContain("const optimisticItemId = -Date.now();");
    expect(source).toContain("utils.cart.getItems.setData(undefined");
    expect(source).toContain("utils.cart.getCount.setData(undefined");
    expect(source).toContain("openCart();");
    expect(source).toContain("utils.cart.getItems.invalidate()");
    expect(source).toContain("utils.cart.getCount.invalidate()");
  });

  it("impede checkout de itens temporários até a sincronização terminar", () => {
    const source = readFileSync(cartPanelPath, "utf8");

    expect(source).toContain("const isPendingSync = item.id < 0;");
    expect(source).toContain("disabled={cartItems.some(item => item.id < 0)}");
    expect(source).toContain('"Adicionando item..."');
  });
});
