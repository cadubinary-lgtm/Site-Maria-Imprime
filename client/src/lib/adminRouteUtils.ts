/**
 * Utilitário de roteamento inteligente para operadores do painel admin.
 * Baseado nas permissões do operador, retorna a primeira rota disponível.
 */

// Mapa: chave de permissão → rota padrão daquele módulo
const PERMISSION_DEFAULT_ROUTES: Array<{ key: string; route: string }> = [
  { key: "VENDAS",          route: "/admin/pedidos/novos" },
  { key: "LINHA_PRODUCAO",  route: "/admin/producao/kanban" },
  { key: "FINANCEIRO",      route: "/admin/financeiro" },
  { key: "LOGISTICA",       route: "/admin/logistica" },
  { key: "API_PAGAMENTOS",  route: "/admin/pagamentos/mercadopago" },
  { key: "PRODUTOS",        route: "/admin/produtos" },
  { key: "CRM",             route: "/admin/clientes" },
  { key: "RELATORIOS",      route: "/admin/relatorios" },
  { key: "SISTEMA",         route: "/admin/usuarios" },
  { key: "BACKOFFICE",      route: "/admin/perfil" },
];

/**
 * Retorna a rota padrão para o operador com base nas suas permissões.
 * - null (superadmin/acesso total) → /admin (dashboard)
 * - array de permissões → primeira rota disponível
 * - array vazio → /admin/perfil (fallback seguro)
 */
export function getDefaultAdminRoute(
  role: string,
  permissions: string[] | null | undefined
): string {
  // Superadmin ou acesso total → dashboard principal
  if (role === "superadmin" || permissions === null || permissions === undefined) {
    return "/admin";
  }

  // Encontrar a primeira rota que o operador tem permissão
  for (const { key, route } of PERMISSION_DEFAULT_ROUTES) {
    if (permissions.includes(key)) {
      return route;
    }
  }

  // Sem nenhuma permissão → perfil (página sempre disponível)
  return "/admin/perfil";
}
