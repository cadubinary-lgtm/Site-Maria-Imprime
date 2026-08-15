export type ProductionDashboardFilterOrder = {
  orderNumber: string;
  status?: string | null;
  createdAt: Date | string | number;
  totalPrice: number | string;
};

export type ProductionDashboardSort = "newest" | "oldest" | "highest_value";

function toTimestamp(value: ProductionDashboardFilterOrder["createdAt"]) {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function filterAndSortProductionOrders<T extends ProductionDashboardFilterOrder>(
  orders: T[],
  { query, status, sort }: { query: string; status: string; sort: ProductionDashboardSort }
) {
  const normalizedQuery = query.trim().toLowerCase();
  const result = orders.filter((order) => {
    const matchesQuery = !normalizedQuery || order.orderNumber.toLowerCase().includes(normalizedQuery);
    const matchesStatus = status === "all" || order.status === status;
    return matchesQuery && matchesStatus;
  });

  return result.sort((a, b) => {
    if (sort === "highest_value") return Number(b.totalPrice) - Number(a.totalPrice);
    const direction = sort === "oldest" ? 1 : -1;
    return (toTimestamp(a.createdAt) - toTimestamp(b.createdAt)) * direction;
  });
}
