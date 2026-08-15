export type ProductionDashboardPeriod = "all" | "this_month" | "last_month" | "custom";

export type ProductionDashboardDateRange = {
  from?: Date;
  to?: Date;
};

function toLocalDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function getProductionDashboardDateRange(
  period: ProductionDashboardPeriod,
  now = new Date(),
  customFrom?: string,
  customTo?: string
): ProductionDashboardDateRange {
  if (period === "all") return {};

  if (period === "custom") {
    const from = toLocalDate(customFrom);
    const to = toLocalDate(customTo);
    if (to) to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  const monthOffset = period === "last_month" ? -1 : 0;
  const from = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

export function isDateInProductionDashboardRange(value: Date | string | number, range: ProductionDashboardDateRange) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}
