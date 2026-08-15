import { getDb } from "./db";
import { clients, customerAccounts, orders, orderItems } from "../drizzle/schema";
import { eq, desc, sql, and, like, or, inArray, ne, gte, isNotNull } from "drizzle-orm";
import { aggregateCrmDashboardClients, summarizeCrmDashboard, toSiteDashboardClients } from "./crm-dashboard";
import { getTwoMonthsAgo, rankTopCustomersLastTwoMonths } from "./crm-top-customers";

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
  const { limit = 100, offset = 0, clientType, isActive } = options;
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

  const accountTypeByClientType: Record<string, "customer" | "reseller" | "agency"> = {
    site: "customer",
    revendedor: "reseller",
    agencia: "agency",
  };
  const requestedAccountType = clientType ? accountTypeByClientType[clientType] : undefined;
  const shouldLoadAccounts = !clientType || Boolean(requestedAccountType);

  const siteAccountRows = shouldLoadAccounts
    ? await db
      .select({
        id: customerAccounts.id,
        firstName: customerAccounts.firstName,
        lastName: customerAccounts.lastName,
        email: customerAccounts.email,
        phone: customerAccounts.phone,
        cpfCnpj: customerAccounts.cpfCnpj,
        status: customerAccounts.status,
        accountType: customerAccounts.accountType,
        allowStorePickup: customerAccounts.allowStorePickup,
        createdAt: customerAccounts.createdAt,
      })
      .from(customerAccounts)
      .where(requestedAccountType ? eq(customerAccounts.accountType, requestedAccountType) : undefined)
      .orderBy(desc(customerAccounts.createdAt))
    : [];

  const clientRows = [
    ...legacyClientRows.map((client) => ({ ...client, source: "crm", accountStatus: client.isActive ? "active" : "inactive", allowStorePickup: false })),
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

/** Lista os clientes com maior valor de pedidos não cancelados nos dois meses anteriores. */
export async function getTopCustomersLastTwoMonths(limit = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cutoff = getTwoMonthsAgo();
  const recentOrderCondition = (foreignKey: typeof orders.clientId | typeof orders.customerId) => and(
    isNotNull(foreignKey),
    ne(orders.status, "cancelado"),
    gte(orders.createdAt, cutoff),
  );

  const [legacyOrders, storeOrders] = await Promise.all([
    db.select({ clientId: orders.clientId, totalPrice: orders.totalPrice, createdAt: orders.createdAt })
      .from(orders)
      .where(recentOrderCondition(orders.clientId)),
    db.select({ customerId: orders.customerId, totalPrice: orders.totalPrice, createdAt: orders.createdAt })
      .from(orders)
      .where(recentOrderCondition(orders.customerId)),
  ]);

  const legacyIds = legacyOrders.flatMap((order) => order.clientId ? [order.clientId] : []);
  const customerIds = storeOrders.flatMap((order) => order.customerId ? [order.customerId] : []);
  const [legacyCustomers, storeCustomers] = await Promise.all([
    legacyIds.length ? db.select().from(clients).where(inArray(clients.id, legacyIds)) : [],
    customerIds.length ? db.select({
      id: customerAccounts.id,
      firstName: customerAccounts.firstName,
      lastName: customerAccounts.lastName,
      email: customerAccounts.email,
      phone: customerAccounts.phone,
      accountType: customerAccounts.accountType,
    }).from(customerAccounts).where(inArray(customerAccounts.id, customerIds)) : [],
  ]);

  const normalizedLegacyCustomers = legacyCustomers.map((customer) => ({
    key: `crm:${customer.id}`,
    id: customer.id,
    source: "crm" as const,
    name: customer.name,
    clientType: customer.clientType === "revendedor" || customer.clientType === "agencia" ? customer.clientType : "balcao" as const,
    email: customer.email,
    phone: customer.phone || customer.whatsapp,
  }));
  const normalizedStoreCustomers = storeCustomers.map((customer) => ({
    key: `site:${customer.id}`,
    id: -customer.id,
    externalId: customer.id,
    source: "site" as const,
    name: `${customer.firstName} ${customer.lastName}`.trim(),
    clientType: customer.accountType === "reseller" ? "revendedor" as const : customer.accountType === "agency" ? "agencia" as const : "site" as const,
    email: customer.email,
    phone: customer.phone,
  }));

  const recentOrders = [
    ...legacyOrders.flatMap((order) => order.clientId ? [{ customerKey: `crm:${order.clientId}`, totalPrice: order.totalPrice, createdAt: order.createdAt }] : []),
    ...storeOrders.flatMap((order) => order.customerId ? [{ customerKey: `site:${order.customerId}`, totalPrice: order.totalPrice, createdAt: order.createdAt }] : []),
  ];

  return {
    cutoff,
    customers: rankTopCustomersLastTwoMonths([...normalizedLegacyCustomers, ...normalizedStoreCustomers], recentOrders, { limit }),
  };
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
