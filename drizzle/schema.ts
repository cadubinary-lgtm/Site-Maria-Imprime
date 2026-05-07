import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, longtext, boolean } from "drizzle-orm/mysql-core";
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
  imageUrl: text("imageUrl"), // URL da imagem armazenada em S3
  imageKey: varchar("imageKey", { length: 255 }), // Chave para referência no S3
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
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  status: mysqlEnum("status", ["aguardando", "em_producao", "enviado", "entregue"]).default("aguardando").notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  artFileUrl: text("artFileUrl"), // URL do arquivo de arte enviado
  artFileKey: varchar("artFileKey", { length: 255 }), // Chave para referência no S3
  paymentStatus: mysqlEnum("paymentStatus", ["pendente", "pago", "falhou"]).default("pendente").notNull(),
  notes: longtext("notes"),
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
  quantity: int("quantity").notNull(),
  priceAtOrder: decimal("priceAtOrder", { precision: 10, scale: 2 }).notNull(),
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
  previousStatus: mysqlEnum("previousStatus", ["aguardando", "em_producao", "enviado", "entregue"]),
  newStatus: mysqlEnum("newStatus", ["aguardando", "em_producao", "enviado", "entregue"]).notNull(),
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
  productId: int("productId").notNull(),
  type: mysqlEnum("type", ["material", "acabamento"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Material", "Acabamento"
  isRequired: boolean("isRequired").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
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
