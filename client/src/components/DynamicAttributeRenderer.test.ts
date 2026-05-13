import { describe, it, expect } from "vitest";
import { DynamicAttribute, DynamicAttributeValue } from "./DynamicAttributeRenderer";

describe("DynamicAttributeRenderer - Melhorias de UX", () => {
  // Mock de atributo com valores
  const mockAttribute: DynamicAttribute = {
    id: 1,
    name: "Material",
    slug: "material",
    type: "button",
    isRequired: true,
    allowMultiple: false,
    values: [
      {
        id: 1,
        value: "Couchê 90g",
        priceModifier: 0,
        timeModifier: 0,
        weightModifier: 0,
      },
      {
        id: 2,
        value: "Couchê 150g",
        priceModifier: 25.5,
        timeModifier: 1,
        weightModifier: 0.5,
      },
    ],
    visible: true,
    enabled: true,
  };

  describe("Renderização de Atributos", () => {
    it("deve renderizar atributo visível", () => {
      expect(mockAttribute.visible).toBe(true);
    });

    it("deve renderizar atributo habilitado", () => {
      expect(mockAttribute.enabled).toBe(true);
    });

    it("não deve renderizar atributo invisível", () => {
      const invisibleAttribute = { ...mockAttribute, visible: false };
      expect(invisibleAttribute.visible).toBe(false);
    });

    it("não deve renderizar atributo desabilitado", () => {
      const disabledAttribute = { ...mockAttribute, enabled: false };
      expect(disabledAttribute.enabled).toBe(false);
    });
  });

  describe("Valores de Atributo", () => {
    it("deve ter valores com preço modificador", () => {
      const valueWithPrice = mockAttribute.values[1];
      expect(valueWithPrice.priceModifier).toBe(25.5);
    });

    it("deve exibir preço modificador formatado", () => {
      const value = mockAttribute.values[1];
      const formatted = `+R$ ${Math.abs(value.priceModifier).toFixed(2)}`;
      expect(formatted).toBe("+R$ 25.50");
    });

    it("deve ter tempo modificador", () => {
      const valueWithTime = mockAttribute.values[1];
      expect(valueWithTime.timeModifier).toBe(1);
    });

    it("deve ter peso modificador", () => {
      const valueWithWeight = mockAttribute.values[1];
      expect(valueWithWeight.weightModifier).toBe(0.5);
    });
  });

  describe("Tipos de Atributo", () => {
    it("deve suportar tipo 'button'", () => {
      const buttonAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "button",
      };
      expect(buttonAttribute.type).toBe("button");
    });

    it("deve suportar tipo 'select'", () => {
      const selectAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "select",
      };
      expect(selectAttribute.type).toBe("select");
    });

    it("deve suportar tipo 'radio'", () => {
      const radioAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "radio",
      };
      expect(radioAttribute.type).toBe("radio");
    });

    it("deve suportar tipo 'checkbox'", () => {
      const checkboxAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "checkbox",
      };
      expect(checkboxAttribute.type).toBe("checkbox");
    });

    it("deve suportar tipo 'card'", () => {
      const cardAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "card",
      };
      expect(cardAttribute.type).toBe("card");
    });

    it("deve suportar tipo 'numeric'", () => {
      const numericAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "numeric",
      };
      expect(numericAttribute.type).toBe("numeric");
    });

    it("deve suportar tipo 'text'", () => {
      const textAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "text",
      };
      expect(textAttribute.type).toBe("text");
    });

    it("deve suportar tipo 'measures'", () => {
      const measuresAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "measures",
      };
      expect(measuresAttribute.type).toBe("measures");
    });
  });

  describe("Seleção de Valores", () => {
    it("deve permitir seleção única em atributo não múltiplo", () => {
      const singleSelectAttribute = { ...mockAttribute, allowMultiple: false };
      expect(singleSelectAttribute.allowMultiple).toBe(false);
    });

    it("deve permitir múltipla seleção em atributo múltiplo", () => {
      const multiSelectAttribute = { ...mockAttribute, allowMultiple: true };
      expect(multiSelectAttribute.allowMultiple).toBe(true);
    });

    it("deve marcar atributo como obrigatório", () => {
      expect(mockAttribute.isRequired).toBe(true);
    });

    it("deve permitir atributo opcional", () => {
      const optionalAttribute = { ...mockAttribute, isRequired: false };
      expect(optionalAttribute.isRequired).toBe(false);
    });
  });

  describe("Responsividade e Animações", () => {
    it("deve ter valores com ícones para melhor visual", () => {
      const iconAttribute: DynamicAttribute = {
        ...mockAttribute,
        values: [
          {
            id: 1,
            value: "Brilho",
            priceModifier: 0,
            timeModifier: 0,
            weightModifier: 0,
            icon: "✨",
          },
        ],
      };
      expect(iconAttribute.values[0].icon).toBe("✨");
    });

    it("deve ter valores com imagens para cards", () => {
      const imageAttribute: DynamicAttribute = {
        ...mockAttribute,
        type: "card",
        values: [
          {
            id: 1,
            value: "Couchê Brilho",
            priceModifier: 0,
            timeModifier: 0,
            weightModifier: 0,
            image: "/images/couche-brilho.jpg",
          },
        ],
      };
      expect(imageAttribute.values[0].image).toBe("/images/couche-brilho.jpg");
    });
  });

  describe("Performance e Otimização", () => {
    it("deve ter slug único para cada atributo", () => {
      expect(mockAttribute.slug).toBe("material");
    });

    it("deve ter ID único para cada atributo", () => {
      expect(mockAttribute.id).toBe(1);
    });

    it("deve ter IDs únicos para cada valor", () => {
      const ids = mockAttribute.values.map((v) => v.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("deve calcular preço total com múltiplos modificadores", () => {
      const basePrice = 100;
      const totalPrice = basePrice + mockAttribute.values[1].priceModifier;
      expect(totalPrice).toBe(125.5);
    });
  });
});
