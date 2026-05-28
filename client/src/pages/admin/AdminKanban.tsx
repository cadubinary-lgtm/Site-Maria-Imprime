import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// ─── Colunas do Kanban (fluxo de produção) ──────────────────────────────────
const KANBAN_COLUMNS = [
  { id: "pagamento_aprovado",  label: "Pagamento Aprovado",     icon: "💳", bg: "bg-green-50",   border: "border-green-200",   badge: "bg-green-100 text-green-800",   header: "bg-green-500" },
  { id: "pagamento_retirada",  label: "Pagamento na Retirada",  icon: "🏪", bg: "bg-blue-50",    border: "border-blue-200",    badge: "bg-blue-100 text-blue-800",    header: "bg-blue-500" },
  { id: "analisando",          label: "Analisando",             icon: "🔍", bg: "bg-orange-50",  border: "border-orange-200",  badge: "bg-orange-100 text-orange-800", header: "bg-orange-500" },
  { id: "com_problemas",       label: "Com Problemas",          icon: "⚠️", bg: "bg-red-50",     border: "border-red-200",     badge: "bg-red-100 text-red-800",      header: "bg-red-500" },
  { id: "em_producao",         label: "Em Produção",            icon: "⚙️", bg: "bg-purple-50",  border: "border-purple-200",  badge: "bg-purple-100 text-purple-800", header: "bg-purple-500" },
  { id: "pronto_entrega",      label: "Pronto para Entrega",    icon: "🚚", bg: "bg-teal-50",    border: "border-teal-200",    badge: "bg-teal-100 text-teal-800",    header: "bg-teal-500" },
  { id: "pronto_retirada",     label: "Pronto para Retirada",   icon: "🎁", bg: "bg-cyan-50",    border: "border-cyan-200",    badge: "bg-cyan-100 text-cyan-800",    header: "bg-cyan-500" },
  { id: "entregue",            label: "Entregue",               icon: "✔️", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800",header: "bg-emerald-500" },
  { id: "cancelado",           label: "Cancelado",              icon: "❌", bg: "bg-red-50",     border: "border-red-200",     badge: "bg-red-100 text-red-800",      header: "bg-red-500" },
];

// Status seguintes para avançar o pedido
const NEXT_STATUS: Record<string, string> = {
  pagamento_aprovado:  "analisando",
  pagamento_retirada:  "analisando",
  analisando:          "em_producao",
  com_problemas:       "analisando",
  em_producao:         "pronto_entrega",
  pronto_entrega:      "entregue",
  pronto_retirada:     "entregue",
};

type Order = {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: string | number;
  createdAt: string | number | Date;
  clientId?: number;
};

function KanbanCard({ order, onAdvance, onCancel, isUpdating }: {
  order: Order;
  onAdvance: (id: number, nextStatus: string) => void;
  onCancel: (id: number) => void;
  isUpdating: boolean;
}) {
  const col = KANBAN_COLUMNS.find(c => c.id === order.status);
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2 hover:shadow-md transition-shadow">
      {/* Número do pedido + link */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-gray-900">{order.orderNumber}</span>
        <Link href={`/admin/pedidos/${order.id}`}>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-orange-500 cursor-pointer" />
        </Link>
      </div>

      {/* Valor */}
      <div className="text-xs text-gray-500">
        R$ {parseFloat(order.totalPrice.toString()).toFixed(2)}
      </div>

      {/* Data */}
      <div className="text-xs text-gray-400">
        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
      </div>

      {/* Badge de status */}
      {col && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${col.badge}`}>
          {col.icon} {col.label}
        </span>
      )}

      {/* Ações */}
      <div className="flex gap-1 pt-1">
        {nextStatus && (
          <button
            onClick={() => onAdvance(order.id, nextStatus)}
            disabled={isUpdating}
            className="flex-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded px-2 py-1 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? "..." : "Avançar →"}
          </button>
        )}
        {order.status !== "cancelado" && order.status !== "entregue" && (
          <button
            onClick={() => onCancel(order.id)}
            disabled={isUpdating}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded px-2 py-1 disabled:opacity-50 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminKanban() {
  const { data: allOrders, isLoading, refetch } = trpc.checkout.getAllOrders.useQuery();
  const updateStatusMutation = trpc.checkout.updateOrderStatus.useMutation();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(["entregue", "cancelado"]));

  const handleAdvance = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateStatusMutation.mutateAsync({ orderId, newStatus: nextStatus as any });
      toast.success("Status atualizado!");
      refetch();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancel = async (orderId: number) => {
    if (!confirm("Cancelar este pedido?")) return;
    setUpdatingId(orderId);
    try {
      await updateStatusMutation.mutateAsync({ orderId, newStatus: "cancelado" });
      toast.success("Pedido cancelado");
      refetch();
    } catch {
      toast.error("Erro ao cancelar pedido");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleCol = (colId: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const orders: Order[] = (allOrders ?? []) as Order[];

  // Agrupar pedidos por status
  const byStatus: Record<string, Order[]> = {};
  for (const col of KANBAN_COLUMNS) {
    byStatus[col.id] = orders.filter(o => o.status === col.id);
  }

  const visibleCols = KANBAN_COLUMNS.filter(c => !hiddenCols.has(c.id));

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban de Produção</h1>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} no total
          </p>
        </div>
        <Link href="/admin/pedidos">
          <button className="text-sm text-orange-600 hover:text-orange-700 underline">
            Ver lista de pedidos →
          </button>
        </Link>
      </div>

      {/* Filtro de colunas visíveis */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500 self-center">Mostrar/ocultar:</span>
        {KANBAN_COLUMNS.map(col => (
          <button
            key={col.id}
            onClick={() => toggleCol(col.id)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              hiddenCols.has(col.id)
                ? "bg-gray-100 text-gray-400 border-gray-200"
                : `${col.badge} border-transparent`
            }`}
          >
            {col.icon} {col.label} ({byStatus[col.id].length})
          </button>
        ))}
      </div>

      {/* Kanban Board — scroll horizontal */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${visibleCols.length * 220}px` }}>
          {visibleCols.map(col => {
            const colOrders = byStatus[col.id];
            return (
              <div
                key={col.id}
                className={`flex-shrink-0 w-52 rounded-xl border ${col.border} ${col.bg} overflow-hidden`}
              >
                {/* Header da coluna */}
                <div className={`${col.header} px-3 py-2 flex items-center justify-between`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{col.icon}</span>
                    <span className="text-white text-xs font-semibold leading-tight">{col.label}</span>
                  </div>
                  <span className="bg-white/30 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-4">Nenhum pedido</p>
                  ) : (
                    colOrders.map(order => (
                      <KanbanCard
                        key={order.id}
                        order={order}
                        onAdvance={handleAdvance}
                        onCancel={handleCancel}
                        isUpdating={updatingId === order.id}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
