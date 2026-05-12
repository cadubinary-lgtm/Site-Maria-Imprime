/**
 * ========================================
 * CLIENT-SIDE ATTRIBUTES ENGINE
 * ========================================
 * Versão client do engine de regras dinâmicas
 */

export interface AttributeState {
  [attributeId: number]: {
    visible: boolean;
    enabled: boolean;
    priceModifier: number;
    selectedValue?: number;
  };
}

export interface RuleCondition {
  attributeId: number;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "in";
  value: string;
}

export interface RuleAction {
  targetAttributeId: number;
  action: "show" | "hide" | "enable" | "disable" | "setPrice" | "addPrice";
  value?: string;
}

export interface DynamicRule {
  id: number;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
}

/**
 * Avaliar condição de regra
 */
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

/**
 * Avaliar todas as condições de uma regra (AND logic)
 */
function evaluateRuleConditions(rule: DynamicRule, selectedValues: Map<number, any>): boolean {
  if (rule.conditions.length === 0) return true;
  return rule.conditions.every((condition) => evaluateCondition(condition, selectedValues));
}

/**
 * Aplicar ações de uma regra
 */
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

/**
 * Processar todas as regras e retornar estado final
 */
export function processRules(
  rules: DynamicRule[],
  selectedValues: Map<number, any>,
  initialState: AttributeState
): AttributeState {
  let state = { ...initialState };

  // Processar apenas regras ativas
  const activeRules = rules.filter((r) => r.isActive);

  for (const rule of activeRules) {
    // Se todas as condições forem verdadeiras, aplicar ações
    if (evaluateRuleConditions(rule, selectedValues)) {
      state = applyRuleActions(rule, state);
    }
  }

  return state;
}

/**
 * Calcular preço total com modificadores de regras
 */
export function calculatePriceWithRules(
  basePrice: number,
  attributePriceModifiers: Map<number, number>,
  ruleModifiers: Map<number, number>
): number {
  let total = basePrice;

  // Aplicar modificadores de atributos
  attributePriceModifiers.forEach((modifier) => {
    total += modifier;
  });

  // Aplicar modificadores de regras
  ruleModifiers.forEach((modifier) => {
    total += modifier;
  });

  return Math.max(0, total);
}

/**
 * Gerar estado inicial de atributos (todos visíveis e habilitados)
 */
export function generateInitialState(attributeIds: number[]): AttributeState {
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

/**
 * Filtrar atributos visíveis
 */
export function getVisibleAttributes(
  attributeIds: number[],
  state: AttributeState
): number[] {
  return attributeIds.filter((id) => state[id]?.visible !== false);
}

/**
 * Filtrar atributos habilitados
 */
export function getEnabledAttributes(attributeIds: number[], state: AttributeState): number[] {
  return attributeIds.filter((id) => state[id]?.enabled !== false);
}
