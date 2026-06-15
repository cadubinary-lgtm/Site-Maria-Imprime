/**
 * AdminProductionKanban.tsx
 * 
 * Wrapper/Alias para AdminKanban
 * Compartilha o mesmo componente com /admin/pedidos/kanban
 * Qualquer mudança aqui afeta ambas as páginas
 */

import AdminKanban from "./AdminKanban";

export default function AdminProductionKanban() {
  return <AdminKanban />;
}
