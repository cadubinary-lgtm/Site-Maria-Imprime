import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerPath = resolve(process.cwd(), "server/routers.ts");
const dbPath = resolve(process.cwd(), "server/db.ts");
const cartPagePath = resolve(process.cwd(), "client/src/pages/ecommerce/CartPage.tsx");

describe("recálculo de frete por quantidade", () => {
  it("refaz a cotação somente para o serviço de frete selecionado", () => {
    const source = readFileSync(routerPath, "utf8");
    const updateStart = source.indexOf("updateQuantity: publicProcedure");
    const updateEnd = source.indexOf("removeItem: publicProcedure", updateStart);
    const updateSource = source.slice(updateStart, updateEnd);

    expect(updateSource).toContain("const targetMethod = String(cartRow.shippingMethod)");
    expect(updateSource).toContain("services: targetMethod");
    expect(updateSource).toContain("shippingRecalculated: newShippingPrice !== null");
    expect(updateSource).toContain("updateCartItemQuantity(input.id, userId, input.quantity, sessionId, newShippingPrice)");
  });

  it("faz o item com quantidade alterada determinar o frete exibido no resumo", () => {
    const source = readFileSync(dbPath, "utf8");

    expect(source.match(/ORDER BY ci\.updatedAt DESC, ci\.id DESC/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("atualiza a mensagem do carrinho a partir da confirmação do servidor", () => {
    const source = readFileSync(cartPagePath, "utf8");

    expect(source).toContain("onSuccess: async (result, variables)");
    expect(source).toContain("result.shippingRecalculated");
    expect(source).toContain("Quantidade e frete atualizados!");
  });
});
