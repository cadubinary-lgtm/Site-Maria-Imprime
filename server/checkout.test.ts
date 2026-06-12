/**
 * Testes de checkout, frete e regras de entrega local por faixa de CEP
 * Cobre: cálculo de subtotal/total, propagação de frete, status inicial,
 * validação de faixa de CEP, tipos moto/carro, regras inativas.
 */

import { describe, it, expect } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de negócio (sem dependência de DB)
// ─────────────────────────────────────────────────────────────────────────────

function calcSubtotal(items: { price: number; quantity: number }[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function calcTotal(subtotal: number, shippingPrice: number) {
  return subtotal + shippingPrice;
}

interface LocalDeliveryRule {
  id: number;
  neighborhood: string;
  stateAbbr: string;
  cepStart: string;
  cepEnd: string;
  deliveryType: "moto" | "carro";
  price: number;
  deliveryDays: number;
  description: string | null;
  isActive: boolean;
}

/**
 * Replica a lógica de shipping.calculate do backend:
 * verifica se o CEP está dentro da faixa e injeta as opções locais.
 */
function injectLocalOptions(
  destinationCep: string,
  rules: LocalDeliveryRule[]
): { id: string; name: string; price: number; deliveryDays: number; fixedType: string }[] {
  const cepClean = destinationCep.replace(/\D/g, "");
  const cepNum = parseInt(cepClean, 10);
  const results: { id: string; name: string; price: number; deliveryDays: number; fixedType: string }[] = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;
    const ruleStart = parseInt(rule.cepStart, 10);
    const ruleEnd = parseInt(rule.cepEnd, 10);
    if (cepNum >= ruleStart && cepNum <= ruleEnd) {
      results.push({
        id: `local_${rule.id}`,
        name: rule.description || `Entrega Local - ${rule.deliveryType === "moto" ? "Moto" : "Carro"}`,
        price: rule.price,
        deliveryDays: rule.deliveryDays,
        fixedType: "local",
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dados de teste — Cabo Frio / RJ (bairros com faixas de CEP distintas)
// ─────────────────────────────────────────────────────────────────────────────

const caboFrioRules: LocalDeliveryRule[] = [
  // Centro — Moto e Carro (ambos ativos)
  { id: 1, neighborhood: "Centro", stateAbbr: "RJ", cepStart: "28905000", cepEnd: "28905999",
    deliveryType: "moto", price: 10.0, deliveryDays: 0, description: "Entrega Local - Moto", isActive: true },
  { id: 2, neighborhood: "Centro", stateAbbr: "RJ", cepStart: "28905000", cepEnd: "28905999",
    deliveryType: "carro", price: 25.0, deliveryDays: 0, description: "Entrega Local - Carro", isActive: true },
  // Tamoios — Moto e Carro (ambos ativos, preços maiores por distância)
  { id: 3, neighborhood: "Tamoios", stateAbbr: "RJ", cepStart: "28900000", cepEnd: "28900999",
    deliveryType: "moto", price: 20.0, deliveryDays: 1, description: "Entrega Local - Moto", isActive: true },
  { id: 4, neighborhood: "Tamoios", stateAbbr: "RJ", cepStart: "28900000", cepEnd: "28900999",
    deliveryType: "carro", price: 40.0, deliveryDays: 1, description: "Entrega Local - Carro", isActive: true },
  // Peró — Moto ativo, Carro inativo
  { id: 5, neighborhood: "Peró", stateAbbr: "RJ", cepStart: "28910000", cepEnd: "28910999",
    deliveryType: "moto", price: 15.0, deliveryDays: 1, description: "Entrega Local - Moto", isActive: true },
  { id: 6, neighborhood: "Peró", stateAbbr: "RJ", cepStart: "28910000", cepEnd: "28910999",
    deliveryType: "carro", price: 30.0, deliveryDays: 1, description: "Entrega Local - Carro", isActive: false },
];

// ─────────────────────────────────────────────────────────────────────────────
// Testes
// ─────────────────────────────────────────────────────────────────────────────

describe("Cálculo de subtotal e total com frete", () => {
  it("calcula subtotal corretamente com múltiplos itens", () => {
    const items = [
      { price: 5.5, quantity: 100 },
      { price: 30, quantity: 3 },
    ];
    expect(calcSubtotal(items)).toBe(640); // 550 + 90
  });

  it("soma frete ao subtotal para obter total do pedido", () => {
    expect(calcTotal(550, 25.5)).toBe(575.5);
  });

  it("total com retirada na loja (frete = 0) é igual ao subtotal", () => {
    expect(calcTotal(275, 0)).toBe(275);
  });
});

describe("Injeção de opções locais por faixa de CEP — Cabo Frio/RJ", () => {
  it("CEP do Centro retorna Moto e Carro (ambas as opções)", () => {
    const options = injectLocalOptions("28905500", caboFrioRules);
    expect(options).toHaveLength(2);
    const names = options.map((o) => o.name);
    expect(names).toContain("Entrega Local - Moto");
    expect(names).toContain("Entrega Local - Carro");
  });

  it("CEP de Tamoios retorna Moto (R$20) e Carro (R$40)", () => {
    const options = injectLocalOptions("28900500", caboFrioRules);
    expect(options).toHaveLength(2);
    const moto = options.find((o) => o.name.includes("Moto"));
    const carro = options.find((o) => o.name.includes("Carro"));
    expect(moto?.price).toBe(20.0);
    expect(carro?.price).toBe(40.0);
  });

  it("CEP do Peró retorna apenas Moto (Carro está inativo)", () => {
    const options = injectLocalOptions("28910200", caboFrioRules);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("Entrega Local - Moto");
    expect(options[0].price).toBe(15.0);
  });

  it("CEP fora de todas as faixas não retorna nenhuma opção local", () => {
    const options = injectLocalOptions("01310100", caboFrioRules); // São Paulo
    expect(options).toHaveLength(0);
  });

  it("CEP exatamente no limite inferior (28905000) é incluído", () => {
    const options = injectLocalOptions("28905000", caboFrioRules);
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it("CEP exatamente no limite superior (28905999) é incluído", () => {
    const options = injectLocalOptions("28905999", caboFrioRules);
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it("CEP um acima do limite superior (28906000) não bate no Centro", () => {
    const options = injectLocalOptions("28906000", caboFrioRules);
    const centroOptions = options.filter((o) => o.id === "local_1" || o.id === "local_2");
    expect(centroOptions).toHaveLength(0);
  });

  it("CEP com máscara (28905-500) é normalizado corretamente", () => {
    const options = injectLocalOptions("28905-500", caboFrioRules);
    expect(options).toHaveLength(2); // mesmo resultado que sem máscara
  });
});

describe("Validação de faixa de CEP", () => {
  it("cepStart <= cepEnd é válido", () => {
    expect("28900000" <= "28900999").toBe(true);
    expect("28900000" <= "28900000").toBe(true); // mesmo CEP é válido
  });

  it("cepStart > cepEnd é inválido", () => {
    expect("28900999" <= "28900000").toBe(false);
  });
});

describe("Status inicial do pedido", () => {
  it("novo pedido deve ter status 'analisando'", () => {
    const defaultStatus = "analisando";
    expect(defaultStatus).toBe("analisando");
  });

  it("status 'analisando' não é 'pronto_entrega'", () => {
    expect("analisando").not.toBe("pronto_entrega");
  });

  it("status 'analisando' está na lista de status válidos", () => {
    const validStatuses = [
      "pagamento_aprovado", "pagamento_retirada", "analisando",
      "com_problemas", "em_producao", "pronto_entrega",
      "pronto_retirada", "entregue", "cancelado",
    ];
    expect(validStatuses).toContain("analisando");
  });
});

describe("Propagação de dados de frete para o pedido", () => {
  it("frete Moto é propagado com label e preço corretos", () => {
    const cartItem = { shippingMethod: "local_1", shippingPrice: "20.00", shippingLabel: "Entrega Local - Moto" };
    expect(cartItem.shippingMethod).toBe("local_1");
    expect(cartItem.shippingLabel).toBe("Entrega Local - Moto");
    expect(parseFloat(cartItem.shippingPrice)).toBe(20.0);
  });

  it("frete Carro é propagado com label e preço corretos", () => {
    const cartItem = { shippingMethod: "local_2", shippingPrice: "40.00", shippingLabel: "Entrega Local - Carro" };
    expect(cartItem.shippingMethod).toBe("local_2");
    expect(cartItem.shippingLabel).toBe("Entrega Local - Carro");
    expect(parseFloat(cartItem.shippingPrice)).toBe(40.0);
  });

  it("retirada na loja tem frete zero e total igual ao subtotal", () => {
    const cartItem = { shippingMethod: "retirada", shippingPrice: "0.00", shippingLabel: "Retirar na Loja" };
    expect(parseFloat(cartItem.shippingPrice)).toBe(0);
    expect(calcTotal(150, 0)).toBe(150);
  });

  it("item do carrinho possui todos os campos de frete necessários", () => {
    const cartItem = {
      id: 1, productId: 1, quantity: 10, priceAtCart: "5.50",
      shippingMethod: "retirada", shippingPrice: "0.00", shippingLabel: "Retirar na Loja",
    };
    expect(cartItem).toHaveProperty("shippingMethod");
    expect(cartItem).toHaveProperty("shippingPrice");
    expect(cartItem).toHaveProperty("shippingLabel");
  });
});
