export type ProductionDashboardOrder = {
  status?: string | null;
};

export const PRODUCTION_DASHBOARD_LANES = [
  {
    id: "analysis",
    label: "Para analisar",
    statuses: ["analisando", "com_problemas"],
    description: "Pré-impressão e pendências de arte",
    href: "/admin/pre-impressao",
  },
  {
    id: "production",
    label: "Em produção",
    statuses: ["em_producao"],
    description: "Impressão e acabamento em andamento",
    href: "/admin/status-producao",
  },
  {
    id: "dispatch",
    label: "Prontos",
    statuses: ["pronto_entrega", "pronto_retirada"],
    description: "Pedidos disponíveis para entrega ou retirada",
    href: "/admin/pedidos",
  },
  {
    id: "attention",
    label: "Aguardando liberação",
    statuses: ["pagamento_aprovado", "pagamento_retirada"],
    description: "Aguardando encaminhamento para análise",
    href: "/admin/pedidos",
  },
] as const;

export function getProductionDashboardSummary<T extends ProductionDashboardOrder>(orders: T[] = []) {
  return PRODUCTION_DASHBOARD_LANES.map((lane) => ({
    ...lane,
    count: orders.filter((order) => lane.statuses.includes(order.status as never)).length,
  }));
}

export function getProductionDashboardOverview<T extends ProductionDashboardOrder>(orders: T[] = []) {
  const lanes = getProductionDashboardSummary(orders);
  const analysis = lanes.find((lane) => lane.id === "analysis")?.count || 0;
  const production = lanes.find((lane) => lane.id === "production")?.count || 0;
  const ready = lanes.find((lane) => lane.id === "dispatch")?.count || 0;
  const awaitingRelease = lanes.find((lane) => lane.id === "attention")?.count || 0;
  const issues = orders.filter((order) => order.status === "com_problemas").length;

  return {
    total: orders.length,
    inOperation: analysis + production,
    ready,
    needsAttention: awaitingRelease + issues,
  };
}

export function isProductionPriority(status?: string | null) {
  return ["analisando", "com_problemas", "em_producao"].includes(status || "");
}
