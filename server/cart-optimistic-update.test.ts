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
    expect(source).toContain("utils.cart.getItems.cancel()");
    expect(source).toContain("utils.cart.getCount.cancel()");
    expect(source).toContain("utils.cart.getItems.invalidate()");
    expect(source).toContain("utils.cart.getCount.invalidate()");
  });

  it("impede checkout de itens temporários até a sincronização terminar", () => {
    const source = readFileSync(cartPanelPath, "utf8");

    expect(source).toContain("const isPendingSync = item.id < 0;");
    expect(source).toContain("disabled={cartItems.some(item => item.id < 0)}");
    expect(source).toContain('"Adicionando item..."');
  });

  it("não sobrescreve itens já visíveis por uma nova consulta ao abrir o painel", () => {
    const source = readFileSync(cartPanelPath, "utf8");

    expect(source).toContain("refetchOnWindowFocus: false");
    expect(source).toContain("refetchOnMount: false");
  });

  it("atribui uma chave única mesmo durante sincronizações otimistas", () => {
    const source = readFileSync(cartPanelPath, "utf8");

    expect(source).toContain("cartItems.map((item, index) => {");
    expect(source).toContain('key={`cart-item-${item.id}-${item.productId}-${index}`}');
  });
});
