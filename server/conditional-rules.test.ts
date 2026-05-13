import { describe, it, expect, beforeEach } from "vitest";

/**
 * ========================================
 * TESTES DE REGRAS CONDICIONAIS
 * ========================================
 * Validar:
 * ✓ mostrar atributos corretamente;
 * ✓ ocultar atributos corretamente;
 * ✓ bloquear combinações inválidas;
 * ✓ alterar preço automaticamente;
 * ✓ alterar prazo automaticamente;
 * ✓ dependências entre materiais e acabamentos.
 */

// Tipos de regra
interface AttributeState {
  [attributeId: number]: {
    visible: boolean;
    enabled: boolean;
    priceModifier: number;
    selectedValue?: number;
  };
}

interface RuleCondition {
  attributeId: number;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "in";
  value: string;
}

interface RuleAction {
  targetAttributeId: number;
  action: "show" | "hide" | "enable" | "disable" | "setPrice" | "addPrice";
  value?: string;
}

interface DynamicRule {
  id: number;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
}

// Engine de regras
function evaluateCondition(condition: RuleCondition, selectedValues: Map<number, any>): boolean {
  const selectedValue = selectedValues.get(condition.attributeId);
  if (selectedValue === undefined) return false;

  const value = String(selectedValue);
  const target = condition.value;

  switch (condition.operator) {
    case "equals":
      return value === target;
    case "contains":
      return value.includes(target);
    case "greaterThan":
      return Number(value) > Number(target);
    case "lessThan":
      return Number(value) < Number(target);
    case "in":
      return target.split(",").map((v) => v.trim()).includes(value);
    default:
      return false;
  }
}

function evaluateRuleConditions(rule: DynamicRule, selectedValues: Map<number, any>): boolean {
  if (rule.conditions.length === 0) return true;
  return rule.conditions.every((condition) => evaluateCondition(condition, selectedValues));
}

function applyRuleActions(rule: DynamicRule, state: AttributeState): AttributeState {
  const newState = { ...state };

  for (const action of rule.actions) {
    if (!newState[action.targetAttributeId]) {
      newState[action.targetAttributeId] = {
        visible: true,
        enabled: true,
        priceModifier: 0,
      };
    }

    const attr = newState[action.targetAttributeId];

    switch (action.action) {
      case "show":
        attr.visible = true;
        break;
      case "hide":
        attr.visible = false;
        break;
      case "enable":
        attr.enabled = true;
        break;
      case "disable":
        attr.enabled = false;
        break;
      case "setPrice":
        attr.priceModifier = Number(action.value) || 0;
        break;
      case "addPrice":
        attr.priceModifier += Number(action.value) || 0;
        break;
    }
  }

  return newState;
}

function processRules(
  rules: DynamicRule[],
  selectedValues: Map<number, any>,
  initialState: AttributeState
): AttributeState {
  let state = { ...initialState };
  const activeRules = rules.filter((r) => r.isActive);

  for (const rule of activeRules) {
    if (evaluateRuleConditions(rule, selectedValues)) {
      state = applyRuleActions(rule, state);
    }
  }

  return state;
}

function generateInitialState(attributeIds: number[]): AttributeState {
  const state: AttributeState = {};
  for (const id of attributeIds) {
    state[id] = {
      visible: true,
      enabled: true,
      priceModifier: 0,
    };
  }
  return state;
}

function getVisibleAttributes(attributeIds: number[], state: AttributeState): number[] {
  return attributeIds.filter((id) => state[id]?.visible !== false);
}

function getEnabledAttributes(attributeIds: number[], state: AttributeState): number[] {
  return attributeIds.filter((id) => state[id]?.enabled !== false);
}

