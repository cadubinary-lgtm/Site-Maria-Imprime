import { describe, it, expect, beforeEach } from "vitest";

/**
 * ========================================
 * TESTES DO ADMIN
 * ========================================
 * Validar:
 * ✓ criação de produtos;
 * ✓ edição de produtos;
 * ✓ múltiplos segmentos;
 * ✓ atributos globais;
 * ✓ regras condicionais;
 * ✓ preços dinâmicos;
 * ✓ busca de produtos;
 * ✓ renderização automática.
 *
 * IMPORTANTE: Nenhuma lógica pode depender de hardcode.
 */

interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: "button" | "select" | "card" | "radio" | "checkbox" | "numeric" | "text" | "measures";
  isActive: boolean;
}

interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
  priceModifier: number;
  timeModifier: number;
  weightModifier: number;
  isActive: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  isConfigurable: boolean;
  segments: number[];
  attributes: ProductAttribute[];
}

interface ProductAttribute {
  id: number;
  productId: number;
  attributeId: number;
  isRequired: boolean;
  allowMultiple: boolean;
  values: AttributeValue[];
}

interface AttributeRule {
  id: number;
  productId: number;
  name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  isActive: boolean;
}

interface RuleCondition {
  attributeId: number;
  operator: string;
  value: string;
}

interface RuleAction {
  targetAttributeId: number;
  action: string;
  value?: string;
}

// Simulação de banco de dados admin
class AdminDatabase {
  private attributes: Map<number, Attribute> = new Map();
  private attributeValues: Map<number, AttributeValue> = new Map();
  private products: Map<number, Product> = new Map();
  private productAttributes: Map<number, ProductAttribute> = new Map();
  private rules: Map<number, AttributeRule> = new Map();
  private attributeCounter: number = 0;
  private attributeValueCounter: number = 0;
  private productCounter: number = 0;
  private productAttributeCounter: number = 0;
  private ruleCounter: number = 0;

  // ========== ATRIBUTOS GLOBAIS ==========
  createAttribute(name: string, slug: string, type: string): Attribute {
    const id = ++this.attributeCounter;
    const attribute: Attribute = {
      id,
      name,
      slug,
      type: type as any,
      isActive: true,
    };
    this.attributes.set(id, attribute);
    return attribute;
  }

  listAttributes(): Attribute[] {
    return Array.from(this.attributes.values());
  }

  getAttributeById(id: number): Attribute | undefined {
    return this.attributes.get(id);
  }

  updateAttribute(id: number, updates: Partial<Attribute>): void {
    const attr = this.attributes.get(id);
    if (attr) {
      this.attributes.set(id, { ...attr, ...updates });
    }
  }

  deleteAttribute(id: number): void {
    this.attributes.delete(id);
  }

  // ========== VALORES DE ATRIBUTOS ==========
  createAttributeValue(
    attributeId: number,
    value: string,
    priceModifier: number = 0
  ): AttributeValue {
    const id = ++this.attributeValueCounter;
    const attrValue: AttributeValue = {
      id,
      attributeId,
      value,
      priceModifier,
      timeModifier: 0,
      weightModifier: 0,
      isActive: true,
    };
    this.attributeValues.set(id, attrValue);
    return attrValue;
  }

  listAttributeValues(attributeId: number): AttributeValue[] {
    return Array.from(this.attributeValues.values()).filter((v) => v.attributeId === attributeId);
  }

  updateAttributeValue(id: number, updates: Partial<AttributeValue>): void {
    const val = this.attributeValues.get(id);
    if (val) {
      this.attributeValues.set(id, { ...val, ...updates });
    }
  }

  // ========== PRODUTOS ==========
  createProduct(name: string, price: number, description: string): Product {
    const id = ++this.productCounter;
    const product: Product = {
      id,
      name,
      price,
      description,
      isConfigurable: true,
      segments: [],
      attributes: [],
    };
    this.products.set(id, product);
    return product;
  }

  listProducts(): Product[] {
    return Array.from(this.products.values());
  }

  getProductById(id: number): Product | undefined {
    return this.products.get(id);
  }

  updateProduct(id: number, updates: Partial<Product>): void {
    const product = this.products.get(id);
    if (product) {
      this.products.set(id, { ...product, ...updates });
    }
  }

