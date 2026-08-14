type MenuOrder = {
  status?: string | null;
  createdAt?: Date | string | number | null;
  clientId?: number | null;
};

function isSameLocalDay(value: MenuOrder["createdAt"], reference: Date): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
    && date.getDate() === reference.getDate();
}

export function getAdminMenuIndicators(orders: MenuOrder[] = [], productCount = 0, now = new Date()) {
  const activeCustomerIds = new Set(
    orders
      .map((order) => order.clientId)
      .filter((clientId): clientId is number => typeof clientId === "number" && clientId > 0),
  );

  return {
    salesToday: orders.filter((order) => isSameLocalDay(order.createdAt, now)).length,
    inProduction: orders.filter((order) => order.status === "em_producao").length,
    products: Math.max(0, productCount),
    customersWithOrders: activeCustomerIds.size,
  };
}
