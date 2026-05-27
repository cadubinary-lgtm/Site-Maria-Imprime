import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowRight, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// ─── Configuração de status ───────────────────────────────────────────────────
const PRODUCTION_COLUMNS = [
  { key: "pedido_recebido",     label: "Recebido",          color: "border-t-blue-400",    bg: "bg-blue-50",    badge: "bg-blue-100 text-blue-800" },
  { key: "pagamento_aprovado",  label: "Pag. Aprovado",     color: "border-t-green-400",   bg: "bg-green-50",   badge: "bg-green-100 text-green-800" },
  { key: "arte_em_analise",     label: "Arte em Análise",   color: "border-t-orange-400",  bg: "bg-orange-50",  badge: "bg-orange-100 text-orange-800" },
  { key: "aguardando_aprovacao",label: "Ag. Aprovação",     color: "border-t-amber-400",   bg: "bg-amber-50",   badge: "bg-amber-100 text-amber-800" },
  { key: "em_producao",         label: "Em Produção",       color: "border-t-purple-400",  bg: "bg-purple-50",  badge: "bg-purple-100 text-purple-800" },
  { key: "impressao",           label: "Impressão",         color: "border-t-indigo-400",  bg: "bg-indigo-50",  badge: "bg-indigo-100 text-indigo-800" },
  { key: "acabamento",          label: "Acabamento",        color: "border-t-violet-400",  bg: "bg-violet-50",  badge: "bg-violet-100 text-violet-800" },
  { key: "pronto",              label: "Pronto",            color: "border-t-teal-400",    bg: "bg-teal-50",    badge: "bg-teal-100 text-teal-800" },
  { key: "saiu_para_entrega",   label: "Em Entrega",        color: "border-t-cyan-400",    bg: "bg-cyan-50",    badge: "bg-cyan-100 text-cyan-800" },
  { key: "entregue",            label: "Entregue",          color: "border-t-emerald-400", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-800" },
];

const ALL_STATUS_OPTIONS = [
  ...PRODUCTION_COLUMNS,
  { key: "cancelado", label: "Cancelado", color: "", bg: "", badge: "bg-red-100 text-red-800" },
];

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(d: any) {
  return d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "-";
}

// ─── Card de pedido no kanban ─────────────────────────────────────────────────
function OrderCard({ order, onStatusChange }: { order: any; onStatusChange: (id: number, status: string) => void }) {
  const [changing, setChanging] = useState(false);

  const handleChange = async (newStatus: string) => {
    setChanging(true);
    await onStatusChange(order.id, newStatus);
    setChanging(false);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 space-y-2 hover:shadow-md transition-shadow">
      {/* Número e data */}
      <div className="flex items-center justify-between">
        <Link href={`/admin/pedidos/${order.id}`}>
          <span className="text-xs font-bold text-orange-600 hover:underline cursor-pointer">
            {order.orderNumber}
          </span>
        </Link>
        <span className="text-xs text-slate-400">{fmtDate(order.createdAt)}</span>
      </div>

      {/* Cliente */}
      <p className="text-xs text-slate-700 font-medium truncate">
        {order.deliveryFullName || order.guestName || "Cliente"}
      </p>

      {/* Itens resumidos */}
      {order.items && order.items.length > 0 && (
        <p className="text-xs text-slate-500 truncate">
          {order.items[0]?.productName ?? "Produto"}{order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
        </p>
      )}

      {/* Total */}
      <p className="text-xs font-bold text-slate-800">{fmt(parseFloat(order.totalPrice ?? "0"))}</p>

      {/* Ações */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
        <Select onValueChange={handleChange} disabled={changing}>
          <SelectTrigger className="h-6 text-xs flex-1 border-slate-200">
            <SelectValue placeholder={changing ? "..." : "Mover para..."} />
          </SelectTrigger>
          <SelectContent>
            {ALL_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.key} value={s.key} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link href={`/admin/pedidos/${order.id}`}>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-orange-500">
            <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminProducao() {
  const utils = trpc.useUtils();
  const { data: orders = [], isLoading, refetch } = trpc.admin.getAllOrders.useQuery();

  const updateMutation = trpc.checkout.updateOrderStatus.useMutation({
    onSuccess: () => {
      utils.admin.getAllOrders.invalidate();
    },
  });

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateMutation.mutateAsync({ orderId, newStatus: newStatus as any });
      toast.success("Status atualizado!");
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const ordersByStatus = (orders as any[]).reduce<Record<string, any[]>>((acc, o) => {
    if (!acc[o.status]) acc[o.status] = [];
    acc[o.status].push(o);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Painel de Produção</h2>
          <p className="text-sm text-slate-500">Arraste ou altere o status de cada pedido</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Kanban horizontal com scroll */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: `${PRODUCTION_COLUMNS.length * 220}px` }}>
          {PRODUCTION_COLUMNS.map((col) => {
            const colOrders = ordersByStatus[col.key] ?? [];
            return (
              <div
                key={col.key}
                className={`flex-shrink-0 w-52 rounded-xl border-t-4 ${col.color} bg-slate-50 border border-slate-200`}
              >
                {/* Cabeçalho da coluna */}
                <div className="px-3 py-2.5 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{col.label}</span>
                    <Badge className={`${col.badge} text-xs px-1.5 py-0 h-4`}>{colOrders.length}</Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto">
                  {colOrders.length === 0 ? (
                    <div className="flex items-center justify-center py-6 text-slate-300">
                      <p className="text-xs">Vazio</p>
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pedidos cancelados (separados) */}
      {(ordersByStatus["cancelado"] ?? []).length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              Pedidos Cancelados ({ordersByStatus["cancelado"].length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {ordersByStatus["cancelado"].map((order: any) => (
                <Link key={order.id} href={`/admin/pedidos/${order.id}`}>
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 cursor-pointer transition-colors">
                    <p className="text-xs font-bold text-red-700">{order.orderNumber}</p>
                    <p className="text-xs text-red-500 truncate">{order.deliveryFullName || order.guestName || "Cliente"}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
