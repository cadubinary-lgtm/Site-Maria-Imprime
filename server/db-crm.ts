import { getDb } from "./db";
import { clients, customerAccounts, orders, orderItems } from "../drizzle/schema";
import { eq, desc, sql, and, like, or, inArray, ne } from "drizzle-orm";
import { aggregateCrmDashboardClients, summarizeCrmDashboard, toSiteDashboardClients } from "./crm-dashboard";

/**
 * Criar novo cliente
 */
export async function createClient(data: {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  clientType: "balcao" | "revendedor" | "agencia" | "corporativo" | "site";
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

  const conditions: any[] = [];
  if (isActive !== undefined) conditions.push(eq(clients.isActive, isActive));
  if (clientType) conditions.push(eq(clients.clientType, clientType as any));

  const result = await db
    .select()
    .from(clients)
    .where(conditions.length > 1 ? and(...conditions) : conditions.length === 1 ? conditions[0] : undefined)
    .orderBy(desc(clients.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Consolida o CRM por cliente usando os vínculos reais orders.clientId e orderItems.orderId.
 * Pedidos cancelados não compõem valor, recorrência ou produtos adquiridos.
 */
export async function getOperationalCrmDashboard(options: {
  limit?: number;
  offset?: number;
  clientType?: string;
  isActive?: boolean;
}) {
  const { limit = 100, offset = 0, clientType, isActive = true } = options;
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions: any[] = [];
  if (isActive !== undefined) conditions.push(eq(clients.isActive, isActive));
  if (clientType) conditions.push(eq(clients.clientType, clientType as any));

  const legacyClientRows = await db
    .select()
    .from(clients)
    .where(conditions.length > 1 ? and(...conditions) : conditions.length === 1 ? conditions[0] : undefined)
    .orderBy(desc(clients.createdAt))
    .limit(limit)
    .offset(offset);

  const siteAccountRows = (!clientType || clientType === "site")
    ? await db
      .select({
        id: customerAccounts.id,
        firstName: customerAccounts.firstName,
        lastName: customerAccounts.lastName,
        email: customerAccounts.email,
        phone: customerAccounts.phone,
        cpfCnpj: customerAccounts.cpfCnpj,
        status: customerAccounts.status,
        createdAt: customerAccounts.createdAt,
      })
      .from(customerAccounts)
      .where(eq(customerAccounts.status, "active"))
      .orderBy(desc(customerAccounts.createdAt))
    : [];

  const clientRows = [
    ...legacyClientRows.map((client) => ({ ...client, source: "crm" })),
    ...toSiteDashboardClients(siteAccountRows),
  ];

  if (clientRows.length === 0) {
    return { clients: [], metrics: summarizeCrmDashboard([]) };
  }

  const legacyClientIds = legacyClientRows.map((client) => client.id);
  const siteCustomerIds = siteAccountRows.map((account) => account.id);
  const legacyOrderCondition = legacyClientIds.length > 0
    ? and(inArray(orders.clientId, legacyClientIds), ne(orders.status, "cancelado"))
    : undefined;
  const siteOrderCondition = siteCustomerIds.length > 0
    ? and(inArray(orders.customerId, siteCustomerIds), ne(orders.status, "cancelado"))
    : undefined;

  const legacyOrderRows = legacyOrderCondition ? await db
    .select({ clientId: orders.clientId, totalPrice: orders.totalPrice, createdAt: orders.createdAt })
    .from(orders)
    .where(legacyOrderCondition) : [];
  const siteOrderRows = siteOrderCondition ? await db
    .select({ customerId: orders.customerId, totalPrice: orders.totalPrice, createdAt: orders.createdAt })
    .from(orders)
    .where(siteOrderCondition) : [];

  const legacyProductRows = legacyOrderCondition ? await db
    .select({ clientId: orders.clientId, productName: orderItems.productName, quantity: orderItems.quantity })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(legacyOrderCondition) : [];
  const siteProductRows = siteOrderCondition ? await db
    .select({ customerId: orders.customerId, productName: orderItems.productName, quantity: orderItems.quantity })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(siteOrderCondition) : [];

  const orderRows = [
    ...legacyOrderRows,
    ...siteOrderRows.flatMap((order) => order.customerId ? [{ clientId: -order.customerId, totalPrice: order.totalPrice, createdAt: order.createdAt }] : []),
  ];
  const productRows = [
    ...legacyProductRows,
    ...siteProductRows.flatMap((item) => item.customerId ? [{ clientId: -item.customerId, productName: item.productName, quantity: item.quantity }] : []),
  ];

  const operationalPriority: Record<string, number> = { atencao: 0, reativar: 1, sem_compras: 2, ativo: 3 };
  const dashboardClients = aggregateCrmDashboardClients(clientRows, orderRows, productRows).sort((left, right) => {
    const priorityDifference = operationalPriority[left.operationalStatus] - operationalPriority[right.operationalStatus];
    if (priorityDifference !== 0) return priorityDifference;
    return (left.daysWithoutPurchase ?? -1) - (right.daysWithoutPurchase ?? -1);
  });
  return { clients: dashboardClients, metrics: summarizeCrmDashboard(dashboardClients) };
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
    clientType: "balcao" | "revendedor" | "agencia" | "corporativo" | "site";
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
  clientType: "balcao" | "revendedor" | "agencia" | "corporativo" | "site"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(clients)
    .where(eq(clients.clientType, clientType as any))
    .orderBy(desc(clients.totalVolume));
}