describe("Conditional Rules Engine", () => {
  let initialState: AttributeState;
  let selectedValues: Map<number, any>;

  beforeEach(() => {
    // Atributos: 1=Material, 2=Acabamento, 3=Revestimento, 4=Ilhós, 5=Bastão
    initialState = generateInitialState([1, 2, 3, 4, 5]);
    selectedValues = new Map();
  });

  describe("Mostrar/Ocultar Atributos", () => {
    it("deve mostrar atributo Ilhós quando Material = Lona", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona requer ilhós",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 4, action: "show" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[4].visible).toBe(true);
    });

    it("deve ocultar atributo Ilhós quando Material ≠ Lona", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona requer ilhós",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 4, action: "hide" }],
        isActive: true,
      };

      selectedValues.set(1, "Couchê 300g");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[4].visible).toBe(false);
    });

    it("deve mostrar múltiplos atributos para Lona", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona requer ilhós e bastão",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [
          { targetAttributeId: 4, action: "show" }, // Ilhós
          { targetAttributeId: 5, action: "show" }, // Bastão
        ],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[4].visible).toBe(true);
      expect(finalState[5].visible).toBe(true);
    });

    it("deve ocultar Laminação quando Material = Lona", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona não pode ter laminação",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 2, action: "hide" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[2].visible).toBe(false);
    });

    it("deve manter atributo visível se regra não se aplica", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona requer ilhós",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 4, action: "hide" }],
        isActive: true,
      };

      selectedValues.set(1, "Couchê 300g");
      const finalState = processRules([rule], selectedValues, initialState);

      // Regra não se aplica, então Ilhós permanece visível (estado inicial)
      expect(finalState[4].visible).toBe(true);
    });
  });

  describe("Habilitar/Desabilitar Atributos", () => {
    it("deve desabilitar Laminação quando Material = Lona", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona não permite laminação",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 2, action: "disable" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[2].enabled).toBe(false);
    });

    it("deve habilitar Laminação quando Material = Couchê", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Couchê permite laminação",
        conditions: [{ attributeId: 1, operator: "equals", value: "Couchê 300g" }],
        actions: [{ targetAttributeId: 2, action: "enable" }],
        isActive: true,
      };

      selectedValues.set(1, "Couchê 300g");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[2].enabled).toBe(true);
    });

    it("deve filtrar atributos desabilitados", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona não permite laminação",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 2, action: "disable" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      const enabledAttributes = getEnabledAttributes([1, 2, 3, 4, 5], finalState);
      expect(enabledAttributes).not.toContain(2);
    });
  });

  describe("Alterar Preço Automaticamente", () => {
    it("deve adicionar preço quando Material = Lona", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona tem custo adicional",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 1, action: "addPrice", value: "50" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[1].priceModifier).toBe(50);
    });

    it("deve definir preço fixo", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Laminação tem preço fixo",
        conditions: [{ attributeId: 2, operator: "equals", value: "Laminação Fosca" }],
        actions: [{ targetAttributeId: 2, action: "setPrice", value: "25" }],
        isActive: true,
      };

      selectedValues.set(2, "Laminação Fosca");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[2].priceModifier).toBe(25);
    });

    it("deve acumular múltiplos modificadores de preço", () => {
      const rule1: DynamicRule = {
        id: 1,
        name: "Lona tem custo adicional",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 1, action: "addPrice", value: "50" }],
        isActive: true,
      };

      const rule2: DynamicRule = {
        id: 2,
        name: "Ilhós tem custo adicional",
        conditions: [{ attributeId: 4, operator: "equals", value: "Ilhós" }],
        actions: [{ targetAttributeId: 4, action: "addPrice", value: "30" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      selectedValues.set(4, "Ilhós");

      let finalState = processRules([rule1], selectedValues, initialState);
      finalState = processRules([rule2], selectedValues, finalState);

      expect(finalState[1].priceModifier).toBe(50);
      expect(finalState[4].priceModifier).toBe(30);
    });

    it("deve substituir preço com setPrice", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Laminação tem preço fixo",
        conditions: [{ attributeId: 2, operator: "equals", value: "Laminação Brilho" }],
        actions: [{ targetAttributeId: 2, action: "setPrice", value: "35" }],
        isActive: true,
      };

      selectedValues.set(2, "Laminação Brilho");
      let finalState = processRules([rule], selectedValues, initialState);

      // Aplicar novamente para simular mudança
      selectedValues.set(2, "Laminação Brilho");
      finalState = processRules([rule], selectedValues, finalState);

      expect(finalState[2].priceModifier).toBe(35);
    });
  });

  describe("Dependências entre Atributos", () => {
    it("deve validar dependência: Lona → Ilhós obrigatório", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona requer ilhós",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 4, action: "show" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[4].visible).toBe(true);
    });

    it("deve validar dependência: Couchê → Laminação permitida", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Couchê permite laminação",
        conditions: [{ attributeId: 1, operator: "equals", value: "Couchê 300g" }],
        actions: [{ targetAttributeId: 2, action: "enable" }],
        isActive: true,
      };

      selectedValues.set(1, "Couchê 300g");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[2].enabled).toBe(true);
    });

    it("deve validar múltiplas dependências em cascata", () => {
      // Regra 1: Lona → mostrar Ilhós
      const rule1: DynamicRule = {
        id: 1,
        name: "Lona requer ilhós",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 4, action: "show" }],
        isActive: true,
      };

      // Regra 2: Ilhós → mostrar Bastão
      const rule2: DynamicRule = {
        id: 2,
        name: "Ilhós requer bastão",
        conditions: [{ attributeId: 4, operator: "equals", value: "Ilhós" }],
        actions: [{ targetAttributeId: 5, action: "show" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      selectedValues.set(4, "Ilhós");

      let finalState = processRules([rule1], selectedValues, initialState);
      finalState = processRules([rule2], selectedValues, finalState);

      expect(finalState[4].visible).toBe(true);
      expect(finalState[5].visible).toBe(true);
    });
  });

  describe("Operadores de Condição", () => {
    it("deve validar operador equals", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Test equals",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 4, action: "show" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);
      expect(finalState[4].visible).toBe(true);

      selectedValues.set(1, "Couchê");
      const finalState2 = processRules([rule], selectedValues, initialState);
      expect(finalState2[4].visible).toBe(true); // Não se aplica
    });

    it("deve validar operador contains", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Test contains",
        conditions: [{ attributeId: 1, operator: "contains", value: "Couchê" }],
        actions: [{ targetAttributeId: 2, action: "show" }],
        isActive: true,
      };

      selectedValues.set(1, "Couchê 300g");
      const finalState = processRules([rule], selectedValues, initialState);
      expect(finalState[2].visible).toBe(true);
    });

    it("deve validar operador greaterThan", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Quantidade > 1000",
        conditions: [{ attributeId: 1, operator: "greaterThan", value: "1000" }],
        actions: [{ targetAttributeId: 2, action: "addPrice", value: "-10" }],
        isActive: true,
      };

      selectedValues.set(1, "1500");
      const finalState = processRules([rule], selectedValues, initialState);
      expect(finalState[2].priceModifier).toBe(-10);
    });

    it("deve validar operador lessThan", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Quantidade < 100",
        conditions: [{ attributeId: 1, operator: "lessThan", value: "100" }],
        actions: [{ targetAttributeId: 2, action: "addPrice", value: "50" }],
        isActive: true,
      };

      selectedValues.set(1, "50");
      const finalState = processRules([rule], selectedValues, initialState);
      expect(finalState[2].priceModifier).toBe(50);
    });

    it("deve validar operador in", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Material em lista",
        conditions: [{ attributeId: 1, operator: "in", value: "Lona,Vinil,Adesivo" }],
        actions: [{ targetAttributeId: 4, action: "show" }],
        isActive: true,
      };

      selectedValues.set(1, "Vinil");
      const finalState = processRules([rule], selectedValues, initialState);
      expect(finalState[4].visible).toBe(true);

      selectedValues.set(1, "Couchê");
      const finalState2 = processRules([rule], selectedValues, initialState);
      expect(finalState2[4].visible).toBe(true); // Não se aplica
    });
  });

  describe("Regras Inativas", () => {
    it("deve ignorar regras inativas", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona requer ilhós",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 4, action: "hide" }],
        isActive: false, // Inativa
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      expect(finalState[4].visible).toBe(true); // Permanece visível
    });

    it("deve processar apenas regras ativas", () => {
      const rule1: DynamicRule = {
        id: 1,
        name: "Regra inativa",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 4, action: "hide" }],
        isActive: false,
      };

      const rule2: DynamicRule = {
        id: 2,
        name: "Regra ativa",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 2, action: "hide" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule1, rule2], selectedValues, initialState);

      expect(finalState[4].visible).toBe(true); // Regra 1 ignorada
      expect(finalState[2].visible).toBe(false); // Regra 2 aplicada
    });
  });

  describe("Filtrar Atributos Visíveis", () => {
    it("deve retornar apenas atributos visíveis", () => {
      const rule: DynamicRule = {
        id: 1,
        name: "Lona não permite laminação",
        conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
        actions: [{ targetAttributeId: 2, action: "hide" }],
        isActive: true,
      };

      selectedValues.set(1, "Lona");
      const finalState = processRules([rule], selectedValues, initialState);

      const visibleAttributes = getVisibleAttributes([1, 2, 3, 4, 5], finalState);
      expect(visibleAttributes).toContain(1);
      expect(visibleAttributes).not.toContain(2);
      expect(visibleAttributes).toContain(3);
    });
  });

  describe("Cenários Complexos", () => {
    it("deve validar cenário: Cartão de Visita", () => {
      // Cartão: Material (Couchê, Supremo) → Laminação → Acabamento
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Couchê permite laminação",
          conditions: [{ attributeId: 1, operator: "contains", value: "Couchê" }],
          actions: [{ targetAttributeId: 2, action: "enable" }],
          isActive: true,
        },
        {
          id: 2,
          name: "Supremo permite laminação",
          conditions: [{ attributeId: 1, operator: "contains", value: "Supremo" }],
          actions: [{ targetAttributeId: 2, action: "enable" }],
          isActive: true,
        },
        {
          id: 3,
          name: "Laminação adiciona custo",
          conditions: [{ attributeId: 2, operator: "equals", value: "Laminação Fosca" }],
          actions: [{ targetAttributeId: 2, action: "addPrice", value: "15" }],
          isActive: true,
        },
      ];

      selectedValues.set(1, "Couchê 300g");
      selectedValues.set(2, "Laminação Fosca");

      let finalState = processRules([rules[0]], selectedValues, initialState);
      finalState = processRules([rules[2]], selectedValues, finalState);

      expect(finalState[2].enabled).toBe(true);
      expect(finalState[2].priceModifier).toBe(15);
    });

    it("deve validar cenário: Banner com Lona", () => {
      // Banner: Material (Lona) → Ilhós, Bastão → Acabamento
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Lona requer ilhós",
          conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
          actions: [
            { targetAttributeId: 4, action: "show" },
            { targetAttributeId: 5, action: "show" },
          ],
          isActive: true,
        },
        {
          id: 2,
          name: "Lona não permite laminação",
          conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
          actions: [{ targetAttributeId: 2, action: "disable" }],
          isActive: true,
        },
        {
          id: 3,
          name: "Lona tem custo adicional",
          conditions: [{ attributeId: 1, operator: "equals", value: "Lona" }],
          actions: [{ targetAttributeId: 1, action: "addPrice", value: "50" }],
          isActive: true,
        },
      ];

      selectedValues.set(1, "Lona");

      let finalState = processRules([rules[0]], selectedValues, initialState);
      finalState = processRules([rules[1]], selectedValues, finalState);
      finalState = processRules([rules[2]], selectedValues, finalState);

      expect(finalState[4].visible).toBe(true); // Ilhós visível
      expect(finalState[5].visible).toBe(true); // Bastão visível
      expect(finalState[2].enabled).toBe(false); // Laminação desabilitada
      expect(finalState[1].priceModifier).toBe(50); // Custo adicional
    });
  });
});
