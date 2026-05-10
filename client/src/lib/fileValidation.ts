/**
 * Validação de arquivos para produtos gráficos
 * Suporta: PDF, AI, CDR, PSD, JPG, PNG
 * Validações: DPI, CMYK, sangria, tamanho
 */

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    dpi?: number;
    colorMode?: string;
    hasBleed?: boolean;
    fileSize?: number;
  };
}

// Tipos de arquivo aceitos
const ALLOWED_EXTENSIONS = [".pdf", ".ai", ".cdr", ".psd", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_DPI = 300; // DPI mínimo para impressão
const RECOMMENDED_DPI = 300;

/**
 * Valida arquivo de arte para impressão
 */
export function validateArtFile(file: File): FileValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: FileValidationResult["metadata"] = {
    fileSize: file.size,
  };

  // 1. Validar extensão
  const fileName = file.name.toLowerCase();
  const fileExtension = "." + fileName.split(".").pop();

  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    errors.push(
      `Tipo de arquivo não permitido. Aceitos: ${ALLOWED_EXTENSIONS.join(", ")}`
    );
  }

  // 2. Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `Arquivo muito grande. Máximo: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`
    );
  }

  if (file.size < 100 * 1024) {
    warnings.push("Arquivo muito pequeno. Verifique se contém todo o conteúdo.");
  }

  // 3. Validações específicas por tipo
  if ([".jpg", ".jpeg", ".png"].includes(fileExtension)) {
    // Para imagens, avisar sobre DPI
    warnings.push(
      "Imagens devem ter no mínimo 300 DPI para qualidade de impressão"
    );
    warnings.push("Recomendado: Converter para PDF antes de enviar");
  }

  if (fileExtension === ".pdf") {
    // PDFs devem estar em CMYK
    warnings.push("Verifique se o PDF está em modo CMYK (não RGB)");
    warnings.push("Verifique se há sangria (bleed) de 3mm nas bordas");
  }

  if ([".ai", ".cdr", ".psd"].includes(fileExtension)) {
    // Arquivos de design devem ser convertidos
    warnings.push(
      "Recomendado: Exportar como PDF antes de enviar para melhor compatibilidade"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata,
  };
}

/**
 * Valida regras comerciais para o produto
 */
export interface CommercialRulesValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateCommercialRules(
  quantity: number,
  area: number, // em m²
  productType: string,
  selectedVariations: Record<string, string>
): CommercialRulesValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Quantidade mínima
  if (quantity < 1) {
    errors.push("Quantidade mínima é 1 unidade");
  }

  // 2. Área mínima de cobrança (1m²)
  const minimumArea = 1;
  if (area < minimumArea) {
    errors.push(`Área mínima de cobrança: ${minimumArea}m²`);
  }

  // 3. Validações específicas por tipo de produto
  if (productType === "adesivo") {
    // Adesivo: validar combinações de material e acabamento
    const material = selectedVariations.material;
    const finish = selectedVariations.finish;

    // Adesivo Transparente não pode ter acabamento de refile
    if (material === "Adesivo Transparente" && finish === "Refile") {
      errors.push(
        "Adesivo Transparente não é compatível com acabamento de Refile"
      );
    }

    // Adesivo Blackout não pode ter acabamento de meio corte
    if (material === "Adesivo Blackout" && finish === "Meio Corte") {
      warnings.push(
        "Adesivo Blackout com Meio Corte pode ter qualidade reduzida"
      );
    }
  }

  if (productType === "lona") {
    // Lona: validar gramatura com tipo de mídia
    const media = selectedVariations.media;
    const weight = selectedVariations.weight;

    // Backlight e Sanet não devem ter opção de gramatura
    if (
      (media === "Backlight" || media === "Sanet") &&
      weight &&
      weight !== "Padrão"
    ) {
      warnings.push(`${media} não suporta seleção de gramatura`);
    }
  }

  // 4. Avisos de quantidade
  if (quantity > 10000) {
    warnings.push(
      "Quantidade muito alta. Solicite orçamento especial via WhatsApp"
    );
  }

  if (quantity < 10) {
    warnings.push("Quantidade pequena pode resultar em preço unitário mais alto");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calcula preço com base em regras comerciais
 */
export interface PricingRules {
  basePrice: number;
  minimumArea: number;
  profitMargin: number; // em %
  materialCost: number;
  printingCost: number;
  finishingCost: number;
}

export function calculateFinalPrice(
  area: number, // em m²
  quantity: number,
  variationModifiers: number,
  rules: PricingRules
): number {
  // Aplicar área mínima de cobrança
  const chargeableArea = Math.max(area, rules.minimumArea);

  // Custo base
  let cost = rules.basePrice * chargeableArea * quantity;

  // Adicionar custos específicos
  cost += rules.materialCost * chargeableArea * quantity;
  cost += rules.printingCost * chargeableArea * quantity;
  cost += rules.finishingCost * chargeableArea * quantity;

  // Adicionar modificadores de variação
  cost += variationModifiers * quantity;

  // Aplicar margem de lucro
  const finalPrice = cost * (1 + rules.profitMargin / 100);

  return Math.round(finalPrice * 100) / 100; // Arredondar para 2 casas decimais
}

/**
 * Valida dimensões de arquivo de arte
 */
export function validateDimensions(
  width: number, // em cm
  height: number, // em cm
  productType: string
): CommercialRulesValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Dimensões mínimas
  if (width < 1 || height < 1) {
    errors.push("Dimensões mínimas: 1cm x 1cm");
  }

  // Dimensões máximas (para impressoras padrão)
  const maxWidth = 200; // 2m
  const maxHeight = 300; // 3m

  if (width > maxWidth || height > maxHeight) {
    warnings.push(
      `Dimensões grandes (${width}cm x ${height}cm). Solicite orçamento especial.`
    );
  }

  // Avisos de proporção
  const ratio = width / height;
  if (ratio > 3 || ratio < 0.33) {
    warnings.push(
      "Proporção muito extrema. Verifique se as dimensões estão corretas."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
