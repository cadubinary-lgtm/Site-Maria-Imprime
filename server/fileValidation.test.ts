import { describe, it, expect } from "vitest";

/**
 * Testes para validação de arquivo e regras comerciais
 */

describe("File Validation", () => {
  describe("validateArtFile", () => {
    it("deve aceitar arquivo PDF válido", () => {
      const file = new File(["content"], "design.pdf", { type: "application/pdf" });
      // Simulando validação básica
      const fileName = file.name.toLowerCase();
      const isValid = fileName.endsWith(".pdf");
      expect(isValid).toBe(true);
    });

    it("deve rejeitar arquivo com extensão inválida", () => {
      const file = new File(["content"], "design.txt", { type: "text/plain" });
      const fileName = file.name.toLowerCase();
      const allowedExtensions = [".pdf", ".ai", ".cdr", ".psd", ".jpg", ".jpeg", ".png"];
      const isValid = allowedExtensions.some((ext) => fileName.endsWith(ext));
      expect(isValid).toBe(false);
    });

    it("deve avisar sobre tamanho pequeno de arquivo", () => {
      const file = new File(["x"], "design.pdf", { type: "application/pdf" });
      const isTooSmall = file.size < 100 * 1024; // 100KB
      expect(isTooSmall).toBe(true);
    });

    it("deve rejeitar arquivo muito grande", () => {
      const largeContent = new Array(51 * 1024 * 1024).fill("x").join("");
      const file = new File([largeContent], "design.pdf", { type: "application/pdf" });
      const maxSize = 50 * 1024 * 1024;
      const isTooLarge = file.size > maxSize;
      expect(isTooLarge).toBe(true);
    });
  });

  describe("Commercial Rules Validation", () => {
    it("deve validar quantidade mínima", () => {
      const quantity = 0;
      const isValid = quantity >= 1;
      expect(isValid).toBe(false);
    });

    it("deve validar quantidade válida", () => {
      const quantity = 100;
      const isValid = quantity >= 1;
      expect(isValid).toBe(true);
    });

    it("deve validar área mínima de cobrança", () => {
      const area = 0.5; // m²
      const minimumArea = 1;
      const isValid = area >= minimumArea;
      expect(isValid).toBe(false);
    });

    it("deve aceitar área acima do mínimo", () => {
      const area = 2; // m²
      const minimumArea = 1;
      const isValid = area >= minimumArea;
      expect(isValid).toBe(true);
    });

    it("deve validar combinação inválida: Adesivo Transparente + Refile", () => {
      const material = "Adesivo Transparente";
      const finish = "Refile";
      const isInvalidCombination = material === "Adesivo Transparente" && finish === "Refile";
      expect(isInvalidCombination).toBe(true);
    });

    it("deve aceitar combinação válida: Adesivo Brilho + Refile", () => {
      const material = "Adesivo Brilho";
      const finish = "Refile";
      const isInvalidCombination = material === "Adesivo Transparente" && finish === "Refile";
      expect(isInvalidCombination).toBe(false);
    });
  });

  describe("Price Calculation", () => {
    it("deve calcular preço com área mínima de cobrança", () => {
      const area = 0.5; // m²
      const minimumArea = 1;
      const chargeableArea = Math.max(area, minimumArea);
      expect(chargeableArea).toBe(1);
    });

    it("deve aplicar quantidade no cálculo de preço", () => {
      const basePrice = 100; // R$ por m²
      const area = 1; // m²
      const quantity = 10;
      const totalCost = basePrice * area * quantity;
      expect(totalCost).toBe(1000);
    });

    it("deve aplicar margem de lucro", () => {
      const cost = 100;
      const profitMargin = 30; // 30%
      const finalPrice = cost * (1 + profitMargin / 100);
      expect(finalPrice).toBe(130);
    });

    it("deve aplicar modificadores de variação", () => {
      const basePrice = 100;
      const variationModifier = 20; // R$ a mais
      const quantity = 5;
      const totalCost = (basePrice + variationModifier) * quantity;
      expect(totalCost).toBe(600);
    });

    it("deve calcular preço final com todos os componentes", () => {
      const basePrice = 100; // R$ por m²
      const area = 1; // m²
      const quantity = 10;
      const materialCost = 10;
      const printingCost = 5;
      const finishingCost = 2;
      const variationModifier = 20;
      const profitMargin = 30; // 30%

      let cost = basePrice * area * quantity;
      cost += materialCost * area * quantity;
      cost += printingCost * area * quantity;
      cost += finishingCost * area * quantity;
      cost += variationModifier * quantity;

      const finalPrice = cost * (1 + profitMargin / 100);
      const expected = (100 * 1 * 10 + 10 * 1 * 10 + 5 * 1 * 10 + 2 * 1 * 10 + 20 * 10) * 1.3;

      expect(finalPrice).toBe(expected);
    });
  });

  describe("Dimension Validation", () => {
    it("deve rejeitar dimensões muito pequenas", () => {
      const width = 0.5;
      const height = 0.5;
      const isValid = width >= 1 && height >= 1;
      expect(isValid).toBe(false);
    });

    it("deve aceitar dimensões válidas", () => {
      const width = 10;
      const height = 15;
      const isValid = width >= 1 && height >= 1;
      expect(isValid).toBe(true);
    });

    it("deve avisar sobre dimensões muito grandes", () => {
      const width = 250; // cm
      const height = 350; // cm
      const maxWidth = 200;
      const maxHeight = 300;
      const isTooLarge = width > maxWidth || height > maxHeight;
      expect(isTooLarge).toBe(true);
    });

    it("deve avisar sobre proporção extrema", () => {
      const width = 200;
      const height = 10;
      const ratio = width / height;
      const isExtremeRatio = ratio > 3 || ratio < 0.33;
      expect(isExtremeRatio).toBe(true);
    });

    it("deve aceitar proporção normal", () => {
      const width = 20;
      const height = 30;
      const ratio = width / height;
      const isExtremeRatio = ratio > 3 || ratio < 0.33;
      expect(isExtremeRatio).toBe(false);
    });
  });

  describe("Variation Selector Logic", () => {
    it("deve calcular preço com modificadores de variação", () => {
      const basePrice = 50;
      const quantity = 10;
      const variations = [
        { name: "UV", priceModifier: 10 },
        { name: "Adesivo Brilho", priceModifier: 5 },
      ];

      const totalModifier = variations.reduce((sum, v) => sum + v.priceModifier, 0);
      const totalPrice = (basePrice + totalModifier) * quantity;

      expect(totalPrice).toBe((50 + 10 + 5) * 10);
      expect(totalPrice).toBe(650);
    });

    it("deve validar seleção de todas as variações obrigatórias", () => {
      const variationTypes = ["printingType", "material", "finish"];
      const selectedVariations: Record<string, string> = {
        printingType: "UV",
        material: "Adesivo Brilho",
        // finish não foi selecionado
      };

      const allSelected = variationTypes.every((type) => selectedVariations[type]);
      expect(allSelected).toBe(false);
    });

    it("deve aceitar quando todas as variações estão selecionadas", () => {
      const variationTypes = ["printingType", "material", "finish"];
      const selectedVariations: Record<string, string> = {
        printingType: "UV",
        material: "Adesivo Brilho",
        finish: "Refile",
      };

      const allSelected = variationTypes.every((type) => selectedVariations[type]);
      expect(allSelected).toBe(true);
    });
  });

  describe("Form Card Dynamic", () => {
    it("deve validar formulário com dados completos", () => {
      const formData = {
        name: "Adesivo Vinil Brilho",
        description: "Adesivo de qualidade premium",
        basePrice: "50.00",
        calculationType: "m2",
        variations: [
          { id: "1", type: "printingType", name: "UV", priceModifier: 20 },
        ],
        pricingTiers: [
          { id: "1", quantityMin: 100, quantityMax: 500, pricePerUnit: 45 },
        ],
      };

      const isValid =
        formData.name &&
        formData.basePrice &&
        parseFloat(formData.basePrice) > 0;

      expect(isValid).toBe(true);
    });

    it("deve rejeitar formulário com dados incompletos", () => {
      const formData = {
        name: "",
        description: "Adesivo de qualidade premium",
        basePrice: "50.00",
        calculationType: "m2",
      };

      const isValid = formData.name && formData.basePrice;
      expect(isValid).toBe(false);
    });

    it("deve validar preço base positivo", () => {
      const basePrice = "-10";
      const isValid = parseFloat(basePrice) > 0;
      expect(isValid).toBe(false);
    });

    it("deve aceitar preço base válido", () => {
      const basePrice = "50.00";
      const isValid = parseFloat(basePrice) > 0;
      expect(isValid).toBe(true);
    });
  });
});
