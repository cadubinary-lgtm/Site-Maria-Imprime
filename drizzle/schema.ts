import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, longtext, boolean, date, bigint } from "drizzle-orm/mysql-core";
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
  segment: mysqlEnum("segment", ["alimentacao", "beleza", "varejo", "servicos"]).notNull(),
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Segments table - segmentos de negócio
 */
export const segments = mysqlTable("segments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  icon: varchar("icon", { length: 10 }),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
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
  userId: int("userId"), // Relacionamento com usuário logado
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["pedido_recebido", "pagamento_aprovado", "arte_em_analise", "aguardando_aprovacao", "em_producao", "impressao", "acabamento", "pronto", "saiu_para_entrega", "entregue", "cancelado"]).default("pedido_recebido").notNull(),
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
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }), // Nome do produto no momento da compra
  quantity: int("quantity").notNull(),
  priceAtOrder: decimal("priceAtOrder", { precision: 10, scale: 2 }).notNull(),
  selectedAttributes: longtext("selectedAttributes"), // JSON com atributos selecionados
  artFileUrl: text("artFileUrl"), // URL do arquivo de arte
  notes: longtext("notes"), // Observações do cliente
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
  previousStatus: mysqlEnum("previousStatus", ["pedido_recebido", "pagamento_aprovado", "arte_em_analise", "aguardando_aprovacao", "em_producao", "impressao", "acabamento", "pronto", "saiu_para_entrega", "entregue", "cancelado"]),
  newStatus: mysqlEnum("newStatus", ["pedido_recebido", "pagamento_aprovado", "arte_em_analise", "aguardando_aprovacao", "em_producao", "impressao", "acabamento", "pronto", "saiu_para_entrega", "entregue", "cancelado"]).notNull(),
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
  type: mysqlEnum("type", ["material", "acabamento"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }),
  description: longtext("description"),
  selectionType: mysqlEnum("selectionType", ["radio", "checkbox", "select", "cards", "chips"]).default("select"),
  visualType: varchar("visualType", { length: 50 }).default("default"),
  order: int("order").default(0).notNull(),
  isRequired: boolean("isRequired").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
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
  clientType: mysqlEnum("clientType", ["balcao", "revendedor", "agencia", "corporativo"]).default("balcao").notNull(),
  totalVolume: decimal("totalVolume", { precision: 15, scale: 2 }).default("0").notNull(), // Volume total comprado
  totalOrders: int("totalOrders").default(0).notNull(), // Quantidade de pedidos
  averageTicket: decimal("averageTicket", { precision: 10, scale: 2 }).default("0").notNull(), // Ticket médio
  notes: longtext("notes"),
  isActive: boolean("isActive").default(true).notNull(),
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
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull().default(1),
  selectedAttributes: longtext("selectedAttributes"), // JSON com atributos selecionados
  customDimensions: varchar("customDimensions", { length: 255 }), // Ex: "2.5x1.5" para m²
  priceAtCart: decimal("priceAtCart", { precision: 10, scale: 2 }).notNull(), // Preço no momento da adição
  artFileUrl: text("artFileUrl"), // URL do arquivo de arte
  artFileKey: varchar("artFileKey", { length: 255 }), // Chave para referência no S3
  notes: longtext("notes"), // Observações do cliente
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
