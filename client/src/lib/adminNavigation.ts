export type AdminReturnTarget = {
  path: string;
  label: string;
};

const ADMIN_ORIGIN_KEY = "admin_navigation_origin";

const DETAIL_PATHS = [
  /^\/admin\/pedidos\/\d+$/,
  /^\/admin\/os\/\d+$/,
  /^\/admin\/orcamentos\/\d+(?:\/editar)?$/,
];

const RETURN_LABELS: Record<string, string> = {
  "/admin": "Voltar ao Painel",
  "/admin/pedidos": "Voltar para Pedidos",
  "/admin/pedidos/novos": "Voltar para Novos Pedidos",
  "/admin/pedidos/kanban": "Voltar para Kanban",
  "/admin/producao/kanban": "Voltar para Kanban de Produção",
  "/admin/pre-impressao": "Voltar para Pré-Impressão",
  "/admin/status-producao": "Voltar para Status de Produção",
  "/admin/os": "Voltar para Ordens de Serviço",
  "/admin/orcamentos": "Voltar para Orçamentos",
  "/admin/produtos": "Voltar para Produtos",
  "/admin/fiscal/notas": "Voltar para Notas Fiscais",
  "/admin/financeiro/receber": "Voltar para Contas a Receber",
  "/admin/financeiro/recebidas": "Voltar para Contas Recebidas",
  "/admin/financeiro/retirada": "Voltar para Pagamentos na Retirada",
  "/admin/financeiro-dashboard": "Voltar para Dashboard Financeiro",
  "/admin/gerenciador-financeiro/receber": "Voltar para Contas a Receber",
  "/admin/gerenciador-financeiro/recebidas": "Voltar para Contas Recebidas",
  "/admin/gerenciador-financeiro/retirada": "Voltar para Pagamentos na Retirada",
  "/admin/gerenciador-financeiro/fluxo": "Voltar para Fluxo de Caixa",
  "/admin/gerenciador-financeiro/relatorios": "Voltar para Relatórios Financeiros",
};

function normalizeAdminPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const path = value.split("?")[0] ?? "";
  return path.startsWith("/admin") || path.startsWith("/producao") ? path : null;
}

export function isAdminDetailPath(path: string): boolean {
  const cleanPath = path.split("?")[0] ?? path;
  return DETAIL_PATHS.some((pattern) => pattern.test(cleanPath));
}

export function rememberAdminOrigin(path: string): void {
  const origin = normalizeAdminPath(path);
  if (!origin || isAdminDetailPath(origin) || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ADMIN_ORIGIN_KEY, origin);
  } catch {
    // A navegação deve continuar funcionando mesmo se o armazenamento estiver indisponível.
  }
}

export function createAdminDetailLocation(target: string, origin: string): string {
  const safeOrigin = normalizeAdminPath(origin);
  if (!safeOrigin) return target;
  const separator = target.includes("?") ? "&" : "?";
  return `${target}${separator}from=${encodeURIComponent(safeOrigin)}`;
}

export function getAdminReturnTarget(fallbackPath: string): AdminReturnTarget {
  let origin: string | null = null;

  if (typeof window !== "undefined") {
    const from = new URLSearchParams(window.location.search).get("from");
    origin = from === "kanban" ? "/admin/pedidos/kanban" : normalizeAdminPath(from);

    if (!origin) {
      try {
        origin = normalizeAdminPath(window.sessionStorage.getItem(ADMIN_ORIGIN_KEY));
      } catch {
        origin = null;
      }
    }
  }

  const path = origin ?? fallbackPath;
  return {
    path,
    label: RETURN_LABELS[path] ?? "Voltar",
  };
}
