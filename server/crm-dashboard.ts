export type CrmOperationalStatus = "ativo" | "reativar" | "atencao" | "sem_compras";

type CrmClientBase = {
  id: number;
  name: string;
  [key: string]: unknown;
};

type CrmOrderRow = {
  clientId: number;
  totalPrice: string | number;
  createdAt: Date;
};

type CrmProductRow = {
  clientId: number;
  productName: string | null;
  quantity: number;
};

export function getDaysWithoutPurchase(lastPurchase: Date | null, now = new Date()) {
  if (!lastPurchase) return null;
  return Math.max(0, Math.floor((now.getTime() - lastPurchase.getTime()) / 86_400_000));
}

export function getCrmOperationalStatus(lastPurchase: Date | null, now = new Date()) {
  const daysWithoutPurchase = getDaysWithoutPurchase(lastPurchase, now);

  if (daysWithoutPurchase === null) {
    return { key: "sem_compras" as const, label: "Sem compras", daysWithoutPurchase };
  }
  if (daysWithoutPurchase <= 30) {
    return { key: "ativo" as const, label: "Ativo", daysWithoutPurchase };
  }
  if (daysWithoutPurchase <= 90) {
    return { key: "reativar" as const, label: "Reativar", daysWithoutPurchase };
  }
  return { key: "atencao" as const, label: "Atenção", daysWithoutPurchase };
}

export function aggregateCrmDashboardClients(
  clientRows: CrmClientBase[],
  orderRows: CrmOrderRow[],
  productRows: CrmProductRow[],
  now = new Date(),
) {
  const summaries = new Map<number, {
    totalOrders: number;
    totalVolume: number;
    lastPurchase: Date | null;
    products: Map<string, number>;
  }>();

  for (const client of clientRows) {
    summaries.set(client.id, { totalOrders: 0, totalVolume: 0, lastPurchase: null, products: new Map() });
  }

  for (const order of orderRows) {
    const summary = summaries.get(order.clientId);
    if (!summary) continue;
    summary.totalOrders += 1;
    summary.totalVolume += Number(order.totalPrice) || 0;
    if (!summary.lastPurchase || order.createdAt.getTime() > summary.lastPurchase.getTime()) {
      summary.lastPurchase = order.createdAt;
    }
  }

  for (const item of productRows) {
    const summary = summaries.get(item.clientId);
    if (!summary) continue;
    const productName = item.productName?.trim() || "Produto sem identificação";
    summary.products.set(productName, (summary.products.get(productName) || 0) + (item.quantity || 0));
  }

  return clientRows.map((client) => {
    const summary = summaries.get(client.id)!;
    const operationalStatus = getCrmOperationalStatus(summary.lastPurchase, now);
    const products = Array.from(summary.products.entries())
      .map(([name, totalQuantity]) => ({ name, totalQuantity }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity || a.name.localeCompare(b.name, "pt-BR"));

    return {
      ...client,
      totalOrders: summary.totalOrders,
      totalVolume: summary.totalVolume,
      averageTicket: summary.totalOrders > 0 ? summary.totalVolume / summary.totalOrders : 0,
      lastPurchase: summary.lastPurchase,
      daysWithoutPurchase: operationalStatus.daysWithoutPurchase,
      operationalStatus: operationalStatus.key,
      operationalStatusLabel: operationalStatus.label,
      products,
      totalProducts: products.reduce((total, product) => total + product.totalQuantity, 0),
    };
  });
}

export function summarizeCrmDashboard(clients: ReturnType<typeof aggregateCrmDashboardClients>) {
  return clients.reduce(
    (summary, client) => {
      summary.totalClients += 1;
      summary.totalVolume += client.totalVolume;
      if (client.totalOrders > 0) summary.clientsWithPurchases += 1;
      if (client.operationalStatus === "ativo") summary.activeClients += 1;
      if (client.operationalStatus === "reativar") summary.reactivationQueue += 1;
      if (client.operationalStatus === "atencao") summary.attentionQueue += 1;
      if (client.operationalStatus === "sem_compras") summary.clientsWithoutPurchases += 1;
      return summary;
    },
    {
      totalClients: 0,
      clientsWithPurchases: 0,
      activeClients: 0,
      reactivationQueue: 0,
      attentionQueue: 0,
      clientsWithoutPurchases: 0,
      totalVolume: 0,
    },
  );
}
