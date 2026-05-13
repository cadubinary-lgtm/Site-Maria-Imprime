import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import * as dbAttributes from "./db-attributes";
import * as dbProducts from "./db-products";

/**
 * ========================================
 * TESTES DE INTEGRAÇÃO - PRECIFICAÇÃO
 * ========================================
 * 
 * Valida o fluxo completo:
 * Produto → Atributo → Vínculo → Precificação
 */

describe("Precificação Centralizada - Integração Completa", () => {
  let testProductId: number;
  let testAttributeId: number;
  let testProductAttributeId: number;

  beforeAll(async () => {
    // Criar produto de teste
    const product = await dbProducts.createProduct({
      name: "Cartão de Visita - Teste",
      sku: "TEST-CARD-001",
      description: "Produto para testes de precificação",
      basePrice: 100,
      categoryId: 1,
      segmentId: 1,
    });
    testProductId = product.id;

    // Criar atributo de teste
    const attribute = await dbAttributes.createAttribute({
      name: "Laminação Fosca - Teste",
      slug: "laminacao-fosca-teste",
      type: "select",
      description: "Atributo para testes",
    });
    testAttributeId = attribute.id;
  });

  afterAll(async () => {
    // Cleanup
    const db = await getDb();
    if (db) {
      // Deletar dados de teste
      // Nota: Implementar soft delete ou usar transações
    }
  });

  describe("TESTE 1: Vincular Atributo com Precificação Fixa", () => {
    it("Deve vincular atributo ao produto com preço fixo", async () => {
      const result = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 15.0,
        calculationType: "fixed",
        timeModifier: 2,
        weightModifier: 0.05,
        isActive: true,
        priority: 1,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.priceModifier).toBe(15.0);
      expect(result.calculationType).toBe("fixed");
      expect(result.timeModifier).toBe(2);
      expect(result.weightModifier).toBe(0.05);
      expect(result.isActive).toBe(true);
      expect(result.priority).toBe(1);

      testProductAttributeId = result.id;
    });

    it("Deve recuperar atributos do produto com precificação", async () => {
      const attributes = await dbAttributes.getProductAttributes(testProductId);

      expect(attributes).toBeDefined();
      expect(attributes.length).toBeGreaterThan(0);

      const linkedAttribute = attributes.find((a: any) => a.id === testProductAttributeId);
      expect(linkedAttribute).toBeDefined();
      expect(linkedAttribute.priceModifier).toBe(15.0);
      expect(linkedAttribute.calculationType).toBe("fixed");
    });
  });

  describe("TESTE 2: Atualizar Precificação", () => {
    it("Deve atualizar preço de R$15 para R$25", async () => {
      const result = await dbAttributes.updateProductAttribute({
        productAttributeId: testProductAttributeId,
        priceModifier: 25.0,
      });

      expect(result).toBeDefined();
      expect(result.priceModifier).toBe(25.0);
    });

    it("Deve recuperar preço atualizado", async () => {
      const attributes = await dbAttributes.getProductAttributes(testProductId);
      const linkedAttribute = attributes.find((a: any) => a.id === testProductAttributeId);

      expect(linkedAttribute.priceModifier).toBe(25.0);
    });

    it("Deve atualizar tipo de cálculo para percentual", async () => {
      const result = await dbAttributes.updateProductAttribute({
        productAttributeId: testProductAttributeId,
        calculationType: "percentage",
        priceModifier: 10.0,
      });

      expect(result.calculationType).toBe("percentage");
      expect(result.priceModifier).toBe(10.0);
    });
  });

  describe("TESTE 3: Múltiplos Atributos com Preços Diferentes", () => {
    let attribute2Id: number;
    let productAttribute2Id: number;

    it("Deve criar segundo atributo", async () => {
      const attribute = await dbAttributes.createAttribute({
        name: "Verniz UV - Teste",
        slug: "verniz-uv-teste",
        type: "select",
      });
      attribute2Id = attribute.id;
      expect(attribute2Id).toBeDefined();
    });

    it("Deve vincular segundo atributo com preço diferente", async () => {
      const result = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: attribute2Id,
        priceModifier: 50.0,
        calculationType: "fixed",
        priority: 2,
      });

      productAttribute2Id = result.id;
      expect(result.priceModifier).toBe(50.0);
      expect(result.priority).toBe(2);
    });

    it("Deve recuperar múltiplos atributos com preços corretos", async () => {
      const attributes = await dbAttributes.getProductAttributes(testProductId);

      expect(attributes.length).toBeGreaterThanOrEqual(2);

      const attr1 = attributes.find((a: any) => a.id === testProductAttributeId);
      const attr2 = attributes.find((a: any) => a.id === productAttribute2Id);

      expect(attr1.priceModifier).toBe(10.0); // Percentual
      expect(attr2.priceModifier).toBe(50.0); // Fixo
    });
  });

  describe("TESTE 4: Desvinc ular Atributo", () => {
    it("Deve desvinc ular atributo", async () => {
      const result = await dbAttributes.unlinkAttributeFromProduct(testProductAttributeId);
      expect(result).toBeDefined();
    });

    it("Deve confirmar desvinc ulação", async () => {
      const attributes = await dbAttributes.getProductAttributes(testProductId);
      const unlinkedAttribute = attributes.find((a: any) => a.id === testProductAttributeId);

      expect(unlinkedAttribute).toBeUndefined();
    });
  });

  describe("TESTE 5: Persistência e Recarregamento", () => {
    it("Deve persistir dados no banco", async () => {
      // Criar novo vínculo
      const result = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 35.0,
        calculationType: "fixed",
      });

      const newProductAttributeId = result.id;

      // Recarregar
      const attributes = await dbAttributes.getProductAttributes(testProductId);
      const reloadedAttribute = attributes.find((a: any) => a.id === newProductAttributeId);

      expect(reloadedAttribute).toBeDefined();
      expect(reloadedAttribute.priceModifier).toBe(35.0);
      expect(reloadedAttribute.calculationType).toBe("fixed");
    });
  });

  describe("TESTE 6: Cálculo Dinâmico com Múltiplos Tipos", () => {
    it("Deve suportar cálculo fixo", async () => {
      const attr = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 100.0,
        calculationType: "fixed",
      });

      expect(attr.calculationType).toBe("fixed");
      expect(attr.priceModifier).toBe(100.0);
    });

    it("Deve suportar cálculo percentual", async () => {
      const attr = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 15.0,
        calculationType: "percentage",
      });

      expect(attr.calculationType).toBe("percentage");
      expect(attr.priceModifier).toBe(15.0);
    });

    it("Deve suportar cálculo por m²", async () => {
      const attr = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 25.5,
        calculationType: "per_sqm",
      });

      expect(attr.calculationType).toBe("per_sqm");
      expect(attr.priceModifier).toBe(25.5);
    });

    it("Deve suportar multiplicador", async () => {
      const attr = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 1.5,
        calculationType: "multiplier",
      });

      expect(attr.calculationType).toBe("multiplier");
      expect(attr.priceModifier).toBe(1.5);
    });
  });

  describe("TESTE 7: Impacto em Prazo e Peso", () => {
    it("Deve registrar impacto no prazo", async () => {
      const attr = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 20.0,
        timeModifier: 8,
      });

      expect(attr.timeModifier).toBe(8);
    });

    it("Deve registrar impacto no peso", async () => {
      const attr = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 20.0,
        weightModifier: 0.25,
      });

      expect(attr.weightModifier).toBe(0.25);
    });

    it("Deve registrar ambos impactos", async () => {
      const attr = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 30.0,
        timeModifier: 4,
        weightModifier: 0.1,
      });

      expect(attr.timeModifier).toBe(4);
      expect(attr.weightModifier).toBe(0.1);
    });
  });

  describe("TESTE 8: Ativação/Desativação", () => {
    let testAttrId: number;

    it("Deve criar atributo ativo", async () => {
      const attr = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 15.0,
        isActive: true,
      });

      testAttrId = attr.id;
      expect(attr.isActive).toBe(true);
    });

    it("Deve desativar atributo", async () => {
      const result = await dbAttributes.updateProductAttribute({
        productAttributeId: testAttrId,
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });

    it("Deve reativar atributo", async () => {
      const result = await dbAttributes.updateProductAttribute({
        productAttributeId: testAttrId,
        isActive: true,
      });

      expect(result.isActive).toBe(true);
    });
  });

  describe("TESTE 9: Prioridade de Exibição", () => {
    it("Deve respeitar prioridade", async () => {
      const attr1 = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 10.0,
        priority: 1,
      });

      const attr2 = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 20.0,
        priority: 2,
      });

      expect(attr1.priority).toBe(1);
      expect(attr2.priority).toBe(2);
    });

    it("Deve atualizar prioridade", async () => {
      const attributes = await dbAttributes.getProductAttributes(testProductId);
      const firstAttr = attributes[0];

      const result = await dbAttributes.updateProductAttribute({
        productAttributeId: firstAttr.id,
        priority: 10,
      });

      expect(result.priority).toBe(10);
    });
  });

  describe("TESTE 10: Fluxo Completo - Cartão de Visita", () => {
    it("Deve criar cartão com múltiplos atributos e preços", async () => {
      // Simular: Cartão de Visita com Couchê + Laminação
      const attr1 = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 10.0,
        calculationType: "fixed",
        priority: 1,
      });

      const attr2 = await dbAttributes.linkAttributeToProduct({
        productId: testProductId,
        attributeId: testAttributeId,
        priceModifier: 15.0,
        calculationType: "fixed",
        priority: 2,
      });

      const attributes = await dbAttributes.getProductAttributes(testProductId);

      expect(attributes.length).toBeGreaterThanOrEqual(2);
      expect(attributes.some((a: any) => a.priceModifier === 10.0)).toBe(true);
      expect(attributes.some((a: any) => a.priceModifier === 15.0)).toBe(true);
    });
  });
});
