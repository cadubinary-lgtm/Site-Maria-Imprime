/**
 * ========================================
 * TESTES DE INTEGRAÇÃO: SISTEMA GLOBAL DE ATRIBUTOS
 * ========================================
 * Validar:
 * ✓ Atributos globais estão disponíveis para todos os produtos
 * ✓ Regras dinâmicas ocultam/mostram atributos corretamente
 * ✓ Compatibilidade por categoria (Lona, Folheto, Adesivo, Placa)
 * ✓ Engine de regras processa corretamente
 */

import { describe, it, expect, beforeEach } from "vitest";

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

// IDs dos atributos do banco de dados
const MATERIAL_ID = 30001;
const ACABAMENTO_ID = 30002;
const ILHOS_ID = 62;
const BASTAO_ID = 64;
const LAMINACAO_ID = 30004;
const DOBRA_ID = 30005;

// IDs dos produtos
const LONA_ID = 840001;
const FOLHETO_ID = 840002;
const ADESIVO_ID = 840003;
const PLACA_ID = 840004;

describe("Global Attributes Integration System", () => {
  let initialState: AttributeState;
  let selectedValues: Map<number, any>;

  beforeEach(() => {
    // Atributos: Material, Acabamento, Ilhós, Bastão, Laminação, Dobra
    initialState = generateInitialState([
      MATERIAL_ID,
      ACABAMENTO_ID,
      ILHOS_ID,
      BASTAO_ID,
      LAMINACAO_ID,
      DOBRA_ID,
    ]);
    selectedValues = new Map();
  });

  describe("LONA - Regras de Compatibilidade", () => {
    it("deve mostrar Ilhós e Bastão quando Material = Lona 280g", () => {
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Lona requer Ilhós e Bastão",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Lona 280g" }],
          actions: [
            { targetAttributeId: ILHOS_ID, action: "show" },
            { targetAttributeId: BASTAO_ID, action: "show" },
          ],
          isActive: true,
        },
      ];

      selectedValues.set(MATERIAL_ID, "Lona 280g");
      const finalState = processRules(rules, selectedValues, initialState);

      expect(finalState[ILHOS_ID].visible).toBe(true);
      expect(finalState[BASTAO_ID].visible).toBe(true);
    });

    it("deve ocultar Laminação e Dobra quando Material = Lona 280g", () => {
      const rules: DynamicRule[] = [
        {
          id: 2,
          name: "Lona não permite Laminação ou Dobra",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Lona 280g" }],
          actions: [
            { targetAttributeId: LAMINACAO_ID, action: "hide" },
            { targetAttributeId: DOBRA_ID, action: "hide" },
          ],
          isActive: true,
        },
      ];

      selectedValues.set(MATERIAL_ID, "Lona 280g");
      const finalState = processRules(rules, selectedValues, initialState);

      expect(finalState[LAMINACAO_ID].visible).toBe(false);
      expect(finalState[DOBRA_ID].visible).toBe(false);
    });

    it("deve manter Laminação e Dobra visíveis quando Material ≠ Lona", () => {
      const rules: DynamicRule[] = [
        {
          id: 2,
          name: "Lona não permite Laminação ou Dobra",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Lona 280g" }],
          actions: [
            { targetAttributeId: LAMINACAO_ID, action: "hide" },
            { targetAttributeId: DOBRA_ID, action: "hide" },
          ],
          isActive: true,
        },
      ];

      selectedValues.set(MATERIAL_ID, "Papel Couchê 300g");
      const finalState = processRules(rules, selectedValues, initialState);

      // Regra não se aplica, então Laminação e Dobra permanecem visíveis
      expect(finalState[LAMINACAO_ID].visible).toBe(true);
      expect(finalState[DOBRA_ID].visible).toBe(true);
    });

    it("deve retornar apenas atributos visíveis para Lona", () => {
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Lona requer Ilhós e Bastão",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Lona 280g" }],
          actions: [
            { targetAttributeId: ILHOS_ID, action: "show" },
            { targetAttributeId: BASTAO_ID, action: "show" },
          ],
          isActive: true,
        },
        {
          id: 2,
          name: "Lona não permite Laminação ou Dobra",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Lona 280g" }],
          actions: [
            { targetAttributeId: LAMINACAO_ID, action: "hide" },
            { targetAttributeId: DOBRA_ID, action: "hide" },
          ],
          isActive: true,
        },
      ];

      selectedValues.set(MATERIAL_ID, "Lona 280g");
      const finalState = processRules(rules, selectedValues, initialState);

      const visibleAttrs = getVisibleAttributes(
        [MATERIAL_ID, ACABAMENTO_ID, ILHOS_ID, BASTAO_ID, LAMINACAO_ID, DOBRA_ID],
        finalState
      );

      // Deve incluir: Material, Acabamento, Ilhós, Bastão
      // Deve excluir: Laminação, Dobra
      expect(visibleAttrs).toContain(MATERIAL_ID);
      expect(visibleAttrs).toContain(ACABAMENTO_ID);
      expect(visibleAttrs).toContain(ILHOS_ID);
      expect(visibleAttrs).toContain(BASTAO_ID);
      expect(visibleAttrs).not.toContain(LAMINACAO_ID);
      expect(visibleAttrs).not.toContain(DOBRA_ID);
    });
  });

  describe("FOLHETO - Regras de Compatibilidade", () => {
    it("deve mostrar Dobra quando Material = Papel Couchê", () => {
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Folheto permite Dobra",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Papel Couchê 300g" }],
          actions: [{ targetAttributeId: DOBRA_ID, action: "show" }],
          isActive: true,
        },
      ];

      selectedValues.set(MATERIAL_ID, "Papel Couchê 300g");
      const finalState = processRules(rules, selectedValues, initialState);

      expect(finalState[DOBRA_ID].visible).toBe(true);
    });

    it("deve ocultar Ilhós e Bastão para Folheto", () => {
      const rules: DynamicRule[] = [
        {
          id: 2,
          name: "Folheto não permite Ilhós ou Bastão",
          conditions: [],
          actions: [
            { targetAttributeId: ILHOS_ID, action: "hide" },
            { targetAttributeId: BASTAO_ID, action: "hide" },
          ],
          isActive: true,
        },
      ];

      const finalState = processRules(rules, selectedValues, initialState);

      expect(finalState[ILHOS_ID].visible).toBe(false);
      expect(finalState[BASTAO_ID].visible).toBe(false);
    });
  });

  describe("ADESIVO - Regras de Compatibilidade", () => {
    it("deve ocultar Dobra para Adesivo", () => {
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Adesivo não permite Dobra",
          conditions: [],
          actions: [{ targetAttributeId: DOBRA_ID, action: "hide" }],
          isActive: true,
        },
      ];

      const finalState = processRules(rules, selectedValues, initialState);

      expect(finalState[DOBRA_ID].visible).toBe(false);
    });

    it("deve ocultar Ilhós e Bastão para Adesivo", () => {
      const rules: DynamicRule[] = [
        {
          id: 2,
          name: "Adesivo não permite Ilhós ou Bastão",
          conditions: [],
          actions: [
            { targetAttributeId: ILHOS_ID, action: "hide" },
            { targetAttributeId: BASTAO_ID, action: "hide" },
          ],
          isActive: true,
        },
      ];

      const finalState = processRules(rules, selectedValues, initialState);

      expect(finalState[ILHOS_ID].visible).toBe(false);
      expect(finalState[BASTAO_ID].visible).toBe(false);
    });
  });

  describe("PLACA - Regras de Compatibilidade", () => {
    it("deve ocultar Dobra, Ilhós e Bastão para Placa", () => {
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Placa não permite Dobra, Ilhós ou Bastão",
          conditions: [],
          actions: [
            { targetAttributeId: DOBRA_ID, action: "hide" },
            { targetAttributeId: ILHOS_ID, action: "hide" },
            { targetAttributeId: BASTAO_ID, action: "hide" },
          ],
          isActive: true,
        },
      ];

      const finalState = processRules(rules, selectedValues, initialState);

      expect(finalState[DOBRA_ID].visible).toBe(false);
      expect(finalState[ILHOS_ID].visible).toBe(false);
      expect(finalState[BASTAO_ID].visible).toBe(false);
    });

    it("deve manter Material e Acabamento visíveis para Placa", () => {
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Placa não permite Dobra, Ilhós ou Bastão",
          conditions: [],
          actions: [
            { targetAttributeId: DOBRA_ID, action: "hide" },
            { targetAttributeId: ILHOS_ID, action: "hide" },
            { targetAttributeId: BASTAO_ID, action: "hide" },
          ],
          isActive: true,
        },
      ];

      const finalState = processRules(rules, selectedValues, initialState);

      expect(finalState[MATERIAL_ID].visible).toBe(true);
      expect(finalState[ACABAMENTO_ID].visible).toBe(true);
    });
  });

  describe("Compatibilidade Global de Atributos", () => {
    it("todos os produtos devem ter Material como atributo obrigatório", () => {
      const rules: DynamicRule[] = [];
      const finalState = processRules(rules, selectedValues, initialState);

      // Material deve estar visível por padrão
      expect(finalState[MATERIAL_ID].visible).toBe(true);
    });

    it("todos os produtos devem ter Acabamento como atributo opcional", () => {
      const rules: DynamicRule[] = [];
      const finalState = processRules(rules, selectedValues, initialState);

      // Acabamento deve estar visível por padrão
      expect(finalState[ACABAMENTO_ID].visible).toBe(true);
    });

    it("deve processar múltiplas regras em sequência", () => {
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Lona requer Ilhós e Bastão",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Lona 280g" }],
          actions: [
            { targetAttributeId: ILHOS_ID, action: "show" },
            { targetAttributeId: BASTAO_ID, action: "show" },
          ],
          isActive: true,
        },
        {
          id: 2,
          name: "Lona não permite Laminação ou Dobra",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Lona 280g" }],
          actions: [
            { targetAttributeId: LAMINACAO_ID, action: "hide" },
            { targetAttributeId: DOBRA_ID, action: "hide" },
          ],
          isActive: true,
        },
      ];

      selectedValues.set(MATERIAL_ID, "Lona 280g");
      const finalState = processRules(rules, selectedValues, initialState);

      // Verificar que ambas as regras foram aplicadas
      expect(finalState[ILHOS_ID].visible).toBe(true);
      expect(finalState[BASTAO_ID].visible).toBe(true);
      expect(finalState[LAMINACAO_ID].visible).toBe(false);
      expect(finalState[DOBRA_ID].visible).toBe(false);
    });

    it("deve ignorar regras inativas", () => {
      const rules: DynamicRule[] = [
        {
          id: 1,
          name: "Lona requer Ilhós e Bastão",
          conditions: [{ attributeId: MATERIAL_ID, operator: "equals", value: "Lona 280g" }],
          actions: [
            { targetAttributeId: ILHOS_ID, action: "hide" },
            { targetAttributeId: BASTAO_ID, action: "hide" },
          ],
          isActive: false, // Inativa
        },
      ];

      selectedValues.set(MATERIAL_ID, "Lona 280g");
      const finalState = processRules(rules, selectedValues, initialState);

      // Ilhós e Bastão devem permanecer visíveis (regra não foi aplicada)
      expect(finalState[ILHOS_ID].visible).toBe(true);
      expect(finalState[BASTAO_ID].visible).toBe(true);
    });
  });
});
