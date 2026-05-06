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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

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