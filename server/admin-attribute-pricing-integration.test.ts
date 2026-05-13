import { describe, it, expect, beforeEach } from "vitest";

/**
 * ========================================
 * TESTES DE INTEGRAÇÃO - ADMIN ATTRIBUTE PRICING
 * ========================================
 * Simula o fluxo completo:
 * 1. Usuário acessa /admin/precos-atributos
 * 2. Frontend carrega lista de atributos
 * 3. Usuário seleciona um atributo
 * 4. Frontend carrega valores do atributo
 * 5. Frontend renderiza tabela com valores
 * 6. Usuário clica em editar
 * 7. Frontend abre dialog com dados
 * 8. Usuário edita e salva
 * 9. Backend atualiza banco de dados
 * 10. Frontend atualiza tabela
 */

interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  isActive: boolean;
}

interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
  calculationType?: string;
  priceModifier: number;
  timeModifier: number;
  weightModifier: number;
  isActive: boolean;
}

interface MockAPI {
  listAttributes(): Promise<Attribute[]>;
  listAttributeValues(attributeId: number): Promise<AttributeValue[]>;
  updateAttributeValue(id: number, data: Partial<AttributeValue>): Promise<AttributeValue>;
}

class MockAttributePricingAPI implements MockAPI {
  private attributes: Map<number, Attribute> = new Map();
  private attributeValues: Map<number, AttributeValue> = new Map();
  private attributeCounter: number = 0;
  private valueCounter: number = 0;

  async listAttributes(): Promise<Attribute[]> {
    return Array.from(this.attributes.values()).filter((a) => a.isActive);
  }

  async listAttributeValues(attributeId: number): Promise<AttributeValue[]> {
    return Array.from(this.attributeValues.values()).filter(
      (v) => v.attributeId === attributeId && v.isActive
    );
  }

  async updateAttributeValue(
    id: number,
    data: Partial<AttributeValue>
  ): Promise<AttributeValue> {
    const value = this.attributeValues.get(id);
    if (!value) throw new Error("Value not found");

    const updated = { ...value, ...data };
    this.attributeValues.set(id, updated);
    return updated;
  }

  // Helpers para setup
  createAttribute(name: string, slug: string, type: string): Attribute {
    const id = ++this.attributeCounter;
    const attr: Attribute = {
      id,
      name,
      slug,
      type,
      isActive: true,
    };
    this.attributes.set(id, attr);
    return attr;
  }

  createAttributeValue(
    attributeId: number,
    value: string,
    calculationType: string = "fixed",
    priceModifier: number = 0,
    timeModifier: number = 0,
    weightModifier: number = 0
  ): AttributeValue {
    const id = ++this.valueCounter;
    const attrValue: AttributeValue = {
      id,
      attributeId,
      value,
      calculationType,
      priceModifier,
      timeModifier,
      weightModifier,
      isActive: true,
    };
    this.attributeValues.set(id, attrValue);
    return attrValue;
  }
}