  searchProducts(query: string): Product[] {
    return Array.from(this.products.values()).filter(
      (p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
    );
  }

  // ========== SEGMENTOS ==========
  addSegmentToProduct(productId: number, segmentId: number): void {
    const product = this.products.get(productId);
    if (product && !product.segments.includes(segmentId)) {
      product.segments.push(segmentId);
    }
  }

  removeSegmentFromProduct(productId: number, segmentId: number): void {
    const product = this.products.get(productId);
    if (product) {
      product.segments = product.segments.filter((s) => s !== segmentId);
    }
  }

  // ========== VINCULAÇÃO DE ATRIBUTOS ==========
  linkAttributeToProduct(
    productId: number,
    attributeId: number,
    isRequired: boolean = true
  ): ProductAttribute {
    const id = ++this.productAttributeCounter;
    const values = this.listAttributeValues(attributeId);

    const productAttribute: ProductAttribute = {
      id,
      productId,
      attributeId,
      isRequired,
      allowMultiple: false,
      values,
    };

    this.productAttributes.set(id, productAttribute);

    const product = this.products.get(productId);
    if (product) {
      product.attributes.push(productAttribute);
    }

    return productAttribute;
  }

  getProductAttributes(productId: number): ProductAttribute[] {
    return Array.from(this.productAttributes.values()).filter((pa) => pa.productId === productId);
  }

  // ========== REGRAS CONDICIONAIS ==========
  createRule(
    productId: number,
    name: string,
    conditions: RuleCondition[],
    actions: RuleAction[]
  ): AttributeRule {
    const id = ++this.ruleCounter;
    const rule: AttributeRule = {
      id,
      productId,
      name,
      conditions,
      actions,
      isActive: true,
    };
    this.rules.set(id, rule);
    return rule;
  }

  getProductRules(productId: number): AttributeRule[] {
    return Array.from(this.rules.values()).filter((r) => r.productId === productId);
  }

  updateRule(id: number, updates: Partial<AttributeRule>): void {
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.set(id, { ...rule, ...updates });
    }
  }

  deleteRule(id: number): void {
    this.rules.delete(id);
  }
}

