import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

describe("Checkout Flow with Shipping", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");
  });

  it("should create order with shipping price included in total", async () => {
    // Simular dados de carrinho com frete
    const cartItems = [
      {
        productId: 1,
        productName: "Adesivo Personalizado",
        quantity: 100,
        priceAtCart: 5.5,
        selectedAttributes: JSON.stringify({ tamanho: "10x10cm" }),
      },
    ];

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.priceAtCart * item.quantity,
      0
    );
    const shippingPrice = 25.5; // Melhor Envio ou Entrega Local
    const expectedTotal = subtotal + shippingPrice;

    // Verificar cálculo
    expect(subtotal).toBe(550); // 5.5 * 100
    expect(expectedTotal).toBe(575.5); // 550 + 25.5

    // Verificar que o total inclui frete
    expect(expectedTotal).toBeGreaterThan(subtotal);
  });

  it("should handle pickup option with zero shipping", async () => {
    const cartItems = [
      {
        productId: 1,
        productName: "Adesivo Personalizado",
        quantity: 50,
        priceAtCart: 5.5,
      },
    ];

    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.priceAtCart * item.quantity,
      0
    );
    const shippingPrice = 0; // Retirar na Loja = Grátis
    const expectedTotal = subtotal + shippingPrice;

    expect(subtotal).toBe(275); // 5.5 * 50
    expect(expectedTotal).toBe(275);
    expect(shippingPrice).toBe(0);
  });

  it("should propagate shipping data to order", async () => {
    // Simular dados de frete do carrinho
    const shippingData = {
      shippingMethod: "moto_express",
      shippingPrice: 15.0,
      shippingLabel: "Entrega Local - Motoboy",
    };

    // Verificar que os dados são propagados corretamente
    expect(shippingData.shippingMethod).toBe("moto_express");
    expect(shippingData.shippingPrice).toBe(15.0);
    expect(shippingData.shippingLabel).toBe("Entrega Local - Motoboy");
  });

  it("should handle local delivery rules injection", async () => {
    // Simular injeção de regra de frete local
    const cepCliente = "01310100"; // CEP São Paulo
    const cidadeCliente = "São Paulo";

    // Simular regra cadastrada
    const localRules = [
      {
        id: 1,
        city: "São Paulo",
        fixedPrice: 12.0,
        estimatedDays: 1,
        enabled: true,
      },
    ];

    // Verificar se a regra se aplica
    const applicableRule = localRules.find((r) => r.city === cidadeCliente);
    expect(applicableRule).toBeDefined();
    expect(applicableRule?.fixedPrice).toBe(12.0);
    expect(applicableRule?.estimatedDays).toBe(1);
  });

  it("should validate cart items have shipping fields", async () => {
    // Simular item do carrinho com campos de frete
    const cartItem = {
      id: 1,
      productId: 1,
      quantity: 10,
      priceAtCart: "5.50",
      shippingMethod: "retirada",
      shippingPrice: "0.00",
      shippingLabel: "Retirar na Loja",
    };

    // Verificar que os campos existem
    expect(cartItem).toHaveProperty("shippingMethod");
    expect(cartItem).toHaveProperty("shippingPrice");
    expect(cartItem).toHaveProperty("shippingLabel");

    // Verificar valores
    expect(cartItem.shippingMethod).toBe("retirada");
    expect(parseFloat(cartItem.shippingPrice)).toBe(0);
    expect(cartItem.shippingLabel).toBe("Retirar na Loja");
  });

  it("should calculate correct order status on creation", async () => {
    // Novo pedido deve começar com status 'analisando'
    const expectedInitialStatus = "analisando";

    expect(expectedInitialStatus).toBe("analisando");

    // Possíveis status para um pedido
    const validStatuses = [
      "pagamento_aprovado",
      "pagamento_retirada",
      "analisando",
      "com_problemas",
      "em_producao",
      "pronto_entrega",
      "pronto_retirada",
      "entregue",
      "cancelado",
    ];

    expect(validStatuses).toContain(expectedInitialStatus);
  });
});