describe("Admin Attribute Pricing - Integration Tests", () => {
  let api: MockAttributePricingAPI;

  beforeEach(() => {
    api = new MockAttributePricingAPI();
  });

  describe("Fluxo 1: Carregar Atributos", () => {
    it("deve carregar lista de atributos ao abrir página", async () => {
      // Setup
      api.createAttribute("Material", "material", "select");
      api.createAttribute("Acabamento", "acabamento", "select");
      api.createAttribute("Formato", "formato", "select");

      // Ação
      const attributes = await api.listAttributes();

      // Verificação
      expect(attributes.length).toBe(3);
      expect(attributes[0].name).toBe("Material");
      expect(attributes[1].name).toBe("Acabamento");
      expect(attributes[2].name).toBe("Formato");
    });

    it("deve retornar array vazio se nenhum atributo", async () => {
      const attributes = await api.listAttributes();

      expect(Array.isArray(attributes)).toBe(true);
      expect(attributes.length).toBe(0);
    });
  });

  describe("Fluxo 2: Selecionar Atributo e Carregar Valores", () => {
    it("deve carregar valores quando usuário seleciona atributo", async () => {
      // Setup
      const attr = api.createAttribute("Material", "material", "select");
      api.createAttributeValue(attr.id, "Couchê 300g", "fixed", 0, 0, 0);
      api.createAttributeValue(attr.id, "Supremo 250g", "fixed", 10, 2, 0.5);
      api.createAttributeValue(attr.id, "Lona 280g", "fixed", 50, 5, 1.0);

      // Ação: Usuário seleciona Material
      const values = await api.listAttributeValues(attr.id);

      // Verificação
      expect(values.length).toBe(3);
      expect(values[0].value).toBe("Couchê 300g");
      expect(values[1].priceModifier).toBe(10);
      expect(values[2].timeModifier).toBe(5);
    });

    it("deve retornar array vazio se atributo não tem valores", async () => {
      const attr = api.createAttribute("Material", "material", "select");

      const values = await api.listAttributeValues(attr.id);

      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBe(0);
    });
  });

  describe("Fluxo 3: Renderizar Tabela com Valores", () => {
    it("deve renderizar valores com segurança (sem TypeError)", async () => {
      // Setup
      const attr = api.createAttribute("Material", "material", "select");
      api.createAttributeValue(attr.id, "Couchê 300g", "fixed", 0, 0, 0);
      api.createAttributeValue(attr.id, "Supremo 250g", "fixed", 10.5, 2, 0.5);

      // Ação
      const values = await api.listAttributeValues(attr.id);

      // Verificação: Renderizar como faria o componente
      values.forEach((value) => {
        // Não deve lançar erro
        const priceText = `R$ ${(value.priceModifier ?? 0).toFixed(2)}`;
        const timeText = `${value.timeModifier ?? 0}h`;
        const weightText = `${value.weightModifier ?? 0}kg`;

        expect(priceText).toBeDefined();
        expect(timeText).toBeDefined();
        expect(weightText).toBeDefined();

        // Verificar formato
        expect(priceText).toMatch(/^R\$ \d+\.\d{2}$/);
        expect(timeText).toMatch(/^\d+h$/);
        expect(weightText).toMatch(/^\d+(\.\d+)?kg$/);
      });
    });

    it("deve renderizar diferentes tipos de cálculo", async () => {
      const attr = api.createAttribute("Material", "material", "select");
      api.createAttributeValue(attr.id, "Fixo", "fixed", 15, 0, 0);
      api.createAttributeValue(attr.id, "Percentual", "percentage", 10, 0, 0);
      api.createAttributeValue(attr.id, "Multiplicador", "multiplier", 1.5, 0, 0);

      const values = await api.listAttributeValues(attr.id);

      // Renderizar cada tipo
      values.forEach((value) => {
        let rendered = "";
        if (value.calculationType === "percentage") {
          rendered = `${value.priceModifier ?? 0}%`;
        } else {
          rendered = `R$ ${(value.priceModifier ?? 0).toFixed(2)}`;
        }
        expect(rendered).toBeDefined();
      });
    });
  });

  describe("Fluxo 4: Editar Valor", () => {
    it("deve editar priceModifier e retornar dados atualizados", async () => {
      // Setup
      const attr = api.createAttribute("Material", "material", "select");
      const value = api.createAttributeValue(attr.id, "Couchê 300g", "fixed", 10, 0, 0);

      // Ação: Usuário edita priceModifier
      const updated = await api.updateAttributeValue(value.id, { priceModifier: 15 });

      // Verificação
      expect(updated.priceModifier).toBe(15);
      expect(updated.value).toBe("Couchê 300g");
      expect(updated.attributeId).toBe(attr.id);
    });

    it("deve editar múltiplos campos simultaneamente", async () => {
      const attr = api.createAttribute("Material", "material", "select");
      const value = api.createAttributeValue(attr.id, "Couchê 300g", "fixed", 10, 2, 0.3);

      const updated = await api.updateAttributeValue(value.id, {
        priceModifier: 20,
        timeModifier: 4,
        weightModifier: 0.5,
      });

      expect(updated.priceModifier).toBe(20);
      expect(updated.timeModifier).toBe(4);
      expect(updated.weightModifier).toBe(0.5);
      expect(updated.calculationType).toBe("fixed");
    });

    it("deve permitir editar tipo de cálculo", async () => {
      const attr = api.createAttribute("Material", "material", "select");
      const value = api.createAttributeValue(attr.id, "Couchê 300g", "fixed", 10, 0, 0);

      const updated = await api.updateAttributeValue(value.id, {
        calculationType: "percentage",
      });

      expect(updated.calculationType).toBe("percentage");
      expect(updated.priceModifier).toBe(10);
    });
  });

  describe("Fluxo 5: Atualizar Frontend após Edição", () => {
    it("deve recarregar valores após edição", async () => {
      // Setup
      const attr = api.createAttribute("Material", "material", "select");
      api.createAttributeValue(attr.id, "Couchê 300g", "fixed", 10, 0, 0);
      api.createAttributeValue(attr.id, "Supremo 250g", "fixed", 15, 0, 0);

      // Ação 1: Carregar valores iniciais
      let values = await api.listAttributeValues(attr.id);
      expect(values[0].priceModifier).toBe(10);

      // Ação 2: Editar primeiro valor
      await api.updateAttributeValue(values[0].id, { priceModifier: 20 });

      // Ação 3: Recarregar valores
      values = await api.listAttributeValues(attr.id);

      // Verificação
      expect(values[0].priceModifier).toBe(20);
      expect(values[1].priceModifier).toBe(15);
    });
  });

  describe("Fluxo Completo: Passo a Passo", () => {
    it("deve completar fluxo completo sem erros", async () => {
      // 1. Página carrega
      let attributes = await api.listAttributes();
      expect(attributes.length).toBe(0);

      // 2. Admin cria atributo
      const attr = api.createAttribute("Material", "material", "select");
      attributes = await api.listAttributes();
      expect(attributes.length).toBe(1);

      // 3. Admin cria valores
      const v1 = api.createAttributeValue(attr.id, "Couchê 300g", "fixed", 0, 0, 0);
      const v2 = api.createAttributeValue(attr.id, "Supremo 250g", "fixed", 10, 2, 0.5);

      // 4. Usuário acessa página
      attributes = await api.listAttributes();
      expect(attributes.length).toBe(1);

      // 5. Usuário seleciona atributo
      let values = await api.listAttributeValues(attr.id);
      expect(values.length).toBe(2);

      // 6. Frontend renderiza tabela
      values.forEach((v) => {
        const rendered = `R$ ${(v.priceModifier ?? 0).toFixed(2)}`;
        expect(rendered).toBeDefined();
      });

      // 7. Usuário clica editar em primeiro valor
      const valueToEdit = values[0];
      expect(valueToEdit.priceModifier).toBe(0);

      // 8. Usuário edita e salva
      const updated = await api.updateAttributeValue(valueToEdit.id, {
        priceModifier: 5,
      });
      expect(updated.priceModifier).toBe(5);

      // 9. Frontend recarrega tabela
      values = await api.listAttributeValues(attr.id);
      expect(values[0].priceModifier).toBe(5);
      expect(values[1].priceModifier).toBe(10);

      // 10. Renderizar novamente com segurança
      values.forEach((v) => {
        const rendered = `R$ ${(v.priceModifier ?? 0).toFixed(2)}`;
        expect(rendered).toMatch(/^R\$ \d+\.\d{2}$/);
      });
    });

    it("deve manter integridade com múltiplos atributos", async () => {
      // Setup: Criar 3 atributos com valores
      const attr1 = api.createAttribute("Material", "material", "select");
      const attr2 = api.createAttribute("Acabamento", "acabamento", "select");
      const attr3 = api.createAttribute("Formato", "formato", "select");

      api.createAttributeValue(attr1.id, "Couchê", "fixed", 10, 0, 0);
      api.createAttributeValue(attr2.id, "Laminação", "fixed", 15, 2, 0);
      api.createAttributeValue(attr3.id, "A4", "fixed", 0, 0, 0);

      // Editar valores de diferentes atributos
      const values1 = await api.listAttributeValues(attr1.id);
      const values2 = await api.listAttributeValues(attr2.id);
      const values3 = await api.listAttributeValues(attr3.id);

      await api.updateAttributeValue(values1[0].id, { priceModifier: 20 });
      await api.updateAttributeValue(values2[0].id, { priceModifier: 25 });
      await api.updateAttributeValue(values3[0].id, { priceModifier: 5 });

      // Verificar integridade
      const updated1 = await api.listAttributeValues(attr1.id);
      const updated2 = await api.listAttributeValues(attr2.id);
      const updated3 = await api.listAttributeValues(attr3.id);

      expect(updated1[0].priceModifier).toBe(20);
      expect(updated2[0].priceModifier).toBe(25);
      expect(updated3[0].priceModifier).toBe(5);
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve lançar erro ao tentar editar valor inexistente", async () => {
      const promise = api.updateAttributeValue(999, { priceModifier: 10 });

      await expect(promise).rejects.toThrow("Value not found");
    });

    it("deve retornar array vazio para atributo inexistente", async () => {
      const values = await api.listAttributeValues(999);

      expect(Array.isArray(values)).toBe(true);
      expect(values.length).toBe(0);
    });
  });
});
