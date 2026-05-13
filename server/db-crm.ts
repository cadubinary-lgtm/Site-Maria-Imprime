import { getDb } from "./db";
import { clients, orders } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Criar novo cliente
 */
export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  clientType: "balcao" | "revendedor" | "agencia" | "corporativo";
  userId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(clients).values({
    ...data,
    totalVolume: 0 as any,
    totalOrders: 0,
    averageTicket: 0 as any,
    isActive: true,
  });

  return result;
}

/**
 * Obter cliente por ID com histórico
 */
export async function getClientById(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  const client = result.length > 0 ? result[0] : null;

  if (!client) return null;

  // Buscar histórico de pedidos
  const orderHistory = await db
    .select()
    .from(orders)
    .where(eq(orders.clientId, clientId))
    .orderBy(desc(orders.createdAt));

  return {
    ...client,
    orderHistory,
  };
}

/**
 * Listar todos os clientes com paginação
 */
export async function listClients(options: {
  limit?: number;
  offset?: number;
  clientType?: string;
  isActive?: boolean;
}) {
  const { limit = 50, offset = 0, clientType, isActive = true } = options;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(clients)
    .where(
      isActive !== undefined
        ? eq(clients.isActive, isActive)
        : undefined
    )
    .orderBy(desc(clients.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Atualizar cliente
 */
export async function updateClient(
  clientId: number,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    clientType: "balcao" | "revendedor" | "agencia" | "corporativo";
    notes: string;
    isActive: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(clients)
    .set(data)
    .where(eq(clients.id, clientId));

  return result;
}

/**
 * Deletar cliente (soft delete)
 */
export async function deleteClient(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(clients)
    .set({ isActive: false })
    .where(eq(clients.id, clientId));
}

/**
 * Obter estatísticas de cliente
 */
export async function getClientStats(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const clientOrders = await db
    .select({
      totalOrders: sql<number>`COUNT(*)`.as("totalOrders"),
      totalVolume: sql<number>`COALESCE(SUM(CAST(${orders.totalPrice} AS DECIMAL(15,2))), 0)`.as("totalVolume"),
      averageTicket: sql<number>`COALESCE(AVG(CAST(${orders.totalPrice} AS DECIMAL(10,2))), 0)`.as("averageTicket"),
    })
    .from(orders)
    .where(eq(orders.clientId, clientId));

  return clientOrders[0] || {
    totalOrders: 0,
    totalVolume: 0,
    averageTicket: 0,
  };
}

/**
 * Buscar cliente por email
 */
export async function getClientByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(clients).where(eq(clients.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Buscar cliente por telefone/WhatsApp
 */
export async function getClientByPhone(phone: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(clients).where(eq(clients.phone, phone)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Atualizar estatísticas do cliente (chamado após novo pedido)
 */
export async function updateClientStats(clientId: number) {
  const stats = await getClientStats(clientId);
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(clients)
    .set({
      totalVolume: (stats.totalVolume || 0) as any,
      totalOrders: (stats.totalOrders || 0),
      averageTicket: (stats.averageTicket || 0) as any,
    })
    .where(eq(clients.id, clientId));
}

/**
 * Obter top clientes por volume
 */
export async function getTopClients(limit: number = 10) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(clients)
    .where(eq(clients.isActive, true))
    .orderBy(desc(clients.totalVolume))
    .limit(limit);
}

/**
 * Obter clientes por tipo
 */
export async function getClientsByType(
  clientType: "balcao" | "revendedor" | "agencia" | "corporativo"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(clients)
    .where(eq(clients.clientType, clientType as any))
    .orderBy(desc(clients.totalVolume));
}
