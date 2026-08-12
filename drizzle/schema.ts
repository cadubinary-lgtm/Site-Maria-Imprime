import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, longtext, boolean, date, bigint, tinyint } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with role field supporting three roles: user (cliente), admin, production
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "production"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Products table - gerenciada pelo admin
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: longtext("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  segment: varchar("segment", { length: 100 }).notNull().default("geral"),
  category: varchar("category", { length: 255 }), // Categoria do produto
  subcategory: varchar("subcategory", { length: 255 }), // Subcategoria do produto
  imageUrl: text("imageUrl"), // URL da imagem armazenada em S3
  imageKey: varchar("imageKey", { length: 255 }), // Chave para referência no S3
  galleryUrls: longtext("galleryUrls"), // JSON array de URLs de galeria
  calculationType: mysqlEnum("calculationType", ["m2", "metro_linear", "pacote", "unidade"]).default("pacote").notNull(), // Tipo de cálculo
  unit: varchar("unit", { length: 50 }).default("pacote").notNull(), // Unidade (m², metro linear, pacote, unidade)
  pricePerM2: decimal("pricePerM2", { precision: 10, scale: 2 }), // Preço por metro quadrado
  minWidth: decimal("minWidth", { precision: 10, scale: 2 }), // Largura mínima em metros
  maxWidth: decimal("maxWidth", { precision: 10, scale: 2 }), // Largura máxima em metros
  minHeight: decimal("minHeight", { precision: 10, scale: 2 }), // Altura mínima em metros
  maxHeight: decimal("maxHeight", { precision: 10, scale: 2 }), // Altura máxima em metros
  isActive: boolean("isActive").default(true).notNull(),
  requiresAreaCalculation: boolean("requiresAreaCalculation").default(false).notNull(), // Para lona, adesivo, etc
  weight: decimal("weight", { precision: 8, scale: 3 }).default("0").notNull(), // Peso em kg
  height: decimal("height", { precision: 8, scale: 3 }).default("0").notNull(), // Altura em cm
  width: decimal("width", { precision: 8, scale: 3 }).default("0").notNull(), // Largura em cm
  length: decimal("length", { precision: 8, scale: 3 }).default("0").notNull(), // Comprimento em cm
  allowPickup: boolean("allowPickup").default(true).notNull(), // Permite retirada na loja
  allowMotoExpress: boolean("allowMotoExpress").default(true).notNull(), // Permite moto express
  allowedCarriers: longtext("allowedCarriers").default("[]").notNull(), // JSON array de IDs de transportadoras
  specifications: longtext("specifications"), // JSON array de { label, value } para especificações técnicas
  tags: longtext("tags"), // JSON array de tags: ["Mais vendido", "Promoção", "Destaque", "Novo"]
  tagPosition: varchar("tag_position", { length: 30 }).$default(() => "top-right"), // Posição das tags no card
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Configuração institucional singleton da empresa.
 * Isolada das tabelas comerciais, de pedidos e de produtos.
 */
export const companySettings = mysqlTable("companySettings", {
  id: int("id").primaryKey().notNull(),
  legalName: varchar("legalName", { length: 255 }).notNull(),
  tradeName: varchar("tradeName", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }).notNull(),
  stateRegistration: varchar("stateRegistration", { length: 50 }),
  commercialPhone: varchar("commercialPhone", { length: 20 }).notNull(),
  whatsappNumber: varchar("whatsappNumber", { length: 20 }).notNull(),
  showWhatsappButton: boolean("showWhatsappButton").default(true).notNull(),
  whatsappDefaultMessage: text("whatsappDefaultMessage"),
  useWhatsappBusinessHours: boolean("useWhatsappBusinessHours").default(false).notNull(),
  whatsappBusinessDays: varchar("whatsappBusinessDays", { length: 32 }).default("[1,2,3,4,5]").notNull(),
  whatsappStartTime: varchar("whatsappStartTime", { length: 5 }).default("09:00").notNull(),
  whatsappEndTime: varchar("whatsappEndTime", { length: 5 }).default("17:00").notNull(),
  supportEmail: varchar("supportEmail", { length: 255 }).notNull(),
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  street: varchar("street", { length: 255 }).notNull(),
  addressNumber: varchar("addressNumber", { length: 20 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  printLogoUrl: text("printLogoUrl"),
  printLogoKey: varchar("printLogoKey", { length: 255 }),
  nextOsNumber: int("nextOsNumber").notNull().default(1001),
  osTerms: longtext("osTerms"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = typeof companySettings.$inferInsert;

/**
 * Segments table - segmentos de negócio
 */
export const segments = mysqlTable("segments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 500 }), // URL do ícone PNG armazenado em S3
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  position: int("position").notNull().default(0), // Ordem de exibição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Segment = typeof segments.$inferSelect;
export type InsertSegment = typeof segments.$inferInsert;

/**
 * Categories table - categorias dentro de segmentos
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  segmentId: int("segmentId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Product categories junction table - relaciona produtos com categorias
 */
export const productCategories = mysqlTable("productCategories", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  categoryId: int("categoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = typeof productCategories.$inferInsert;

/**
 * Orders table - pedidos dos clientes
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId"), // Relacionamento com usuário Manus OAuth (admin)
  customerId: int("customerId"), // Relacionamento com cliente da loja (customer auth)
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["pagamento_aprovado", "pagamento_retirada", "analisando", "com_problemas", "em_producao", "pronto_entrega", "pronto_retirada", "saiu_entrega", "em_transporte", "entregue", "cancelado"]).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  artFileUrl: text("artFileUrl"), // URL do arquivo de arte enviado
  artFileKey: varchar("artFileKey", { length: 255 }), // Chave para referência no S3
  paymentStatus: mysqlEnum("paymentStatus", ["pendente", "pago", "falhou"]).default("pendente").notNull(),
  notes: longtext("notes"),
  // Endereço de entrega
  deliveryStreet: varchar("deliveryStreet", { length: 255 }),
  deliveryNumber: varchar("deliveryNumber", { length: 10 }),
  deliveryComplement: varchar("deliveryComplement", { length: 255 }),
  deliveryNeighborhood: varchar("deliveryNeighborhood", { length: 255 }),
  deliveryCity: varchar("deliveryCity", { length: 255 }),
  deliveryState: varchar("deliveryState", { length: 2 }),
  deliveryZipCode: varchar("deliveryZipCode", { length: 20 }),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentInstallments: int("payment_installments").default(1),
  deliveryFullName: varchar("deliveryFullName", { length: 255 }),
  deliveryPhone: varchar("deliveryPhone", { length: 20 }),
  // Compra como convidado
  guestToken: varchar("guestToken", { length: 64 }), // Token único para acompanhamento sem login
  guestEmail: varchar("guestEmail", { length: 255 }), // Email do convidado
  guestName: varchar("guestName", { length: 255 }), // Nome do convidado
  // Logística
  shippingMethod: varchar("shippingMethod", { length: 50 }), // pickup, moto_express, carrier_X
  shippingPrice: decimal("shippingPrice", { precision: 10, scale: 2 }).default("0"), // Valor do frete
  shippingLabel: varchar("shippingLabel", { length: 255 }), // Nome exibível da opção de frete (ex: Correios — SEDEX)
  shippingEstimatedDays: int("shippingEstimatedDays").default(0), // Dias estimados
  shippingZipCode: varchar("shippingZipCode", { length: 20 }), // CEP de entrega
  shippingCarrierId: int("shippingCarrierId"), // ID da transportadora (se aplicável)
  // Prazo de entrega (timestamp ms UTC)
  deliveryDeadline: bigint("deliveryDeadline", { mode: "number" }),
  // Status de Pré-Impressão
  preProductionStatus: varchar("preProductionStatus", { length: 50 }).default("liberado_analise"),
  // Status de Produção
  productionStatus: varchar("productionStatus", { length: 50 }).default("pendente"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Order items - itens dentro de cada pedido
 */
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId"),  // nullable: produtos personalizados podem não ter productId
  productName: varchar("productName", { length: 255 }), // Nome do produto no momento da compra
  quantity: int("quantity").notNull(),
  priceAtOrder: decimal("priceAtOrder", { precision: 10, scale: 2 }).notNull(),
  selectedAttributes: longtext("selectedAttributes"), // JSON com atributos selecionados
  variationSnapshot: longtext("variationSnapshot"), // JSON array [{name, value}] snapshot das variações
  customDimensions: varchar("customDimensions", { length: 100 }), // Ex: "1x2" (largura x altura em metros)
  artFileUrl: text("artFileUrl"), // URL do arquivo de arte
  notes: longtext("notes"), // Observações do cliente
  prazoName: varchar("prazoName", { length: 100 }), // Nome do prazo de produção
  prazoHours: int("prazoHours").default(0), // Prazo de produção em horas
  forecastDate: varchar("forecastDate", { length: 50 }), // Data prevista de entrega/retirada
  forecastLabel: varchar("forecastLabel", { length: 255 }), // Texto da previsão de entrega
  shippingMethod: varchar("shippingMethod", { length: 50 }), // Método de frete
  shippingPrice: decimal("shippingPrice", { precision: 10, scale: 2 }).default("0"), // Valor do frete
  shippingLabel: varchar("shippingLabel", { length: 255 }), // Nome exibível do frete
  cepDestino: varchar("cepDestino", { length: 10 }), // CEP de destino
  preProductionStatus: varchar("preProductionStatus", { length: 50 }).default("liberado_analise"), // Status de pré-impressão por item
  requireClientResend: boolean("requireClientResend").default(false), // Operador exigiu reenvio do cliente
  sendProofForApproval: boolean("sendProofForApproval").default(false), // Operador enviou prova para aprovação
  correctionAction: varchar("correctionAction", { length: 50 }), // "resend" ou "proof" - ação liberada
  operatorNote: longtext("operatorNote"), // Mensagem do operador para o cliente
  termText: longtext("termText"), // Termo de responsabilidade editável pelo operador
  clientRefusalNote: longtext("clientRefusalNote"), // Texto de recusa do cliente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

/**
 * Order status history - histórico de mudanças de status
 */
export const orderStatusHistory = mysqlTable("orderStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  previousStatus: mysqlEnum("previousStatus", ["pagamento_aprovado", "pagamento_retirada", "analisando", "com_problemas", "em_producao", "pronto_entrega", "pronto_retirada", "saiu_entrega", "em_transporte", "entregue", "cancelado"]),
  newStatus: mysqlEnum("newStatus", ["pagamento_aprovado", "pagamento_retirada", "analisando", "com_problemas", "em_producao", "pronto_entrega", "pronto_retirada", "saiu_entrega", "em_transporte", "entregue", "cancelado"]).notNull(),
  changedBy: int("changedBy"), // ID do usuário que fez a mudança (admin/production)
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type InsertOrderStatusHistory = typeof orderStatusHistory.$inferInsert;
/**
 * Product variations - tipos de variações (material, acabamento)
 */
export const variationTypes = mysqlTable("variationTypes", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId"),
  globalVariationId: int("globalVariationId"), // referência à variação global de origem (quando vinculada)
  type: mysqlEnum("type", ["material", "acabamento"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: longtext("description"),
  selectionType: mysqlEnum("selectionType", ["radio", "checkbox", "select", "cards", "chips"]).default("select"),
  visualType: varchar("visualType", { length: 50 }).default("default"),
  order: int("order").default(0).notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  scope: varchar("scope", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VariationType = typeof variationTypes.$inferSelect;
export type InsertVariationType = typeof variationTypes.$inferInsert;

/**
 * Variation options - opções dentro de cada tipo de variação
 */
export const variationOptions = mysqlTable("variationOptions", {
  id: int("id").autoincrement().primaryKey(),
  variationTypeId: int("variationTypeId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Adesivo Brilho Premium"
  description: longtext("description"),
  priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }).notNull().default("0"), // Adicional ao preço
  calculationType: varchar("calculationType", { length: 50 }).notNull().default("unit"), // unit | m2 | linear | package
  order: int("order").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VariationOption = typeof variationOptions.$inferSelect;
export type InsertVariationOption = typeof variationOptions.$inferInsert;

/**
 * Order item variations - variações selecionadas para cada item do pedido
 */
export const orderItemVariations = mysqlTable("orderItemVariations", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("orderItemId").notNull(),
  variationOptionId: int("variationOptionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItemVariation = typeof orderItemVariations.$inferSelect;
export type InsertOrderItemVariation = typeof orderItemVariations.$inferInsert;

/**
 * File checks - registro de checagem de arquivos
 */
export const fileChecks = mysqlTable("fileChecks", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("orderItemId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"), // em bytes
  resolution: varchar("resolution", { length: 50 }), // Ex: "300 DPI"
  colorMode: varchar("colorMode", { length: 50 }), // Ex: "CMYK"
  issues: longtext("issues"), // Problemas encontrados
  status: mysqlEnum("status", ["pendente", "aprovado", "rejeitado"]).default("pendente").notNull(),
  checkedAt: timestamp("checkedAt"),
  checkedBy: int("checkedBy"), // ID do admin que fez a checagem
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileCheck = typeof fileChecks.$inferSelect;
export type InsertFileCheck = typeof fileChecks.$inferInsert;

/**
 * Printing Types - Tipos de impressão disponíveis
 * Ex: Digital, Offset, UV, Eco Solvente, etc
 */
export const printingTypes = mysqlTable("printingTypes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // Ex: "Digital", "Offset"
  description: longtext("description"),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrintingType = typeof printingTypes.$inferSelect;
export type InsertPrintingType = typeof printingTypes.$inferInsert;

/**
 * Materials - Materiais/Papéis disponíveis
 * Ex: Couché 90g, Supremo 250g, Adesivo Vinil, Lona, etc
 */
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // Ex: "Couché 90g"
  category: varchar("category", { length: 100 }), // Ex: "Papel", "Vinil", "Lona"
  description: longtext("description"),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

/**
 * Finishes - Acabamentos disponíveis
 * Ex: Refile, Dobra, Laminação, Verniz, etc
 */
export const finishes = mysqlTable("finishes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // Ex: "Refile"
  description: longtext("description"),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Finish = typeof finishes.$inferSelect;
export type InsertFinish = typeof finishes.$inferInsert;

/**
 * Formats - Formatos pré-definidos
 * Ex: A6, A5, A4, A3, 10x15cm, Personalizado, etc
 */
export const formats = mysqlTable("formats", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // Ex: "A4"
  width: decimal("width", { precision: 10, scale: 2 }), // Em mm
  height: decimal("height", { precision: 10, scale: 2 }), // Em mm
  isCustomizable: boolean("isCustomizable").default(false).notNull(), // Se permite personalização
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Format = typeof formats.$inferSelect;
export type InsertFormat = typeof formats.$inferInsert;

/**
 * Print Colors - Cores de impressão
 * Ex: 4x0, 4x1, 4x4, 1x0, 1x1, Preto e Branco, Colorido Total
 */
export const printColors = mysqlTable("printColors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // Ex: "4x0"
  description: longtext("description"),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PrintColor = typeof printColors.$inferSelect;
export type InsertPrintColor = typeof printColors.$inferInsert;

/**
 * Product Printing Types - Relacionamento entre produtos e tipos de impressão
 */
export const productPrintingTypes = mysqlTable("productPrintingTypes", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  printingTypeId: int("printingTypeId").notNull(),
  priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductPrintingType = typeof productPrintingTypes.$inferSelect;
export type InsertProductPrintingType = typeof productPrintingTypes.$inferInsert;

/**
 * Product Materials - Relacionamento entre produtos e materiais
 */
export const productMaterials = mysqlTable("productMaterials", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  materialId: int("materialId").notNull(),
  priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductMaterial = typeof productMaterials.$inferSelect;
export type InsertProductMaterial = typeof productMaterials.$inferInsert;

/**
 * Product Finishes - Relacionamento entre produtos e acabamentos
 */
export const productFinishes = mysqlTable("productFinishes", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  finishId: int("finishId").notNull(),
  priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductFinish = typeof productFinishes.$inferSelect;
export type InsertProductFinish = typeof productFinishes.$inferInsert;

/**
 * Product Formats - Relacionamento entre produtos e formatos
 */
export const productFormats = mysqlTable("productFormats", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  formatId: int("formatId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductFormat = typeof productFormats.$inferSelect;
export type InsertProductFormat = typeof productFormats.$inferInsert;

/**
 * Product Print Colors - Relacionamento entre produtos e cores de impressão
 */
export const productPrintColors = mysqlTable("productPrintColors", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  printColorId: int("printColorId").notNull(),
  priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductPrintColor = typeof productPrintColors.$inferSelect;
export type InsertProductPrintColor = typeof productPrintColors.$inferInsert;

/**
 * Product Pricing - Tabela de preços progressivos por quantidade
 * Ex: 100 unidades = R$ 50, 500 unidades = R$ 40, 1000 unidades = R$ 35
 */
export const productPricing = mysqlTable("productPricing", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  quantityMin: int("quantityMin").notNull(), // Quantidade mínima
  quantityMax: int("quantityMax"), // Quantidade máxima (null = sem limite)
  pricePerUnit: decimal("pricePerUnit", { precision: 10, scale: 2 }).notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductPricing = typeof productPricing.$inferSelect;
export type InsertProductPricing = typeof productPricing.$inferInsert;

/**
 * Product Calculator Config - Configuração da calculadora automática
 * Armazena custos base, margens, prazos, etc
 */
export const productCalculatorConfig = mysqlTable("productCalculatorConfig", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().unique(),
  baseValuePerSqm: decimal("baseValuePerSqm", { precision: 10, scale: 2 }).notNull(), // Valor base por m²
  materialCost: decimal("materialCost", { precision: 10, scale: 2 }).default("0").notNull(),
  printingCost: decimal("printingCost", { precision: 10, scale: 2 }).default("0").notNull(),
  finishingCost: decimal("finishingCost", { precision: 10, scale: 2 }).default("0").notNull(),
  profitMarginPercent: decimal("profitMarginPercent", { precision: 5, scale: 2 }).default("30").notNull(), // Margem de lucro em %
  minimumAreaSqm: decimal("minimumAreaSqm", { precision: 10, scale: 2 }).default("1").notNull(), // Área mínima de cobrança
  productionDays: int("productionDays").default(5).notNull(), // Prazo padrão
  expressProductionDays: int("expressProductionDays").default(2).notNull(), // Prazo expresso
  estimatedWeight: decimal("estimatedWeight", { precision: 10, scale: 2 }), // Peso estimado em kg
  shippingType: mysqlEnum("shippingType", ["retirada", "entrega_propria", "transportadora", "correios"]).default("transportadora").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCalculatorConfig = typeof productCalculatorConfig.$inferSelect;
export type InsertProductCalculatorConfig = typeof productCalculatorConfig.$inferInsert;


/**
 * MÓDULO ERP - Tabelas para gestão completa de produção, clientes e financeiro
 */

/**
 * Clients (CRM) - Gestão de clientes com histórico
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Relacionamento com usuário (opcional)
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  cpfCnpj: varchar("cpfcnpj", { length: 20 }),
  addressZipCode: varchar("addresszipcode", { length: 10 }),
  addressStreet: varchar("addressstreet", { length: 255 }),
  addressNumber: varchar("addressnumber", { length: 20 }),
  addressComplement: varchar("addresscomplement", { length: 100 }),
  addressNeighborhood: varchar("addressneighborhood", { length: 100 }),
  addressCity: varchar("addresscity", { length: 100 }),
  addressState: varchar("addressstate", { length: 2 }),
  clientType: mysqlEnum("clientType", ["balcao", "revendedor", "agencia", "corporativo", "site"]).default("balcao").notNull(),
  totalVolume: decimal("totalVolume", { precision: 15, scale: 2 }).default("0").notNull(), // Volume total comprado
  totalOrders: int("totalOrders").default(0).notNull(), // Quantidade de pedidos
  averageTicket: decimal("averageTicket", { precision: 10, scale: 2 }).default("0").notNull(), // Ticket médio
  notes: longtext("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  allowStorePickup: boolean("allowStorePickup").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Production Jobs - Ficha técnica de produção
 */
export const productionJobs = mysqlTable("productionJobs", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  orderItemId: int("orderItemId").notNull(),
  jobNumber: varchar("jobNumber", { length: 50 }).notNull().unique(), // Ex: PROD-2024-001
  status: mysqlEnum("status", [
    "recebido",
    "pagamento_aprovado",
    "pre_impressao",
    "producao",
    "acabamento",
    "controle_qualidade",
    "finalizado",
    "pronto_retirada",
    "enviado"
  ]).default("recebido").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  dimensions: varchar("dimensions", { length: 100 }), // Ex: "210x297mm"
  material: varchar("material", { length: 255 }),
  printingType: varchar("printingType", { length: 255 }),
  finish: varchar("finish", { length: 255 }),
  quantity: int("quantity").notNull(),
  assignedTo: int("assignedTo"), // ID do usuário (production) responsável
  deadline: timestamp("deadline"),
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductionJob = typeof productionJobs.$inferSelect;
export type InsertProductionJob = typeof productionJobs.$inferInsert;

/**
 * Financial Records - Registro de transações financeiras
 */
export const financialRecords = mysqlTable("financialRecords", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  type: mysqlEnum("type", ["venda", "custo", "lucro", "devolucao"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: varchar("description", { length: 255 }),
  paymentMethod: mysqlEnum("paymentMethod", [
    "dinheiro",
    "cartao_credito",
    "cartao_debito",
    "boleto",
    "pix",
    "transferencia",
    "cheque"
  ]),
  status: mysqlEnum("status", ["pendente", "processando", "concluido", "falhou"]).default("pendente").notNull(),
  recordedBy: int("recordedBy"), // ID do admin que registrou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FinancialRecord = typeof financialRecords.$inferSelect;
export type InsertFinancialRecord = typeof financialRecords.$inferInsert;

/**
 * File Validations - Validação de arquivos Web2Print
 */
export const fileValidations = mysqlTable("fileValidations", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"), // em bytes
  dpi: int("dpi"), // Resolução em DPI
  colorMode: varchar("colorMode", { length: 50 }), // CMYK, RGB, etc
  hasBleed: boolean("hasBleed"), // Tem sangria
  hasSafeMargin: boolean("hasSafeMargin"), // Tem margem de segurança
  issues: longtext("issues"), // Problemas encontrados
  status: mysqlEnum("status", [
    "enviado",
    "em_analise",
    "aprovado",
    "correcao_solicitada",
    "rejeitado"
  ]).default("enviado").notNull(),
  validatedBy: int("validatedBy"), // ID do admin que validou
  validatedAt: timestamp("validatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FileValidation = typeof fileValidations.$inferSelect;
export type InsertFileValidation = typeof fileValidations.$inferInsert;

/**
 * Automation Logs - Log de automações (WhatsApp, Email, etc)
 */
export const automationLogs = mysqlTable("automationLogs", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  type: mysqlEnum("type", ["whatsapp", "email", "sms", "notificacao"]).notNull(),
  recipient: varchar("recipient", { length: 255 }).notNull(), // Telefone, email, etc
  message: longtext("message"),
  status: mysqlEnum("status", ["pendente", "enviado", "falhou"]).default("pendente").notNull(),
  errorMessage: longtext("errorMessage"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = typeof automationLogs.$inferInsert;

/**
 * Production Status History - Histórico detalhado de mudanças de status na produção
 */
export const productionStatusHistory = mysqlTable("productionStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  productionJobId: int("productionJobId").notNull(),
  previousStatus: varchar("previousStatus", { length: 100 }),
  newStatus: varchar("newStatus", { length: 100 }).notNull(),
  changedBy: int("changedBy"), // ID do usuário que fez a mudança
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductionStatusHistory = typeof productionStatusHistory.$inferSelect;
export type InsertProductionStatusHistory = typeof productionStatusHistory.$inferInsert;

/**
 * Daily Sales Report - Relatório diário de vendas
 */
export const dailySalesReports = mysqlTable("dailySalesReports", {
  id: int("id").autoincrement().primaryKey(),
  reportDate: date("reportDate").notNull(),
  totalSales: decimal("totalSales", { precision: 15, scale: 2 }).default("0").notNull(),
  totalCosts: decimal("totalCosts", { precision: 15, scale: 2 }).default("0").notNull(),
  totalProfit: decimal("totalProfit", { precision: 15, scale: 2 }).default("0").notNull(),
  ordersCount: int("ordersCount").default(0).notNull(),
  averageTicket: decimal("averageTicket", { precision: 10, scale: 2 }).default("0").notNull(),
  topProduct: varchar("topProduct", { length: 255 }),
  topProductQuantity: int("topProductQuantity").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailySalesReport = typeof dailySalesReports.$inferSelect;
export type InsertDailySalesReport = typeof dailySalesReports.$inferInsert;

/**
 * Product Costs - Custos de produção por produto
 */
export const productCosts = mysqlTable("productCosts", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  materialCost: decimal("materialCost", { precision: 10, scale: 2 }).default("0").notNull(),
  laborCost: decimal("laborCost", { precision: 10, scale: 2 }).default("0").notNull(),
  equipmentCost: decimal("equipmentCost", { precision: 10, scale: 2 }).default("0").notNull(),
  overheadCost: decimal("overheadCost", { precision: 10, scale: 2 }).default("0").notNull(),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).default("0").notNull(),
  profitMarginPercent: decimal("profitMarginPercent", { precision: 5, scale: 2 }).default("30").notNull(),
  lastUpdatedBy: int("lastUpdatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductCost = typeof productCosts.$inferSelect;
export type InsertProductCost = typeof productCosts.$inferInsert;


/**
 * ========================================
 * SISTEMA DE ATRIBUTOS DINÂMICOS
 * ========================================
 * Tabelas para sistema de atributos reutilizáveis
 * que permite renderização automática de interfaces
 */

/**
 * Attributes - Atributos globais reutilizáveis
 * Ex: Material, Acabamento, Revestimento, Prazo, Medidas, Quantidade
 */
export const attributes = mysqlTable("attributes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // Ex: "Material", "Acabamento"
  slug: varchar("slug", { length: 255 }).notNull().unique(), // Ex: "material", "acabamento"
  description: longtext("description"),
  type: mysqlEnum("type", [
    "button", // Botões de seleção
    "select", // Dropdown
    "card", // Cards com imagem
    "radio", // Radio buttons
    "checkbox", // Checkboxes
    "numeric", // Campo numérico
    "text", // Campo de texto
    "measures", // Medidas personalizadas
  ]).notNull(),
  icon: varchar("icon", { length: 100 }), // Ícone para exibição
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).default("0").notNull(), // Preço base do atributo
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Attribute = typeof attributes.$inferSelect;
export type InsertAttribute = typeof attributes.$inferInsert;

/**
 * Attribute values - Valores possíveis para cada atributo
 * Ex: Para Material: "Couchê 90g", "Couchê 115g", "Vinil brilho", etc
 */
export const attributeValues = mysqlTable("attributeValues", {
  id: int("id").autoincrement().primaryKey(),
  attributeId: int("attributeId").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  value: varchar("value", { length: 255 }).notNull(), // Ex: "Couchê 90g"
  description: longtext("description"),
  // ⚠️ DEPRECATED: Preços agora estão em productAttributes (vínculo)
  // Mantido por compatibilidade, será removido em versão futura
  priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }).default("0").notNull(), // Impacto no preço
  timeModifier: int("timeModifier").default(0).notNull(), // Impacto no prazo em horas
  weightModifier: decimal("weightModifier", { precision: 10, scale: 4 }).default("0").notNull(), // Impacto no peso em kg
  icon: varchar("icon", { length: 100 }), // Ícone para exibição
  image: text("image"), // URL de imagem para cards
  displayOrder: int("displayOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttributeValue = typeof attributeValues.$inferSelect;
export type InsertAttributeValue = typeof attributeValues.$inferInsert;

/**
 * ⚠️ NOTA: Os preços em attributeValues são DEPRECATED
 * Use productAttributes.priceModifier em vez disso (vínculo produto↔atributo)
 */

/**
 * Product attributes - Vinculação entre produtos e atributos
 * Define quais atributos um produto utiliza
 * ✨ NOVO: Centraliza precificação no vínculo (não no atributo global!)
 */
export const productAttributes = mysqlTable(
  "productAttributes",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
    attributeId: int("attributeId").notNull().references(() => attributes.id, { onDelete: "cascade" }),
    
    // Configuração do vínculo
    isRequired: boolean("isRequired").default(true).notNull(), // Se é obrigatório selecionar
    allowMultiple: boolean("allowMultiple").default(false).notNull(), // Se permite múltiplas seleções
    displayOrder: int("displayOrder").default(0).notNull(),
    
    // ✨ NOVO: Precificação no vínculo (por produto, não global!)
    priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }).default("0").notNull(), // +R$15 para este produto
    calculationType: mysqlEnum("calculationType", [
      "fixed",          // Valor fixo
      "percentage",     // Percentual do preço base
      "multiplier",     // Multiplicador (ex: 1.5x)
      "per_sqm",        // Por metro quadrado
      "per_quantity",   // Por quantidade
    ]).default("fixed").notNull(),
    
    // ✨ NOVO: Impacto no prazo e peso
    timeModifier: int("timeModifier").default(0).notNull(), // Impacto no prazo em horas
    weightModifier: decimal("weightModifier", { precision: 10, scale: 4 }).default("0").notNull(), // Impacto no peso em kg
    
    // ✨ NOVO: Controle fino de ativação
    isActive: boolean("isActive").default(true).notNull(), // Se este atributo está ativo para o produto
    priority: int("priority").default(0).notNull(), // Ordem de exibição
    
    // ✨ NOVO: Regras específicas do vínculo (JSON para flexibilidade)
    rules: text("rules"), // JSON com regras adicionais
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    // Índices para performance - criados via SQL migration
  })
);

export type ProductAttribute = typeof productAttributes.$inferSelect;
export type InsertProductAttribute = typeof productAttributes.$inferInsert;

/**
 * Type para ProductAttribute com tipagem forte de calculationType
 */
export type ProductAttributeWithPricing = ProductAttribute & {
  calculationType: "fixed" | "percentage" | "multiplier" | "per_sqm" | "per_quantity";
  rules?: Record<string, any>;
};

/**
 * Product attribute values - Quais valores de atributo estão disponíveis para um produto
 * Ex: Produto "Cartão de Visita" pode usar "Couchê 250g" e "Couchê 300g" mas não "Lona 280g"
 * ✨ NOVO: Permite override de preço por valor específico
 */
export const productAttributeValues = mysqlTable(
  "productAttributeValues",
  {
    id: int("id").autoincrement().primaryKey(),
    productAttributeId: int("productAttributeId").notNull().references(() => productAttributes.id, { onDelete: "cascade" }),
    attributeValueId: int("attributeValueId").notNull().references(() => attributeValues.id, { onDelete: "cascade" }),
    isEnabled: boolean("isEnabled").default(true).notNull(), // Ativar/desativar valor específico
    
    // ✨ NOVO: Preço pode variar por valor também (opcional)
    priceModifier: decimal("priceModifier", { precision: 10, scale: 2 }), // Override do preço para este valor
    calculationType: mysqlEnum("calculationType", [
      "fixed",
      "percentage",
      "multiplier",
      "per_sqm",
      "per_quantity",
    ]), // Override do tipo de cálculo
    
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    // Índices para performance - criados via SQL migration
  })
);

export type ProductAttributeValue = typeof productAttributeValues.$inferSelect;
export type InsertProductAttributeValue = typeof productAttributeValues.$inferInsert;

/**
 * Type para ProductAttributeValue com tipagem forte
 */
export type ProductAttributeValueWithPricing = ProductAttributeValue & {
  calculationType?: "fixed" | "percentage" | "multiplier" | "per_sqm" | "per_quantity";
};

/**
 * Attribute rules - Regras dinâmicas entre atributos
 * Ex: "Se material = Lona, então mostrar acabamento = Ilhós"
 */
export const attributeRules = mysqlTable("attributeRules", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Lona requer ilhós"
  description: longtext("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttributeRule = typeof attributeRules.$inferSelect;
export type InsertAttributeRule = typeof attributeRules.$inferInsert;

/**
 * Attribute rule conditions - Condições de uma regra
 * Ex: "Material = Lona"
 */
export const attributeRuleConditions = mysqlTable("attributeRuleConditions", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull().references(() => attributeRules.id, { onDelete: "cascade" }),
  attributeId: int("attributeId").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  operator: mysqlEnum("operator", ["equals", "contains", "greaterThan", "lessThan", "in"]).notNull(),
  value: varchar("value", { length: 255 }).notNull(), // Valor a comparar
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttributeRuleCondition = typeof attributeRuleConditions.$inferSelect;
export type InsertAttributeRuleCondition = typeof attributeRuleConditions.$inferInsert;

/**
 * Attribute rule actions - Ações de uma regra
 * Ex: "Mostrar Acabamento = Ilhós"
 */
export const attributeRuleActions = mysqlTable("attributeRuleActions", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull().references(() => attributeRules.id, { onDelete: "cascade" }),
  targetAttributeId: int("targetAttributeId").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["show", "hide", "enable", "disable", "setPrice", "addPrice"]).notNull(),
  value: varchar("value", { length: 255 }), // Valor para a ação (ex: preço adicional)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AttributeRuleAction = typeof attributeRuleActions.$inferSelect;
export type InsertAttributeRuleAction = typeof attributeRuleActions.$inferInsert;

/**
 * Order item attributes - Atributos selecionados para cada item do pedido
 * Substitui orderItemVariations com sistema mais genérico
 */
export const orderItemAttributes = mysqlTable("orderItemAttributes", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("orderItemId").notNull().references(() => orderItems.id, { onDelete: "cascade" }),
  attributeValueId: int("attributeValueId").notNull().references(() => attributeValues.id, { onDelete: "cascade" }),
  customValue: varchar("customValue", { length: 255 }), // Para campos numéricos ou texto livre
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OrderItemAttribute = typeof orderItemAttributes.$inferSelect;
export type InsertOrderItemAttribute = typeof orderItemAttributes.$inferInsert;


/**
 * Product Segments - Tabela relacional para múltiplos segmentos por produto
 * Permite que um produto pertença a vários segmentos (many-to-many)
 */
export const productSegments = mysqlTable("productSegments", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  segmentId: int("segmentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductSegment = typeof productSegments.$inferSelect;
export type InsertProductSegment = typeof productSegments.$inferInsert;


/**
 * Pricing Rules - Itens de precificação reutilizáveis
 * Substitui o sistema anterior de "regras condicionais"
 * Agora são itens configuráveis com preço, categoria, status
 * Exemplo: Couchê 300g (+R$10), Laminação Fosca (+R$15), etc.
 */
export const pricingRules = mysqlTable("pricingRules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Couchê 300g"
  category: varchar("category", { length: 255 }).notNull(), // Ex: "PAPÉIS", "REVESTIMENTOS", "ACABAMENTOS"
  description: text("description"), // Descrição opcional
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(), // Valor adicional
  calculationType: mysqlEnum("calculationType", [
    "fixed",          // Valor fixo
    "percentage",     // Percentual do preço base
    "multiplier",     // Multiplicador (ex: 1.5x)
    "per_sqm",        // Por metro quadrado
    "per_quantity",   // Por quantidade
  ]).default("fixed").notNull(),
  isActive: boolean("isActive").default(true).notNull(), // Ativo/Inativo
  priority: int("priority").default(0).notNull(), // Ordem de exibição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingRule = typeof pricingRules.$inferSelect;
export type InsertPricingRule = typeof pricingRules.$inferInsert;

/**
 * Product Delivery Options - Opções de prazo de entrega para produtos m²
 * Ex: Normal (5 dias), Expresso 24h, Mesmo Dia
 */
export const productDeliveryOptions = mysqlTable("productDeliveryOptions", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Normal", "24 Horas", "Mesmo Dia"
  daysToDeliver: int("daysToDeliver").notNull(), // Número de dias úteis
  pricePerM2: decimal("pricePerM2", { precision: 10, scale: 2 }).default("0").notNull(), // Valor adicional por m²
  isActive: boolean("isActive").default(true).notNull(),
  order: int("order").default(0).notNull(), // Ordenação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductDeliveryOption = typeof productDeliveryOptions.$inferSelect;
export type InsertProductDeliveryOption = typeof productDeliveryOptions.$inferInsert;

/**
 * Cart Items - Itens no carrinho do cliente
 */
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),          // null para visitantes anônimos
  sessionId: varchar("sessionId", { length: 64 }), // cart_session cookie para visitantes
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(1),
  selectedAttributes: longtext("selectedAttributes"), // JSON com atributos selecionados
  customDimensions: varchar("customDimensions", { length: 255 }), // Ex: "2.5x1.5" para m²
  priceAtCart: decimal("priceAtCart", { precision: 10, scale: 2 }).notNull(), // Preço no momento da adição
  artFileUrl: text("artFileUrl"), // URL do arquivo de arte
  artFileKey: varchar("artFileKey", { length: 255 }), // Chave para referência no S3
  notes: longtext("notes"), // Observações do cliente
  shippingMethod: varchar("shippingMethod", { length: 50 }).default("retirada"), // Método de frete pré-selecionado
  shippingPrice: decimal("shippingPrice", { precision: 10, scale: 2 }).notNull().default("0"), // Valor do frete escolhido
  shippingLabel: varchar("shippingLabel", { length: 255 }), // Nome exibível da opção de frete
  variationSnapshot: longtext("variationSnapshot"), // JSON com variações selecionadas {name, value}
  prazoName: varchar("prazoName", { length: 100 }), // Nome do prazo de produção
  prazoHours: int("prazoHours").default(0), // Prazo de produção em horas
  forecastDate: varchar("forecastDate", { length: 50 }), // Data prevista de entrega/retirada
  forecastLabel: varchar("forecastLabel", { length: 255 }), // Texto da previsão de entrega
  cepDestino: varchar("cepDestino", { length: 10 }), // CEP de destino informado pelo cliente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * Customer Addresses - Endereços de entrega do cliente
 */
export const customerAddresses = mysqlTable("customerAddresses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Casa", "Escritório"
  fullName: varchar("fullName", { length: 255 }).notNull(), // Nome completo para entrega
  phone: varchar("phone", { length: 20 }).notNull(),
  street: varchar("street", { length: 255 }).notNull(),
  number: varchar("number", { length: 10 }).notNull(),
  complement: varchar("complement", { length: 255 }), // Apto, sala, etc
  neighborhood: varchar("neighborhood", { length: 255 }).notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(), // UF
  zipCode: varchar("zipCode", { length: 10 }).notNull(),
  country: varchar("country", { length: 100 }).default("Brasil").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = typeof customerAddresses.$inferInsert;

/**
 * Customer Profile - Perfil estendido do cliente
 */
export const customerProfiles = mysqlTable("customerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  companyName: varchar("companyName", { length: 255 }),
  totalSpent: decimal("totalSpent", { precision: 15, scale: 2 }).default("0").notNull(),
  totalOrders: int("totalOrders").default(0).notNull(),
  lastOrderDate: timestamp("lastOrderDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

// ============================================================
// CUSTOMER AUTH — Autenticação própria de clientes (email/senha)
// ============================================================

/**
 * Customer Accounts — contas de clientes com email/senha próprio
 * Separado do sistema Manus OAuth (que é usado pelo admin)
 */
export const customerAccounts = mysqlTable("customer_accounts", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  cpfCnpj: varchar("cpfCnpj", { length: 20 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 255 }),
  emailVerificationExpires: bigint("emailVerificationExpires", { mode: "number" }),
  resetPasswordToken: varchar("resetPasswordToken", { length: 255 }),
  resetPasswordExpires: bigint("resetPasswordExpires", { mode: "number" }),
  status: mysqlEnum("status", ["active", "inactive", "blocked"]).default("inactive").notNull(),
  lastLogin: bigint("lastLogin", { mode: "number" }),
  loginAttempts: int("loginAttempts").default(0).notNull(),
  lockedUntil: bigint("lockedUntil", { mode: "number" }),
  // Permissões especiais
  allowStorePickup: boolean("allowStorePickup").default(false).notNull(),
  // Endereço de entrega padrão
  addressZipCode: varchar("addressZipCode", { length: 10 }),
  addressStreet: varchar("addressStreet", { length: 255 }),
  addressNumber: varchar("addressNumber", { length: 20 }),
  addressComplement: varchar("addressComplement", { length: 100 }),
  addressNeighborhood: varchar("addressNeighborhood", { length: 100 }),
  addressCity: varchar("addressCity", { length: 100 }),
  addressState: varchar("addressState", { length: 2 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
});
export type CustomerAccount = typeof customerAccounts.$inferSelect;
export type InsertCustomerAccount = typeof customerAccounts.$inferInsert;

/**
 * Customer Sessions — sessões de clientes autenticados
 */
export const customerSessions = mysqlTable("customer_sessions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().references(() => customerAccounts.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: bigint("expiresAt", { mode: "number" }).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: varchar("userAgent", { length: 500 }),
});
export type CustomerSession = typeof customerSessions.$inferSelect;
export type InsertCustomerSession = typeof customerSessions.$inferInsert;

/**
 * Order Art Previews — Prévias de arte enviadas pelo admin para o cliente
 * O admin faz upload de uma imagem de prévia que fica visível na página de acompanhamento
 */
export const orderArtPreviews = mysqlTable("orderArtPreviews", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  orderItemId: int("orderItemId"),        // ID do item do pedido (para prévias por item)
  imageUrl: text("imageUrl").notNull(),   // URL no S3
  imageKey: varchar("imageKey", { length: 255 }).notNull(), // Chave no S3
  uploadedBy: int("uploadedBy"),          // ID do admin que fez o upload
  notes: text("notes"),                   // Observação opcional do admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrderArtPreview = typeof orderArtPreviews.$inferSelect;
export type InsertOrderArtPreview = typeof orderArtPreviews.$inferInsert;


// ─────────────────────────────────────────────────────────────────────────────
// LOGÍSTICA — Melhor Envio API v2
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Configurações globais do Melhor Envio
 * Armazena token Bearer, email, CEP de origem e modo sandbox
 */
export const logisticsSettings = mysqlTable("logisticsSettings", {
  id: int("id").autoincrement().primaryKey(),
  accessToken: text("accessToken"), // Bearer token do Melhor Envio
  email: varchar("email", { length: 320 }), // E-mail da conta Melhor Envio
  originCep: varchar("originCep", { length: 9 }), // CEP de origem (somente dígitos)
  // Dados do remetente (para geração de etiquetas)
  senderName: varchar("senderName", { length: 150 }),
  senderPhone: varchar("senderPhone", { length: 20 }),
  senderDocument: varchar("senderDocument", { length: 20 }), // CPF ou CNPJ
  senderAddress: varchar("senderAddress", { length: 255 }),
  senderNumber: varchar("senderNumber", { length: 20 }),
  senderComplement: varchar("senderComplement", { length: 100 }),
  senderDistrict: varchar("senderDistrict", { length: 100 }),
  senderCity: varchar("senderCity", { length: 100 }),
  senderStateAbbr: varchar("senderStateAbbr", { length: 2 }),
  sandbox: boolean("sandbox").default(false).notNull(), // false = produção (padrão), true = sandbox
  // Horário limite de produção (cut-off) — pedidos após esse horário somam +1 dia útil ao frete local
  cutoffTime: varchar("cutoffTime", { length: 5 }).default("13:00").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LogisticsSettings = typeof logisticsSettings.$inferSelect;
export type InsertLogisticsSettings = typeof logisticsSettings.$inferInsert;

/**
 * Transportadoras do Melhor Envio
 * Sincronizadas via GET /api/v2/me/shipment/companies
 */
export const carriers = mysqlTable("carriers", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().unique(), // ID da empresa no Melhor Envio
  name: varchar("name", { length: 100 }).notNull(), // Ex: "Correios", "Jadlog"
  code: varchar("code", { length: 50 }).notNull().unique(), // slug único
  logoUrl: text("logoUrl"), // URL do logo
  isActive: boolean("isActive").default(true).notNull(), // Habilitada para clientes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = typeof carriers.$inferInsert;

/**
 * Expedições — registro de envios gerados pelo Melhor Envio
 */
export const shipments = mysqlTable("shipments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  meOrderId: varchar("meOrderId", { length: 100 }), // ID do pedido no Melhor Envio
  serviceId: int("serviceId"), // ID do serviço de frete escolhido
  serviceName: varchar("serviceName", { length: 100 }),
  companyName: varchar("companyName", { length: 100 }),
  trackingCode: varchar("trackingCode", { length: 100 }),
  labelUrl: text("labelUrl"),
  price: decimal("price", { precision: 10, scale: 2 }),
  estimatedDelivery: varchar("estimatedDelivery", { length: 50 }),
  status: mysqlEnum("status", ["pending", "cart", "paid", "posted", "delivered", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;

/**
 * Eventos de rastreamento
 */
export const trackingEvents = mysqlTable("trackingEvents", {
  id: int("id").autoincrement().primaryKey(),
  shipmentId: int("shipmentId").notNull(),
  status: varchar("status", { length: 100 }).notNull(),
  location: varchar("location", { length: 255 }),
  description: text("description"),
  eventTime: bigint("eventTime", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TrackingEvent = typeof trackingEvents.$inferSelect;
export type InsertTrackingEvent = typeof trackingEvents.$inferInsert;


/**
 * Store Settings - Configurações globais da loja
 */
export const storeSettings = mysqlTable("storeSettings", {
  id: int("id").autoincrement().primaryKey(),
  // Configurações de Origem (Correios)
  originCEP: varchar("originCEP", { length: 10 }), // CEP de origem para cálculo de frete
  correiosUser: varchar("correiosUser", { length: 255 }), // Usuário/CNPJ para API dos Correios
  correiosPassword: varchar("correiosPassword", { length: 255 }), // Código de acesso CWS dos Correios
  correiosContractNumber: varchar("correiosContractNumber", { length: 255 }), // Número do contrato
  correiosPostalCard: varchar("correiosPostalCard", { length: 255 }), // Número do cartão de postagem
  // Token de autenticação
  correiosToken: text("correiosToken"), // Bearer token da API dos Correios
  correiosTokenExpiry: timestamp("correiosTokenExpiry"), // Data de expiração do token
  // Dados de Remetente (para geração de etiquetas e declarações)
  senderStreet: varchar("senderStreet", { length: 255 }), // Rua
  senderNumber: varchar("senderNumber", { length: 20 }), // Número
  senderComplement: varchar("senderComplement", { length: 255 }), // Complemento
  senderNeighborhood: varchar("senderNeighborhood", { length: 255 }), // Bairro
  senderCity: varchar("senderCity", { length: 255 }), // Cidade
  senderState: varchar("senderState", { length: 2 }), // Estado (UF)
  // Mercado Pago
  mercadopagoAccessToken: text("mercadopagoAccessToken"),
  mercadopagoPublicKey: varchar("mercadopagoPublicKey", { length: 255 }),
  mercadopagoWebhookSecret: varchar("mercadopagoWebhookSecret", { length: 255 }),
  mercadopagoSandbox: tinyint("mercadopagoSandbox").default(1).notNull(),
  mercadopagoPixEnabled: tinyint("mercadopagoPixEnabled").default(1).notNull(),
  mercadopagoCardEnabled: tinyint("mercadopagoCardEnabled").default(1).notNull(),
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreSettings = typeof storeSettings.$inferSelect;
export type InsertStoreSettings = typeof storeSettings.$inferInsert;


/**
 * Fiscal Settings - Configurações fiscais da empresa emissora
 * Tabela NOVA - não altera nenhuma tabela existente
 */
export const fiscalSettings = mysqlTable("fiscalSettings", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }),
  tradeName: varchar("tradeName", { length: 200 }),
  cnpj: varchar("cnpj", { length: 20 }),
  stateRegistration: varchar("stateRegistration", { length: 50 }),
  cityRegistration: varchar("cityRegistration", { length: 50 }),
  address: varchar("address", { length: 300 }),
  zipCode: varchar("zipCode", { length: 10 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 200 }),
  emitMode: mysqlEnum("emitMode", ["manual", "on_payment", "on_completed"]).default("manual"),
  documentType: mysqlEnum("documentType", ["nfse", "nfe", "both"]).default("nfse"),
  certificateFilename: varchar("certificateFilename", { length: 200 }),
  certificateKey: text("certificateKey"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FiscalSettings = typeof fiscalSettings.$inferSelect;
export type InsertFiscalSettings = typeof fiscalSettings.$inferInsert;

/**
 * Fiscal Notes - Notas fiscais emitidas
 * Tabela NOVA - não altera nenhuma tabela existente
 */
export const fiscalNotes = mysqlTable("fiscalNotes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  noteNumber: varchar("noteNumber", { length: 50 }),
  noteType: mysqlEnum("noteType", ["nfse", "nfe"]).default("nfse"),
  status: mysqlEnum("status", ["pending", "issued", "cancelled", "voided", "error"]).default("pending"),
  customerName: varchar("customerName", { length: 200 }),
  customerCpf: varchar("customerCpf", { length: 14 }),
  customerCnpj: varchar("customerCnpj", { length: 18 }),
  customerEmail: varchar("customerEmail", { length: 200 }),
  customerPhone: varchar("customerPhone", { length: 20 }),
  customerAddress: text("customerAddress"),
  totalValue: decimal("totalValue", { precision: 10, scale: 2 }),
  shippingValue: decimal("shippingValue", { precision: 10, scale: 2 }).default("0"),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  issueDate: bigint("issueDate", { mode: "number" }),
  cancelDate: bigint("cancelDate", { mode: "number" }),
  pdfUrl: text("pdfUrl"),
  xmlUrl: text("xmlUrl"),
  errorMessage: text("errorMessage"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FiscalNote = typeof fiscalNotes.$inferSelect;
export type InsertFiscalNote = typeof fiscalNotes.$inferInsert;

/**
 * Fiscal Note Items - Itens das notas fiscais
 * Tabela NOVA - não altera nenhuma tabela existente
 */
export const fiscalNoteItems = mysqlTable("fiscalNoteItems", {
  id: int("id").autoincrement().primaryKey(),
  fiscalNoteId: int("fiscalNoteId").notNull(),
  productName: varchar("productName", { length: 200 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FiscalNoteItem = typeof fiscalNoteItems.$inferSelect;
export type InsertFiscalNoteItem = typeof fiscalNoteItems.$inferInsert;

/**
 * Cash Flow Entries - Entradas manuais no fluxo de caixa
 * Tabela NOVA - não altera nenhuma tabela existente
 */
export const cashFlowEntries = mysqlTable("cashFlowEntries", {
  id: int("id").autoincrement().primaryKey(),
  entryType: mysqlEnum("entryType", ["income", "expense"]).notNull(),
  category: varchar("category", { length: 100 }),
  description: varchar("description", { length: 300 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  entryDate: bigint("entryDate", { mode: "number" }).notNull(),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CashFlowEntry = typeof cashFlowEntries.$inferSelect;
export type InsertCashFlowEntry = typeof cashFlowEntries.$inferInsert;

/**
 * ============================================================
 * GERENCIADOR FINANCEIRO - Tabelas próprias independentes
 * Não altera nenhuma tabela existente do sistema
 * ============================================================
 */

/**
 * financeiro - Tabela central do Gerenciador Financeiro
 * Registra todos os movimentos financeiros vinculados a pedidos
 */
export const financeiro = mysqlTable("financeiro", {
  id: int("id").autoincrement().primaryKey(),
  pedidoId: int("pedidoId"),
  orderNumber: varchar("orderNumber", { length: 50 }),
  cliente: varchar("cliente", { length: 255 }),
  telefone: varchar("telefone", { length: 30 }),
  email: varchar("email", { length: 255 }),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: mysqlEnum("formaPagamento", [
    "dinheiro", "pix", "cartao_credito", "cartao_debito",
    "boleto", "transferencia", "pagar_na_retirada", "outro"
  ]).default("outro"),
  formaEntrega: mysqlEnum("formaEntrega", [
    "retirada_loja", "moto_express", "transportadora", "correios", "outro"
  ]).default("outro"),
  status: mysqlEnum("status", [
    "a_receber", "aguardando_producao", "pronto_retirada",
    "pago", "retirado_cliente", "retirado_terceiros", "cancelado"
  ]).default("a_receber").notNull(),
  dataVencimento: bigint("dataVencimento", { mode: "number" }),
  dataPagamento: bigint("dataPagamento", { mode: "number" }),
  dataRetiradaPrevista: bigint("dataRetiradaPrevista", { mode: "number" }),
  observacoes: text("observacoes"),
  pixQrCode: text("pixQrCode"),
  pixCopiaECola: text("pixCopiaECola"),
  cobrancaEnviada: boolean("cobrancaEnviada").default(false),
  dataCobranca: bigint("dataCobranca", { mode: "number" }),
  criadoPor: int("criadoPor"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});
export type Financeiro = typeof financeiro.$inferSelect;
export type InsertFinanceiro = typeof financeiro.$inferInsert;

/**
 * financeiroNotificacoes - Alertas e notificações financeiras
 */
export const financeiroNotificacoes = mysqlTable("financeiroNotificacoes", {
  id: int("id").autoincrement().primaryKey(),
  financeiroId: int("financeiroId").notNull(),
  tipo: mysqlEnum("tipo", [
    "aguardando_pagamento", "aguardando_retirada",
    "retirada_atrasada", "cobranca_vencida", "pagamento_pendente_7dias"
  ]).notNull(),
  mensagem: text("mensagem"),
  lida: boolean("lida").default(false),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});
export type FinanceiroNotificacao = typeof financeiroNotificacoes.$inferSelect;
export type InsertFinanceiroNotificacao = typeof financeiroNotificacoes.$inferInsert;

// ============================================================
// ARQUITETURA SaaS — Autenticação Própria de Administradores
// Independente do Manus OAuth. Admins fazem login em /admin/login
// com email + senha. Roles: superadmin | admin | production
// ============================================================

/**
 * adminAccounts — Administradores do sistema com autenticação própria
 * Separado do Manus OAuth. Login exclusivo via /admin/login
 */
export const adminAccounts = mysqlTable("adminAccounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["superadmin", "admin", "production"]).default("admin").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  lastLogin: bigint("lastLogin", { mode: "number" }),
  loginAttempts: int("loginAttempts").default(0).notNull(),
  lockedUntil: bigint("lockedUntil", { mode: "number" }),
  createdBy: int("createdBy"), // ID do adminAccount que criou
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull(),
  permissions: longtext("permissions"), // JSON array de permissões de menu
});
export type AdminAccount = typeof adminAccounts.$inferSelect;
export type InsertAdminAccount = typeof adminAccounts.$inferInsert;

/**
 * adminSessions — Sessões JWT dos administradores
 */
export const adminSessions = mysqlTable("adminSessions", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull().references(() => adminAccounts.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 512 }).notNull().unique(),
  expiresAt: bigint("expiresAt", { mode: "number" }).notNull(),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  ipAddress: varchar("ipAddress", { length: 50 }),
  userAgent: varchar("userAgent", { length: 500 }),
});
export type AdminSession = typeof adminSessions.$inferSelect;
export type InsertAdminSession = typeof adminSessions.$inferInsert;

/**
 * auditLogs — Registro de auditoria de todas as ações administrativas
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId"), // null = ação do sistema
  adminName: varchar("adminName", { length: 150 }),
  action: varchar("action", { length: 100 }).notNull(), // ex: "create_admin", "update_order"
  entity: varchar("entity", { length: 100 }).notNull(), // ex: "adminAccounts", "orders"
  entityId: varchar("entityId", { length: 50 }), // ID do registro afetado
  before: text("before"), // JSON do estado anterior
  after: text("after"),   // JSON do estado posterior
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Local Delivery Rules — Regras de Entrega Local (Motoboy por cidade)
 * Permite cadastrar cidades próximas com valor fixo e prazo de entrega
 */
export const localDeliveryRules = mysqlTable("localDeliveryRules", {
  id: int("id").autoincrement().primaryKey(),
  neighborhood: varchar("neighborhood", { length: 150 }).notNull(),  // Nome do bairro/regiao (ex: Tamoios, Centro, Pero)
  stateAbbr: varchar("stateAbbr", { length: 2 }).notNull(),          // UF ex: RJ
  cepStart: varchar("cepStart", { length: 8 }).notNull(),            // CEP inicial da faixa (ex: 28900000)
  cepEnd: varchar("cepEnd", { length: 8 }).notNull(),                // CEP final da faixa (ex: 28900999)
  deliveryType: mysqlEnum("deliveryType", ["moto", "carro"]).notNull(), // Tipo de entrega
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),    // Valor do frete
  deliveryDays: int("deliveryDays").default(1).notNull(),            // Prazo em dias uteis
  description: varchar("description", { length: 255 }),              // Ex: "Entrega Local - Moto" ou "Entrega Local - Carro"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LocalDeliveryRule = typeof localDeliveryRules.$inferSelect;
export type InsertLocalDeliveryRule = typeof localDeliveryRules.$inferInsert;

/**
 * Order Payments — Registros de pagamento via Mercado Pago
 */
export const orderPayments = mysqlTable("orderPayments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  paymentId: varchar("paymentId", { length: 100 }).notNull(),
  method: mysqlEnum("method", ["pix", "credit_card", "boleto", "other"]).notNull().default("pix"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  qrCode: text("qrCode"),
  qrCodeBase64: text("qrCodeBase64"),
  installments: int("installments").default(1),
  lastFourDigits: varchar("lastFourDigits", { length: 4 }),
  expiresAt: varchar("expiresAt", { length: 50 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }),
});
export type OrderPayment = typeof orderPayments.$inferSelect;
export type InsertOrderPayment = typeof orderPayments.$inferInsert;

/**
 * Email history table - registra todos os e-mails enviados aos clientes
 */
export const emailHistory = mysqlTable("emailHistory", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  orderItemId: int("orderItemId"), // Opcional: se relacionado a um item específico
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  emailType: mysqlEnum("emailType", [
    "art_resend_request",      // Solicitação de reenvio de arte
    "proof_for_approval",       // Prova enviada para aprovação
    "order_confirmation",       // Confirmação de pedido
    "payment_confirmation",     // Confirmação de pagamento
    "production_started",       // Produção iniciada
    "ready_for_pickup",         // Pronto para retirada
    "ready_for_delivery",       // Pronto para entrega
    "shipped",                  // Enviado
    "delivered",                // Entregue
    "order_cancelled",          // Pedido cancelado
    "other"                     // Outro tipo
  ]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  templateName: varchar("templateName", { length: 100 }), // Nome do template usado (sendArtResendRequestEmail, etc)
  operatorNote: text("operatorNote"), // Nota do operador que disparou o e-mail
  proofImageUrl: text("proofImageUrl"), // URL da imagem de prova (se aplicável)
  status: mysqlEnum("status", ["sent", "failed", "bounced"]).default("sent").notNull(),
  errorMessage: text("errorMessage"), // Mensagem de erro se falhou
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailHistory = typeof emailHistory.$inferSelect;
export type InsertEmailHistory = typeof emailHistory.$inferInsert;

/**
 * orderItemLogs — Histórico de ações de pré-impressão por item de pedido
 * Registra cada ação do operador: envio de prova, exigência de reenvio, início de produção
 */
export const orderItemLogs = mysqlTable("orderItemLogs", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("orderItemId").notNull(),
  orderId: int("orderId").notNull(),
  action: varchar("action", { length: 200 }).notNull(), // ex: "Enviou prova para aprovação", "Exigiu reenvio de arte", "Iniciou produção"
  operatorName: varchar("operatorName", { length: 150 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type OrderItemLog = typeof orderItemLogs.$inferSelect;
export type InsertOrderItemLog = typeof orderItemLogs.$inferInsert;


/**
 * Quotations (Orçamentos) - Tabela principal de orçamentos
 */
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  quotationNumber: varchar("quotationNumber", { length: 50 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  operatorId: int("operatorId").notNull(), // Usuário que criou o orçamento
  status: mysqlEnum("status", ["rascunho", "enviado", "em_negociacao", "aprovado", "recusado", "expirado", "cancelado"]).notNull().default("rascunho"),
  
  // Snapshot financeiro (imutável)
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountType: mysqlEnum("discountType", ["percentual", "fixo"]).default("fixo"),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).default("0"),
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0"), // Valor final do desconto aplicado
  shippingPrice: decimal("shippingPrice", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  
  // Entrega
  shippingMethod: varchar("shippingMethod", { length: 50 }), // pickup, delivery, carrier_X
  shippingLabel: varchar("shippingLabel", { length: 255 }), // Nome exibível
  shippingEstimatedDays: int("shippingEstimatedDays").default(0),
  deliveryAddress: longtext("deliveryAddress"), // JSON com endereço completo
  
  // Condições comerciais
  paymentMethod: varchar("paymentMethod", { length: 50 }), // pix, dinheiro, cartao, boleto
  productionDeadline: int("productionDeadline").default(0), // Dias de produção
  quotationValidity: int("quotationValidity").default(30), // Dias de validade
  commercialNotes: longtext("commercialNotes"), // Observações comerciais
  
  // Snapshot JSON (preserva todas as configurações)
  itemsSnapshot: longtext("itemsSnapshot").notNull(), // JSON com array de itens
  
  // Conversão
  convertedOrderId: int("convertedOrderId"), // ID do pedido gerado
  convertedProductionJobId: int("convertedProductionJobId"), // ID da OS gerada
  
  // Datas
  sentAt: timestamp("sentAt"), // Data de envio ao cliente
  approvedAt: timestamp("approvedAt"), // Data de aprovação
  expiresAt: timestamp("expiresAt"), // Data de expiração
  canceledAt: timestamp("canceledAt"), // Data de cancelamento
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

/**
 * Quotation Items - Itens dentro de cada orçamento (snapshot imutável)
 */
export const quotationItems = mysqlTable("quotationItems", {
  id: int("id").autoincrement().primaryKey(),
  quotationId: int("quotationId").notNull(),
  
  // Snapshot do produto
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  productImage: varchar("productImage", { length: 255 }), // URL da imagem
  
  // Configurações (snapshot JSON)
  specifications: longtext("specifications").notNull(), // JSON com medidas, acabamentos, etc
  artFileUrl: text("artFileUrl"), // URL do arquivo de arte
  artFileKey: varchar("artFileKey", { length: 255 }), // Chave S3
  
  // Preço e quantidade (snapshot)
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = typeof quotationItems.$inferInsert;

/**
 * Quotation History - Histórico de mudanças de status
 */
export const quotationHistory = mysqlTable("quotationHistory", {
  id: int("id").autoincrement().primaryKey(),
  quotationId: int("quotationId").notNull(),
  previousStatus: varchar("previousStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  operatorId: int("operatorId").notNull(),
  notes: longtext("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuotationHistory = typeof quotationHistory.$inferSelect;
export type InsertQuotationHistory = typeof quotationHistory.$inferInsert;
