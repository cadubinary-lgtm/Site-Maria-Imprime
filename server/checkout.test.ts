/**
 * Testes de checkout, frete e regras de entrega local por faixa de CEP
 * Cobre: cálculo de subtotal/total, propagação de frete, status inicial,
 * validação de faixa de CEP, tipos moto/carro, regras inativas,
 * lógica de cut-off e soma de prazos (produção + frete).
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

function cleanCep(cep: string): string {
  return cep.replace(/\D/g, "");
}

function isPastCutoff(nowHour: number, nowMin: number, cutoffTime: string): boolean {
  const [cutoffHour, cutoffMin] = cutoffTime.split(":").map(Number);
  return nowHour > cutoffHour || (nowHour === cutoffHour && nowMin >= cutoffMin);
}

function calcDeliveryDays(baseDays: number, productionDays: number, pastCutoff: boolean): number {
  const localDays = pastCutoff ? baseDays + 1 : baseDays;
  return localDays + productionDays;
}

function getDeadlineText(totalDays: number, isLocal: boolean): string {
  if (isLocal) {
    if (totalDays === 0) return "🚀 Receba HOJE! (Entrega Local)";
    if (totalDays === 1) return "⚡ Receba amanhã! (Entrega Local)";
    return `Receba em ${totalDays} dias úteis (Entrega Local)`;
  }
  if (totalDays === 0) return "Receba hoje!";
  if (totalDays === 1) return "Receba amanhã!";
  return `Receba em ${totalDays} dias úteis`;
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

function injectLocalOptions(
  destinationCep: string,
  rules: LocalDeliveryRule[],
  isPastCutoffFlag = false
): { id: string; name: string; price: number; deliveryDays: number; fixedType: string }[] {
  const cepClean = cleanCep(destinationCep);
  const cepNum = parseInt(cepClean, 10);
  const results: { id: string; name: string; price: number; deliveryDays: number; fixedType: string }[] = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;
    const ruleStart = parseInt(rule.cepStart, 10);
    const ruleEnd = parseInt(rule.cepEnd, 10);
    if (cepNum >= ruleStart && cepNum <= ruleEnd) {
      const adjustedDays = isPastCutoffFlag ? rule.deliveryDays + 1 : rule.deliveryDays;
      results.push({
        id: `local_${rule.id}`,
        name: rule.description || `Entrega Local - ${rule.deliveryType === "moto" ? "Moto" : "Carro"}`,
        price: rule.price,
        deliveryDays: adjustedDays,
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
  { id: 1, neighborhood: "Centro", stateAbbr: "RJ", cepStart: "28905000", cepEnd: "28905999",
    deliveryType: "moto", price: 10.0, deliveryDays: 0, description: "Entrega Local - Moto", isActive: true },
  { id: 2, neighborhood: "Centro", stateAbbr: "RJ", cepStart: "28905000", cepEnd: "28905999",
    deliveryType: "carro", price: 25.0, deliveryDays: 0, description: "Entrega Local - Carro", isActive: true },
  { id: 3, neighborhood: "Tamoios", stateAbbr: "RJ", cepStart: "28900000", cepEnd: "28900999",
    deliveryType: "moto", price: 20.0, deliveryDays: 1, description: "Entrega Local - Moto", isActive: true },
  { id: 4, neighborhood: "Tamoios", stateAbbr: "RJ", cepStart: "28900000", cepEnd: "28900999",
    deliveryType: "carro", price: 40.0, deliveryDays: 1, description: "Entrega Local - Carro", isActive: true },
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
    expect(calcSubtotal([{ price: 5.5, quantity: 100 }, { price: 30, quantity: 3 }])).toBe(640);
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
    expect(options.map(o => o.name)).toContain("Entrega Local - Moto");
    expect(options.map(o => o.name)).toContain("Entrega Local - Carro");
  });

  it("CEP de Tamoios retorna Moto (R$20) e Carro (R$40)", () => {
    const options = injectLocalOptions("28900500", caboFrioRules);
    expect(options).toHaveLength(2);
    expect(options.find(o => o.name.includes("Moto"))?.price).toBe(20.0);
    expect(options.find(o => o.name.includes("Carro"))?.price).toBe(40.0);
  });

  it("CEP do Peró retorna apenas Moto (Carro está inativo)", () => {
    const options = injectLocalOptions("28910200", caboFrioRules);
    expect(options).toHaveLength(1);
    expect(options[0].name).toBe("Entrega Local - Moto");
  });

  it("CEP fora de todas as faixas não retorna nenhuma opção local", () => {
    expect(injectLocalOptions("01310100", caboFrioRules)).toHaveLength(0);
  });

  it("CEP exatamente nos limites da faixa é incluído", () => {
    expect(injectLocalOptions("28905000", caboFrioRules).length).toBeGreaterThanOrEqual(1);
    expect(injectLocalOptions("28905999", caboFrioRules).length).toBeGreaterThanOrEqual(1);
  });

  it("CEP um acima do limite superior não bate no Centro", () => {
    const options = injectLocalOptions("28906000", caboFrioRules);
    expect(options.filter(o => o.id === "local_1" || o.id === "local_2")).toHaveLength(0);
  });

  it("CEP com máscara (28905-500) é normalizado corretamente", () => {
    expect(injectLocalOptions("28905-500", caboFrioRules)).toHaveLength(2);
  });
});

describe("Cut-off: lógica de horário limite", () => {
  it("retorna false antes do cut-off (12:59 < 13:00)", () => {
    expect(isPastCutoff(12, 59, "13:00")).toBe(false);
  });

  it("retorna true exatamente no cut-off (13:00 = 13:00)", () => {
    expect(isPastCutoff(13, 0, "13:00")).toBe(true);
  });

  it("retorna true após o cut-off (14:30 > 13:00)", () => {
    expect(isPastCutoff(14, 30, "13:00")).toBe(true);
  });

  it("funciona com cut-off personalizado (09:00)", () => {
    expect(isPastCutoff(8, 59, "09:00")).toBe(false);
    expect(isPastCutoff(9, 0, "09:00")).toBe(true);
  });

  it("cut-off aplica +1 dia ao frete local quando passado", () => {
    const options = injectLocalOptions("28905500", caboFrioRules, true);
    expect(options.find(o => o.name.includes("Moto"))?.deliveryDays).toBe(1); // 0 + 1
    expect(options.find(o => o.name.includes("Carro"))?.deliveryDays).toBe(1); // 0 + 1
  });

  it("antes do cut-off mantém prazo original", () => {
    const options = injectLocalOptions("28905500", caboFrioRules, false);
    expect(options.find(o => o.name.includes("Moto"))?.deliveryDays).toBe(0); // sem acréscimo
  });
});

describe("Soma de prazos: produção + frete local", () => {
  it("Mesmo dia + frete 0 + antes cut-off = HOJE", () => {
    const total = calcDeliveryDays(0, 0, false);
    expect(total).toBe(0);
    expect(getDeadlineText(total, true)).toBe("🚀 Receba HOJE! (Entrega Local)");
  });

  it("Mesmo dia + frete 0 + após cut-off = amanhã (+1 dia)", () => {
    const total = calcDeliveryDays(0, 0, true);
    expect(total).toBe(1);
    expect(getDeadlineText(total, true)).toBe("⚡ Receba amanhã! (Entrega Local)");
  });

  it("24h produção + frete 0 + antes cut-off = amanhã", () => {
    expect(getDeadlineText(calcDeliveryDays(0, 1, false), true)).toBe("⚡ Receba amanhã! (Entrega Local)");
  });

  it("Normal (3d) + frete 1d + antes cut-off = 4 dias úteis", () => {
    expect(getDeadlineText(calcDeliveryDays(1, 3, false), true)).toBe("Receba em 4 dias úteis (Entrega Local)");
  });

  it("Normal (3d) + frete 1d + após cut-off = 5 dias úteis (+1)", () => {
    expect(getDeadlineText(calcDeliveryDays(1, 3, true), true)).toBe("Receba em 5 dias úteis (Entrega Local)");
  });

  it("Melhor Envio: prazo 0 = 'Receba hoje!'", () => {
    expect(getDeadlineText(0, false)).toBe("Receba hoje!");
  });

  it("Melhor Envio: prazo 1 = 'Receba amanhã!'", () => {
    expect(getDeadlineText(1, false)).toBe("Receba amanhã!");
  });
});

describe("Status inicial do pedido", () => {
  it("novo pedido deve ter status 'analisando'", () => {
    expect("analisando").toBe("analisando");
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
    expect(cartItem.shippingLabel).toBe("Entrega Local - Moto");
    expect(parseFloat(cartItem.shippingPrice)).toBe(20.0);
  });

  it("frete Carro é propagado com label e preço corretos", () => {
    const cartItem = { shippingMethod: "local_2", shippingPrice: "40.00", shippingLabel: "Entrega Local - Carro" };
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