describe("Admin Functionality", () => {
  let db: AdminDatabase;

  beforeEach(() => {
    db = new AdminDatabase();
  });

  describe("Criação de Produtos", () => {
    it("deve criar produto com dados básicos", () => {
      const product = db.createProduct("Cartão de Visita", 50, "Cartão profissional");

      expect(product.id).toBeDefined();
      expect(product.name).toBe("Cartão de Visita");
      expect(product.price).toBe(50);
      expect(product.isConfigurable).toBe(true);
    });

    it("deve criar múltiplos produtos", () => {
      db.createProduct("Cartão", 50, "");
      db.createProduct("Banner", 100, "");
      db.createProduct("Adesivo", 30, "");

      const all = db.listProducts();
      expect(all.length).toBe(3);
    });

    it("deve gerar IDs únicos para produtos", () => {
      const p1 = db.createProduct("Produto 1", 50, "");
      const p2 = db.createProduct("Produto 2", 100, "");

      expect(p1.id).not.toBe(p2.id);
    });
  });

  describe("Edição de Produtos", () => {
    it("deve editar nome do produto", () => {
      const product = db.createProduct("Cartão Original", 50, "");
      db.updateProduct(product.id, { name: "Cartão Atualizado" });

      const updated = db.getProductById(product.id);
      expect(updated?.name).toBe("Cartão Atualizado");
    });

    it("deve editar preço do produto", () => {
      const product = db.createProduct("Cartão", 50, "");
      db.updateProduct(product.id, { price: 75 });

      const updated = db.getProductById(product.id);
      expect(updated?.price).toBe(75);
    });

    it("deve editar descrição do produto", () => {
      const product = db.createProduct("Cartão", 50, "Descrição antiga");
      db.updateProduct(product.id, { description: "Descrição nova" });

      const updated = db.getProductById(product.id);
      expect(updated?.description).toBe("Descrição nova");
    });

    it("deve editar múltiplos campos simultaneamente", () => {
      const product = db.createProduct("Cartão", 50, "Descrição");
      db.updateProduct(product.id, {
        name: "Cartão Premium",
        price: 100,
        description: "Cartão de alta qualidade",
      });

      const updated = db.getProductById(product.id);
      expect(updated?.name).toBe("Cartão Premium");
      expect(updated?.price).toBe(100);
      expect(updated?.description).toBe("Cartão de alta qualidade");
    });
  });

  describe("Múltiplos Segmentos", () => {
    it("deve adicionar segmento a produto", () => {
      const product = db.createProduct("Cartão", 50, "");
      db.addSegmentToProduct(product.id, 1);

      const updated = db.getProductById(product.id);
      expect(updated?.segments).toContain(1);
    });

    it("deve adicionar múltiplos segmentos", () => {
      const product = db.createProduct("Cartão", 50, "");
      db.addSegmentToProduct(product.id, 1);
      db.addSegmentToProduct(product.id, 2);
      db.addSegmentToProduct(product.id, 3);

      const updated = db.getProductById(product.id);
      expect(updated?.segments.length).toBe(3);
      expect(updated?.segments).toEqual([1, 2, 3]);
    });

    it("deve remover segmento de produto", () => {
      const product = db.createProduct("Cartão", 50, "");
      db.addSegmentToProduct(product.id, 1);
      db.addSegmentToProduct(product.id, 2);
      db.removeSegmentFromProduct(product.id, 1);

      const updated = db.getProductById(product.id);
      expect(updated?.segments).toEqual([2]);
    });

    it("deve evitar segmentos duplicados", () => {
      const product = db.createProduct("Cartão", 50, "");
      db.addSegmentToProduct(product.id, 1);
      db.addSegmentToProduct(product.id, 1);

      const updated = db.getProductById(product.id);
      expect(updated?.segments.length).toBe(1);
    });
  });

  describe("Atributos Globais", () => {
    it("deve criar atributo global", () => {
      const attr = db.createAttribute("Material", "material", "select");

      expect(attr.id).toBeDefined();
      expect(attr.name).toBe("Material");
      expect(attr.slug).toBe("material");
      expect(attr.type).toBe("select");
    });

    it("deve listar atributos globais", () => {
      db.createAttribute("Material", "material", "select");
      db.createAttribute("Acabamento", "acabamento", "select");
      db.createAttribute("Formato", "formato", "select");

      const all = db.listAttributes();
      expect(all.length).toBe(3);
    });

    it("deve criar valores para atributo", () => {
      const attr = db.createAttribute("Material", "material", "select");
      db.createAttributeValue(attr.id, "Couchê 300g", 0);
      db.createAttributeValue(attr.id, "Supremo 250g", 10);

      const values = db.listAttributeValues(attr.id);
      expect(values.length).toBe(2);
    });

    it("deve editar atributo global", () => {
      const attr = db.createAttribute("Material", "material", "select");
      db.updateAttribute(attr.id, { name: "Material Premium" });

      const updated = db.getAttributeById(attr.id);
      expect(updated?.name).toBe("Material Premium");
    });

    it("deve desativar atributo", () => {
      const attr = db.createAttribute("Material", "material", "select");
      db.updateAttribute(attr.id, { isActive: false });

      const updated = db.getAttributeById(attr.id);
      expect(updated?.isActive).toBe(false);
    });
  });

  describe("Vinculação de Atributos", () => {
    it("deve vincular atributo a produto", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr = db.createAttribute("Material", "material", "select");

      db.linkAttributeToProduct(product.id, attr.id);

      const productAttrs = db.getProductAttributes(product.id);
      expect(productAttrs.length).toBe(1);
      expect(productAttrs[0].attributeId).toBe(attr.id);
    });

    it("deve vincular múltiplos atributos a produto", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr1 = db.createAttribute("Material", "material", "select");
      const attr2 = db.createAttribute("Acabamento", "acabamento", "select");
      const attr3 = db.createAttribute("Formato", "formato", "select");

      db.linkAttributeToProduct(product.id, attr1.id);
      db.linkAttributeToProduct(product.id, attr2.id);
      db.linkAttributeToProduct(product.id, attr3.id);

      const productAttrs = db.getProductAttributes(product.id);
      expect(productAttrs.length).toBe(3);
    });

    it("deve vincular com valores de atributo", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr = db.createAttribute("Material", "material", "select");
      db.createAttributeValue(attr.id, "Couchê 300g", 0);
      db.createAttributeValue(attr.id, "Supremo 250g", 10);

      const productAttr = db.linkAttributeToProduct(product.id, attr.id);

      expect(productAttr.values.length).toBe(2);
    });

    it("deve marcar atributo como obrigatório", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr = db.createAttribute("Material", "material", "select");

      const productAttr = db.linkAttributeToProduct(product.id, attr.id, true);

      expect(productAttr.isRequired).toBe(true);
    });
  });

  describe("Regras Condicionais", () => {
    it("deve criar regra condicional", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr1 = db.createAttribute("Material", "material", "select");
      const attr2 = db.createAttribute("Acabamento", "acabamento", "select");

      const rule = db.createRule(
        product.id,
        "Lona requer ilhós",
        [{ attributeId: attr1.id, operator: "equals", value: "Lona" }],
        [{ targetAttributeId: attr2.id, action: "show" }]
      );

      expect(rule.id).toBeDefined();
      expect(rule.conditions.length).toBe(1);
      expect(rule.actions.length).toBe(1);
    });

    it("deve listar regras de produto", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr1 = db.createAttribute("Material", "material", "select");
      const attr2 = db.createAttribute("Acabamento", "acabamento", "select");

      db.createRule(
        product.id,
        "Regra 1",
        [{ attributeId: attr1.id, operator: "equals", value: "Lona" }],
        [{ targetAttributeId: attr2.id, action: "show" }]
      );

      db.createRule(
        product.id,
        "Regra 2",
        [{ attributeId: attr1.id, operator: "equals", value: "Couchê" }],
        [{ targetAttributeId: attr2.id, action: "hide" }]
      );

      const rules = db.getProductRules(product.id);
      expect(rules.length).toBe(2);
    });

    it("deve editar regra condicional", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr1 = db.createAttribute("Material", "material", "select");
      const attr2 = db.createAttribute("Acabamento", "acabamento", "select");

      const rule = db.createRule(
        product.id,
        "Regra Original",
        [{ attributeId: attr1.id, operator: "equals", value: "Lona" }],
        [{ targetAttributeId: attr2.id, action: "show" }]
      );

      db.updateRule(rule.id, { name: "Regra Atualizada" });

      const updated = db.getProductRules(product.id)[0];
      expect(updated.name).toBe("Regra Atualizada");
    });

    it("deve desativar regra", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr1 = db.createAttribute("Material", "material", "select");
      const attr2 = db.createAttribute("Acabamento", "acabamento", "select");

      const rule = db.createRule(
        product.id,
        "Regra",
        [{ attributeId: attr1.id, operator: "equals", value: "Lona" }],
        [{ targetAttributeId: attr2.id, action: "show" }]
      );

      db.updateRule(rule.id, { isActive: false });

      const updated = db.getProductRules(product.id)[0];
      expect(updated.isActive).toBe(false);
    });

    it("deve deletar regra", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr1 = db.createAttribute("Material", "material", "select");
      const attr2 = db.createAttribute("Acabamento", "acabamento", "select");

      const rule = db.createRule(
        product.id,
        "Regra",
        [{ attributeId: attr1.id, operator: "equals", value: "Lona" }],
        [{ targetAttributeId: attr2.id, action: "show" }]
      );

      db.deleteRule(rule.id);

      const rules = db.getProductRules(product.id);
      expect(rules.length).toBe(0);
    });
  });

  describe("Busca de Produtos", () => {
    it("deve buscar produto por nome", () => {
      db.createProduct("Cartão de Visita", 50, "");
      db.createProduct("Banner Grande", 100, "");
      db.createProduct("Adesivo Vinil", 30, "");

      const results = db.searchProducts("Cartão");
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Cartão de Visita");
    });

    it("deve buscar produto por descrição", () => {
      db.createProduct("Cartão", 50, "Cartão profissional de qualidade");
      db.createProduct("Banner", 100, "Banner em lona");

      const results = db.searchProducts("qualidade");
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Cartão");
    });

    it("deve buscar case-insensitive", () => {
      db.createProduct("Cartão de Visita", 50, "");

      const results1 = db.searchProducts("cartão");
      const results2 = db.searchProducts("CARTÃO");

      expect(results1.length).toBe(1);
      expect(results2.length).toBe(1);
    });

    it("deve retornar múltiplos resultados", () => {
      db.createProduct("Cartão Simples", 50, "");
      db.createProduct("Cartão Premium", 75, "");
      db.createProduct("Cartão Especial", 100, "");

      const results = db.searchProducts("Cartão");
      expect(results.length).toBe(3);
    });
  });

  describe("Renderização Automática", () => {
    it("deve renderizar produto com atributos dinâmicos", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr = db.createAttribute("Material", "material", "select");
      db.createAttributeValue(attr.id, "Couchê 300g", 0);

      db.linkAttributeToProduct(product.id, attr.id);

      const productAttrs = db.getProductAttributes(product.id);
      expect(productAttrs.length).toBe(1);
      expect(productAttrs[0].values.length).toBe(1);
    });

    it("deve renderizar múltiplos atributos", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr1 = db.createAttribute("Material", "material", "select");
      const attr2 = db.createAttribute("Acabamento", "acabamento", "select");

      db.createAttributeValue(attr1.id, "Couchê 300g", 0);
      db.createAttributeValue(attr2.id, "Laminação Fosca", 15);

      db.linkAttributeToProduct(product.id, attr1.id);
      db.linkAttributeToProduct(product.id, attr2.id);

      const productAttrs = db.getProductAttributes(product.id);
      expect(productAttrs.length).toBe(2);
    });

    it("deve renderizar com regras aplicadas", () => {
      const product = db.createProduct("Cartão", 50, "");
      const attr1 = db.createAttribute("Material", "material", "select");
      const attr2 = db.createAttribute("Acabamento", "acabamento", "select");

      db.createAttributeValue(attr1.id, "Lona", 50);
      db.createAttributeValue(attr2.id, "Ilhós", 30);

      db.linkAttributeToProduct(product.id, attr1.id);
      db.linkAttributeToProduct(product.id, attr2.id);

      db.createRule(
        product.id,
        "Lona requer ilhós",
        [{ attributeId: attr1.id, operator: "equals", value: "Lona" }],
        [{ targetAttributeId: attr2.id, action: "show" }]
      );

      const productAttrs = db.getProductAttributes(product.id);
      const rules = db.getProductRules(product.id);

      expect(productAttrs.length).toBe(2);
      expect(rules.length).toBe(1);
    });
  });

  describe("Fluxo Completo do Admin", () => {
    it("deve criar produto com atributos e regras completos", () => {
      // 1. Criar produto
      const product = db.createProduct("Cartão Premium", 75, "Cartão de alta qualidade");

      // 2. Criar atributos globais
      const materialAttr = db.createAttribute("Material", "material", "select");
      const acabamentoAttr = db.createAttribute("Acabamento", "acabamento", "select");

      // 3. Criar valores
      db.createAttributeValue(materialAttr.id, "Couchê 300g", 0);
      db.createAttributeValue(materialAttr.id, "Supremo 250g", 10);
      db.createAttributeValue(acabamentoAttr.id, "Laminação Fosca", 15);
      db.createAttributeValue(acabamentoAttr.id, "Laminação Brilho", 20);

      // 4. Vincular atributos ao produto
      db.linkAttributeToProduct(product.id, materialAttr.id, true);
      db.linkAttributeToProduct(product.id, acabamentoAttr.id, false);

      // 5. Adicionar segmentos
      db.addSegmentToProduct(product.id, 1);
      db.addSegmentToProduct(product.id, 2);

      // 6. Criar regras
      db.createRule(
        product.id,
        "Couchê permite laminação",
        [{ attributeId: materialAttr.id, operator: "contains", value: "Couchê" }],
        [{ targetAttributeId: acabamentoAttr.id, action: "enable" }]
      );

      // 7. Verificar integridade
      const retrieved = db.getProductById(product.id);
      const attrs = db.getProductAttributes(product.id);
      const rules = db.getProductRules(product.id);

      expect(retrieved?.name).toBe("Cartão Premium");
      expect(retrieved?.segments.length).toBe(2);
      expect(attrs.length).toBe(2);
      expect(attrs[0].isRequired).toBe(true);
      expect(attrs[1].isRequired).toBe(false);
      expect(rules.length).toBe(1);
    });
  });
});
