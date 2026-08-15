export type RecentCustomer = {
  key: string;
  id: number;
  source: "crm" | "site";
  externalId?: number;
  name: string;
  clientType: "balcao" | "site" | "revendedor" | "agencia";
  email?: string | null;
  phone?: string | null;
};

export type RecentCustomerOrder = {
  customerKey: string;
  totalPrice: string | number | null;
  createdAt: Date | string | number;
};

export function getTwoMonthsAgo(referenceDate = new Date()) {
  const cutoff = new Date(referenceDate);
  cutoff.setMonth(cutoff.getMonth() - 2);
  return cutoff;
}

export function rankTopCustomersLastTwoMonths(
  customers: RecentCustomer[],
  orders: RecentCustomerOrder[],
  options: { now?: Date; limit?: number } = {},
) {
  const { now = new Date(), limit = 30 } = options;
  const cutoff = getTwoMonthsAgo(now);
  const totals = new Map<string, { totalVolume: number; totalOrders: number; lastPurchase: Date }>();

  for (const order of orders) {
    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime()) || createdAt < cutoff) continue;
    const current = totals.get(order.customerKey);
    const totalVolume = Number(order.totalPrice) || 0;
    totals.set(order.customerKey, {
      totalVolume: (current?.totalVolume ?? 0) + totalVolume,
      totalOrders: (current?.totalOrders ?? 0) + 1,
      lastPurchase: !current || createdAt > current.lastPurchase ? createdAt : current.lastPurchase,
    });
  }

  return customers
    .flatMap((customer) => {
      const summary = totals.get(customer.key);
      return summary ? [{ ...customer, ...summary }] : [];
    })
    .sort((left, right) => right.totalVolume - left.totalVolume || right.totalOrders - left.totalOrders || right.lastPurchase.getTime() - left.lastPurchase.getTime() || left.name.localeCompare(right.name, "pt-BR"))
    .slice(0, limit);
}
