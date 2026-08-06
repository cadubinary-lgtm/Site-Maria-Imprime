import AdminLayout from "@/components/AdminLayout";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

// ─── Colunas do Kanban (fluxo de produção) ──────────────────────────────────
const KANBAN_COLUMNS = [
  { id: "pagamento_aprovado",  label: "Pagamento Aprovado",     icon: "💳", bg: "bg-gray-50",   border: "border-t-4 border-emerald-500",   badge: "bg-gray-200 text-gray-700",   header: "bg-white" },
  { id: "pagamento_retirada",  label: "Pagamento na Retirada",  icon: "🏪", bg: "bg-gray-50",    border: "border-t-4 border-blue-500",    badge: "bg-gray-200 text-gray-700",    header: "bg-white" },
  { id: "analisando",          label: "Analisando",             icon: "🔍", bg: "bg-gray-50",  border: "border-t-4 border-purple-500",  badge: "bg-gray-200 text-gray-700", header: "bg-white" },
  { id: "com_problemas",       label: "Com Problemas",          icon: "⚠️", bg: "bg-gray-50",     border: "border-t-4 border-amber-500",     badge: "bg-gray-200 text-gray-700",      header: "bg-white" },
  { id: "em_producao",         label: "Em Produção",            icon: "⚙️", bg: "bg-gray-50",  border: "border-t-4 border-pink-500",  badge: "bg-gray-200 text-gray-700", header: "bg-white" },
  { id: "pronto_entrega",      label: "Pronto para Entrega",    icon: "🚚", bg: "bg-gray-50",    border: "border-t-4 border-cyan-500",    badge: "bg-gray-200 text-gray-700",    header: "bg-white" },
  { id: "pronto_retirada",     label: "Pronto para Retirada",   icon: "🎁", bg: "bg-gray-50",    border: "border-t-4 border-indigo-500",    badge: "bg-gray-200 text-gray-700",    header: "bg-white" },
  { id: "entregue",            label: "Entregue",               icon: "✔️", bg: "bg-gray-50", border: "border-t-4 border-emerald-500", badge: "bg-gray-200 text-gray-700",header: "bg-white" },
  { id: "cancelado",           label: "Cancelado",              icon: "❌", bg: "bg-gray-50",     border: "border-t-4 border-gray-400",     badge: "bg-gray-200 text-gray-700",      header: "bg-white" },
];

// Status seguintes para avançar o pedido (com_problemas não avança via botão genérico)
const NEXT_STATUS: Record<string, string> = {
  pagamento_aprovado:  "analisando",
  pagamento_retirada:  "analisando",
  analisando:          "em_producao",
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

type ArtState = "waiting" | "approved" | "refused" | "none";

// ─── Tag visual de estado da arte ────────────────────────────────────────────
function ArtStateTag({ state }: { state: ArtState }) {
  if (state === "waiting") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
        ⏳ Aguardando Cliente
      </span>
    );
  }
  if (state === "approved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
        ⚠️ Cliente Aprovou a Arte
      </span>
    );
  }
  if (state === "refused") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
        ❌ Cliente Recusou a Arte
      </span>
    );
  }
  return null;
}

function KanbanCard({ order, artState, onAdvance, onCancel, isUpdating }: {
  order: Order;
  artState: ArtState;
  onAdvance: (id: number, nextStatus: string) => void;
  onCancel: (id: number) => void;
  isUpdating: boolean;
}) {
  const col = KANBAN_COLUMNS.find(c => c.id === order.status);
  const nextStatus = NEXT_STATUS[order.status];
  const isComProblemas = order.status === "com_problemas";

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 space-y-2 hover:shadow-md transition-shadow">
      {/* Número do pedido + link */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-gray-900">{order.orderNumber}</span>
        <Link href={`/admin/pedidos/${order.id}`}>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 hover:text-orange-500 cursor-pointer" />
        </Link>
      </div>

      {/* Valor OU tag de estado da arte (apenas na coluna Com Problemas) */}
      {isComProblemas && artState !== "none" ? (
        <ArtStateTag state={artState} />
      ) : (
        <div className="text-xs text-gray-500">
          R$ {parseFloat(order.totalPrice.toString()).toFixed(2)}
        </div>
      )}

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
        {/* Na coluna com_problemas, não há botão Avançar genérico — o operador usa o detalhe do pedido */}
        {!isComProblemas && nextStatus && (
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

  const orders: Order[] = (allOrders ?? []) as Order[];

  // IDs dos pedidos na coluna "Com Problemas" para buscar estado das artes
  const comProblemasIds = useMemo(
    () => orders.filter(o => o.status === "com_problemas").map(o => o.id),
    [orders]
  );

  const { data: artStatusMap = {} } = trpc.checkout.getOrdersArtStatus.useQuery(
    { orderIds: comProblemasIds },
    { enabled: comProblemasIds.length > 0 }
  );

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

  // Agrupar pedidos por status
  const byStatus: Record<string, Order[]> = {};
  for (const col of KANBAN_COLUMNS) {
    byStatus[col.id] = orders.filter(o => o.status === col.id);
  }

  const visibleCols = KANBAN_COLUMNS.filter(c => !hiddenCols.has(c.id));

  return (
    <AdminLayout>
    <div className="p-5 space-y-4">
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
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-gray-200">
        <span className="text-xs text-gray-600 font-semibold self-center">Mostrar/ocultar:</span>
        {KANBAN_COLUMNS.map(col => (
          <button
            key={col.id}
            onClick={() => toggleCol(col.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              hiddenCols.has(col.id)
                ? "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-150"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
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
                <div className={`${col.header} ${col.border} px-3 py-3 flex items-center justify-between border-b border-gray-200`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{col.icon}</span>
                    <span className="text-gray-700 text-xs font-semibold leading-tight">{col.label}</span>
                  </div>
                  <span className="bg-gray-200 text-gray-700 text-xs font-semibold rounded-full px-2 py-0.5">
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
                        artState={(artStatusMap as Record<number, ArtState>)[order.id] ?? "none"}
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
    </AdminLayout>
  );
}
