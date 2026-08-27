import AdminLayout from "@/components/AdminLayout";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, X, ChevronDown, GripVertical, ExternalLink, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { OrderDetailContent } from "./AdminOrderDetail";

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
  paymentStatus?: string | null;
  productionStatus?: string | null;
  totalPrice: string | number;
  createdAt: string | number | Date;
  clientId?: number;
  deliveryFullName?: string | null;
  guestName?: string | null;
  deliveryDeadline?: number | null;
  updatedAt?: string | number | Date | null;
};

type ArtState = "waiting" | "approved" | "refused" | "none";

const PRODUCTION_TAGS: Record<string, { label: string; className: string }> = {
  pendente: { label: "Produção: Pendente", className: "border-gray-200 bg-gray-100 text-gray-700" },
  impresso: { label: "Produção: Impresso", className: "border-blue-200 bg-blue-50 text-blue-700" },
  acabamento_finalizado: { label: "Produção: Acabamento Finalizado", className: "border-green-200 bg-green-50 text-green-700" },
};

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
        ✓ Cliente aprovou a arte
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

function KanbanCard({ order, artState, onAdvance, isUpdating, onDragStart, onDragEnd, onSelect, isSelected }: {
  order: Order;
  artState: ArtState;
  onAdvance: (id: number, nextStatus: string) => void;
  isUpdating: boolean;
  onDragStart: (orderId: number) => void;
  onDragEnd: () => void;
  onSelect: (orderId: number) => void;
  isSelected: boolean;
}) {
  const col = KANBAN_COLUMNS.find(c => c.id === order.status);
  const nextStatus = NEXT_STATUS[order.status];
  const isComProblemas = order.status === "com_problemas";
  
  const daysInColumn = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  // Dias parado na coluna atual: usa updatedAt (última mudança de status), fallback para createdAt
  const lastStatusChange = order.updatedAt ? new Date(order.updatedAt) : new Date(order.createdAt);
  const daysInCurrentCol = Math.floor((Date.now() - lastStatusChange.getTime()) / (1000 * 60 * 60 * 24));
  const daysLabel = daysInCurrentCol === 0 ? "Hoje" : `${daysInCurrentCol} dia${daysInCurrentCol !== 1 ? 's' : ''}`;
  const isAnalysisDelayed = order.status === "analisando" && daysInCurrentCol >= 2;
  // Prazo dinâmico: usa deliveryDeadline do pedido (timestamp ms UTC)
  // Se não houver prazo cadastrado, fallback de 5 dias a partir da criação
  const isLateOrder = order.deliveryDeadline
    ? Date.now() > order.deliveryDeadline
    : daysInColumn > 5;

  return (
    <div
      className={`rounded-md border shadow-sm p-3 space-y-2 hover:shadow-md transition-all cursor-pointer ${isSelected ? 'ring-2 ring-pink-400 border-pink-300' : ''} ${isAnalysisDelayed ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' : isLateOrder ? 'bg-pink-50 border-pink-200' : 'bg-white border-gray-100'}`}
      onClick={() => onSelect(order.id)}
      aria-busy={isUpdating}
    >
      {/* Linha 1: Número do pedido */}
      <div className="font-bold text-sm text-gray-900">{order.orderNumber}</div>

      {/* Linha 2: Nome do cliente */}
      <div className="text-xs text-gray-500">
        {order.deliveryFullName || order.guestName || "Cliente"}
      </div>

      {/* Linha 3: Data com indicador de alerta */}
      <div className="flex items-center gap-1">
        <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded font-medium">
          {daysLabel}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
        </span>
      </div>

      {isAnalysisDelayed && (
        <div className="flex items-center gap-1.5 rounded bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          Em análise há {daysInCurrentCol} dias
        </div>
      )}

      {artState !== "none" && <ArtStateTag state={artState} />}

      {order.status === "em_producao" && (() => {
        const productionTag = PRODUCTION_TAGS[order.productionStatus === "pending" ? "pendente" : order.productionStatus || "pendente"];
        return productionTag ? <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${productionTag.className}`}>{productionTag.label}</span> : null;
      })()}

      {/* Linha 4: Link Ver pedido + Drag Handle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(order.id); }}
          className="inline-block text-xs text-pink-600 hover:text-pink-700 hover:underline transition-colors font-medium"
        >
          Ver pedido
        </button>
        {/* Drag Handle - único ponto de arrasto */}
        <div
          draggable
          onDragStart={(e) => { e.stopPropagation(); onDragStart(order.id); }}
          onDragEnd={(e) => { e.stopPropagation(); onDragEnd(); }}
          title="Arraste para mover"
          role="img"
          aria-label={`Arrastar pedido ${order.orderNumber} para outra etapa`}
          className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors p-0.5 rounded select-none"
        >
          <GripVertical className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}


export default function AdminKanban() {
  const { data: allOrders, isLoading, refetch } = trpc.checkout.getAllOrders.useQuery();
  const updateStatusMutation = trpc.checkout.updateOrderStatus.useMutation();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(["entregue", "cancelado"]));
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Estado local para atualização otimista: sobrescreve o status localmente antes da API responder
  const [optimisticOverrides, setOptimisticOverrides] = useState<Record<number, string>>({});

  const orders: Order[] = useMemo(() => {
    const base = (allOrders ?? []) as Order[];
    if (Object.keys(optimisticOverrides).length === 0) return base;
    return base.map(o => optimisticOverrides[o.id] ? { ...o, status: optimisticOverrides[o.id] } : o);
  }, [allOrders, optimisticOverrides]);

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

  const toggleCol = (colId: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);
      return next;
    });
  };

  const handleDragStart = (orderId: number) => {
    setDraggedOrderId(orderId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(null);
    if (draggedOrderId === null) return;
    const order = orders.find(o => o.id === draggedOrderId);
    if (!order || order.status === colId) return;
    // Atualização otimista: muda o status localmente de imediato
    const previousStatus = order.status;
    setOptimisticOverrides(prev => ({ ...prev, [draggedOrderId]: colId }));
    setDraggedOrderId(null);
    try {
      await updateStatusMutation.mutateAsync({ orderId: draggedOrderId, newStatus: colId as any });
      // Após confirmação da API, remove o override e sincroniza com o servidor
      setOptimisticOverrides(prev => { const next = { ...prev }; delete next[draggedOrderId]; return next; });
      refetch();
    } catch {
      // Rollback: reverte para o status anterior em caso de erro
      setOptimisticOverrides(prev => { const next = { ...prev }; delete next[draggedOrderId]; return next; });
      toast.error("Erro ao mover pedido");
    }
  };

  const handleDragEnd = () => {
    setDraggedOrderId(null);
    setDragOverColId(null);
  };

  // Filtrar pedidos por busca (DEVE ficar antes de qualquer return condicional)
  const filteredOrders = useMemo(() => {
    const operationalOrders = orders.filter((order) => order.paymentStatus === "pago");
    if (!searchQuery.trim()) return operationalOrders;
    const query = searchQuery.toLowerCase();
    return operationalOrders.filter(o =>
      o.orderNumber.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  // Ordenar pedidos
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders];
    if (sortBy === "date") {
      sorted.sort((a, b) => {
        const creationDifference = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return creationDifference || a.id - b.id;
      });
    } else if (sortBy === "priority") {
      sorted.sort((a, b) => parseFloat(b.totalPrice.toString()) - parseFloat(a.totalPrice.toString()));
    }
    return sorted;
  }, [filteredOrders, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando pedidos" />
      </div>
    );
  }

  // Agrupar pedidos por status
  const byStatus: Record<string, Order[]> = {};
  for (const col of KANBAN_COLUMNS) {
    byStatus[col.id] = sortedOrders.filter(o => o.status === col.id);
  }

  const visibleCols = KANBAN_COLUMNS.filter(c => !hiddenCols.has(c.id));
  const totalFiltered = filteredOrders.length;
  const isSearching = searchQuery.trim().length > 0;

  return (
    <AdminLayout>
    <div className={`flex h-full overflow-hidden ${selectedOrderId ? 'gap-0' : ''}`}>
    {/* Painel Esquerdo: Kanban */}
    <div className={`transition-all duration-300 overflow-y-auto p-5 space-y-4 ${selectedOrderId ? 'w-3/5 border-r border-gray-200' : 'w-full'}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban de Produção</h1>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length} pedido{orders.length !== 1 ? "s" : ""} no total
          </p>
        </div>

      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          aria-label="Buscar por número do pedido"
          placeholder="Buscar por número do pedido..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white text-sm rounded-lg pl-9 pr-9 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-500 placeholder-gray-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Limpar busca por pedido"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
      {isSearching && (
        <p className="text-xs text-gray-500 px-1">
          {totalFiltered} pedido{totalFiltered !== 1 ? "s" : ""} encontrado{totalFiltered !== 1 ? "s" : ""}
        </p>
      )}

      {/* Botão de Ordenação */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 font-semibold">Ordenar por:</span>
        <div className="relative inline-block">
          <select
            aria-label="Ordenar pedidos do Kanban"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "priority")}
            className="appearance-none bg-white text-sm rounded-lg px-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-500 cursor-pointer pr-8 text-gray-700"
          >
            <option value="date">Data de entrada (mais antigos)</option>
            <option value="priority">Prioridade (maior valor)</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Filtro de colunas visíveis */}
      <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-gray-200" role="group" aria-label="Colunas visíveis do Kanban">
        <span className="text-xs text-gray-600 font-semibold self-center">Mostrar/ocultar:</span>
        {KANBAN_COLUMNS.map(col => (
          <button
            type="button"
            key={col.id}
            onClick={() => toggleCol(col.id)}
            aria-pressed={!hiddenCols.has(col.id)}
            aria-label={`${hiddenCols.has(col.id) ? "Mostrar" : "Ocultar"} coluna ${col.label}`}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              hiddenCols.has(col.id)
                ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                : "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100"
            }`}
          >
            {col.icon} {col.label} ({byStatus[col.id].length})
          </button>
        ))}
      </div>

      {/* Mensagem de nenhum pedido encontrado ou Kanban Board */}
      {totalFiltered === 0 && isSearching ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum pedido encontrado</h3>
          <p className="text-sm text-gray-500 mb-4">Nenhum pedido corresponde à sua busca: <span className="font-semibold text-gray-700">"{searchQuery}"</span></p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-sm text-pink-600 hover:text-pink-700 underline"
          >
            Limpar busca
          </button>
        </div>
      ) : (
      <div className="overflow-x-auto pb-4" role="region" aria-label="Etapas do Kanban de produção" tabIndex={0}>
        <div className="flex gap-4" role="list" style={{ minWidth: `${visibleCols.length * 220}px` }}>
          {visibleCols.map(col => {
            const colOrders = byStatus[col.id];
            const isAwaitingAnalysis = col.id === "analisando" && colOrders.length > 0;
            return (
              <div
                key={col.id}
                role="listitem"
                className={`flex-shrink-0 w-52 rounded-lg border overflow-hidden transition-colors ${
                  dragOverColId === col.id
                    ? 'border-pink-400 bg-pink-50'
                    : `border-gray-200 ${col.bg}`
                }`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Header da coluna */}
                <div className={`${col.header} px-3 py-3 flex items-center gap-2 justify-between border-b border-gray-200`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{col.icon}</span>
                    <span className="text-gray-700 text-xs font-semibold leading-tight">{col.label}</span>
                  </div>
                  <span
                    className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                      isAwaitingAnalysis
                        ? "bg-pink-100 text-pink-700 border border-pink-200"
                        : "bg-gray-200 text-gray-700"
                    }`}
                    aria-label={isAwaitingAnalysis ? `${colOrders.length} item(ns) pendente(s) de análise` : `${colOrders.length} item(ns)`}
                  >
                    {isAwaitingAnalysis ? `${colOrders.length} pendente${colOrders.length !== 1 ? "s" : ""}` : colOrders.length}
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
                       isUpdating={updatingId === order.id}
                       onDragStart={handleDragStart}
                       onDragEnd={handleDragEnd}
                       onSelect={setSelectedOrderId}
                       isSelected={selectedOrderId === order.id}
                     />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>

    {/* Painel Direito: Detalhes do Pedido */}
    {selectedOrderId && (
      <aside className="w-2/5 flex flex-col overflow-hidden border-l border-gray-200 bg-white" aria-label="Detalhes do pedido selecionado">
        {/* Header do painel */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">Detalhes do Pedido</span>
          <div className="flex items-center gap-2">
            <Link href={`/admin/pedidos/${selectedOrderId}?from=kanban`} className="flex items-center gap-1 text-xs text-pink-600 transition-colors hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              Abrir completo
            </Link>
            <button
              type="button"
              onClick={() => setSelectedOrderId(null)}
              className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
              aria-label="Fechar detalhes do pedido"
              title="Fechar painel"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
       {/* Conteúdo do painel */}
       <div className="flex-1 overflow-y-auto">
          <OrderDetailContent
            orderId={selectedOrderId}
            backRoute="/admin/pedidos/kanban"
            backLabel="Voltar para Kanban"
          />
       </div>
      </aside>
    )}
    </div>
    </AdminLayout>
  );
}
