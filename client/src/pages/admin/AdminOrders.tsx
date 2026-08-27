import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Search, ChevronRight, Package, Filter, X, Loader2, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import AdminAbandonedCarts from "./AdminAbandonedCarts";
import { useAdminAuth } from "@/hooks/useAdminAuth";

// ─── Mapa de status operacionais ────────────────────────────────────────────
export const ORDER_STATUS: Record<string, { label: string; color: string; icon: string }> = {
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "bg-amber-100 text-amber-800", icon: "⏳" },
  pagamento_aprovado:  { label: "Pagamento Aprovado",      color: "bg-green-100 text-green-800",   icon: "💳" },
  pagamento_retirada:  { label: "Pagamento na Retirada",   color: "bg-blue-100 text-blue-800",     icon: "🏪" },
  analisando:          { label: "Analisando",              color: "bg-amber-100 text-amber-800", icon: "🔍" },
  com_problemas:       { label: "Com Problemas",           color: "bg-red-100 text-red-800",       icon: "⚠️" },
  em_producao:         { label: "Em Produção",             color: "bg-amber-100 text-amber-800", icon: "⚙️" },
  pronto_entrega:      { label: "Pronto para Entrega",     color: "bg-teal-100 text-teal-800",     icon: "🚚" },
  pronto_retirada:     { label: "Pronto para Retirada",    color: "bg-cyan-100 text-cyan-800",     icon: "🎁" },
  saiu_entrega:        { label: "Saiu para Entrega",       color: "bg-indigo-100 text-indigo-800", icon: "🚚" },
  em_transporte:       { label: "Em Transporte",           color: "bg-sky-100 text-sky-800",       icon: "🚛" },
  entregue:            { label: "Entregue",                color: "bg-emerald-100 text-emerald-800",icon: "✔️" },
  cancelado:           { label: "Cancelado",               color: "bg-red-100 text-red-800",       icon: "❌" },
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pago: { label: "Pago", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  pendente: { label: "Pendente", className: "border-amber-200 bg-amber-50 text-amber-700" },
  falhou: { label: "Falhou", className: "border-red-200 bg-red-50 text-red-700" },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  pagar_na_retirada: "Pagamento na retirada",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
  boleto: "Boleto",
};

const FILTER_OPTIONS = [
  { id: "todos",              label: "Todos" },
  { id: "aguardando_pagamento", label: "Aguardando Pagamento" },
  { id: "pagamento_aprovado", label: "Pagamento Aprovado" },
  { id: "pagamento_retirada", label: "Pagamento na Retirada" },
  { id: "analisando",         label: "Analisando" },
  { id: "com_problemas",      label: "Com Problemas" },
  { id: "em_producao",        label: "Em Produção" },
  { id: "pronto_entrega",     label: "Pronto para Entrega" },
    { id: "pronto_retirada", label: "Pronto para Retirada" },
  { id: "saiu_entrega",    label: "Saiu para Entrega" },
  { id: "em_transporte",   label: "Em Transporte" },
  { id: "entregue",        label: "Entregue" },
  { id: "cancelado",       label: "Cancelado" },
];

export default function AdminOrders() {
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("todos");
  const [sellerFilter, setSellerFilter] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [orderToTrash, setOrderToTrash] = useState<any | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [orderToRestore, setOrderToRestore] = useState<any | null>(null);
  const [orderToPermanentlyDelete, setOrderToPermanentlyDelete] = useState<any | null>(null);
  const utils = trpc.useUtils();
  const { adminUser } = useAdminAuth();
  const canManageTrash = Boolean(adminUser);
  const canPermanentlyDelete = adminUser?.role === "superadmin";

  const moveToTrashMutation = trpc.ordersTrash.moveToTrash.useMutation({
    onSuccess: async () => {
      toast.success("Pedido movido para a lixeira.");
      setOrderToTrash(null);
      setDeletionReason("");
      await utils.checkout.getAllOrders.invalidate();
      await utils.ordersTrash.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao mover pedido para a lixeira."),
  });
  const restoreOrderMutation = trpc.ordersTrash.restore.useMutation({
    onSuccess: async () => {
      toast.success("Pedido restaurado com sucesso.");
      setOrderToRestore(null);
      await utils.checkout.getAllOrders.invalidate();
      await utils.ordersTrash.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao restaurar pedido."),
  });
  const permanentlyDeleteOrderMutation = trpc.ordersTrash.permanentlyDelete.useMutation({
    onSuccess: async () => {
      toast.success("Pedido removido permanentemente da lixeira.");
      setOrderToPermanentlyDelete(null);
      await utils.checkout.getAllOrders.invalidate();
      await utils.ordersTrash.list.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao excluir pedido permanentemente."),
  });

  const { data: allOrders, isLoading } = trpc.checkout.getAllOrders.useQuery();
  const { data: trashedOrders = [], isLoading: isLoadingTrash } = trpc.ordersTrash.list.useQuery(undefined, { enabled: canManageTrash && showTrash });
  const sellerOptions = useMemo(() => Array.from(new Set((allOrders as any[] ?? []).map((order) => String(order.sellerName ?? "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")), [allOrders]);

  const filtered = useMemo(() => {
    if (!allOrders) return [];
    return (allOrders as any[]).filter((o) => {
      if (filter !== "todos" && o.status !== filter) return false;
      if (sellerFilter === "__site__" && o.sellerName) return false;
      if (sellerFilter !== "todos" && sellerFilter !== "__site__" && String(o.sellerName ?? "") !== sellerFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          o.orderNumber?.toLowerCase().includes(q) ||
          o.deliveryFullName?.toLowerCase().includes(q) ||
          o.deliveryPhone?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allOrders, filter, sellerFilter, search]);

  const isAbandonedCartsView = new URLSearchParams(window.location.search).get("view") === "carrinho-abandonado";

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: any) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

  if (isAbandonedCartsView) {
    return <AdminAbandonedCarts />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando pedidos" />
      </div>
    );
  }

  return (
    <AdminLayout>
    <div className="p-5">
      <div>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-pink-600" aria-hidden="true" />
              Gerenciamento de Pedidos
            </h1>
            <p className="text-gray-500 mt-1">Acompanhe e gerencie todos os pedidos operacionais</p>
          </div>
          <div className="flex items-center gap-2">
            {canManageTrash && <Button variant="outline" size="sm" onClick={() => setShowTrash((current) => !current)} className={showTrash ? "border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100" : ""}><Trash2 className="w-4 h-4 mr-1" />{showTrash ? "Fechar lixeira" : "Lixeira"}</Button>}
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">← Voltar ao Admin</Link>
            </Button>
          </div>
        </div>

        {/* Busca e Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <label htmlFor="admin-orders-search" className="sr-only">Buscar pedidos</label>
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
              <Input
                id="admin-orders-search"
                placeholder="Buscar por número do pedido, cliente ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                aria-expanded={showFilters}
                aria-controls="admin-order-status-filters"
                className={showFilters ? "bg-pink-600 text-white hover:bg-pink-700" : ""}
              >
                <Filter className="w-4 h-4 mr-1" aria-hidden="true" />
                Filtros {filter !== "todos" && `• ${ORDER_STATUS[filter]?.label}`}
              </Button>
              {filter !== "todos" && (
                <Button variant="ghost" size="sm" onClick={() => setFilter("todos")}>
                  <X className="w-4 h-4 mr-1" aria-hidden="true" /> Limpar
                </Button>
              )}
            </div>

            {showFilters && (
              <div id="admin-order-status-filters" className="space-y-3 pt-4 border-t" aria-label="Filtrar pedidos por status e vendedor">
                {adminUser?.role === "superadmin" && <label className="block max-w-xs text-sm font-medium text-gray-700">Vendedor<select value={sellerFilter} onChange={(event) => setSellerFilter(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-100"><option value="todos">Todos os vendedores</option><option value="__site__">Somente vendas diretas do site</option>{sellerOptions.map((seller) => <option key={seller} value={seller}>{seller}</option>)}</select></label>}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">{FILTER_OPTIONS.map((opt) => (
                  <Button
                    key={opt.id}
                    variant={filter === opt.id ? "default" : "outline"}
                    size="sm"
                    className={filter === opt.id ? "bg-pink-600 text-xs justify-start text-white hover:bg-pink-700" : "text-xs justify-start"}
                    onClick={() => setFilter(opt.id)}
                    aria-pressed={filter === opt.id}
                  >
                    {opt.id !== "todos" && ORDER_STATUS[opt.id]?.icon + " "}
                    {opt.label}
                  </Button>
                ))}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pedidos</span>
              <Badge variant="outline" aria-live="polite">{filtered.length} resultado(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-gray-600 font-medium">Nenhum pedido encontrado</p>
                <p className="text-gray-400 text-sm">Ajuste os filtros ou a busca</p>
              </div>
            ) : (
              <>
              <div className="space-y-3 md:hidden">
                {filtered.map((order: any) => {
                  const sc = ORDER_STATUS[order.status] ?? ORDER_STATUS.analisando;
                  const payment = PAYMENT_STATUS_LABELS[order.paymentStatus] ?? PAYMENT_STATUS_LABELS.pendente;
                  const paymentMethod = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? "Método não informado";
                  return <article key={order.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-bold text-slate-900">{order.orderNumber}</p><p className="mt-1 text-sm font-medium text-slate-800">{order.deliveryFullName || "Cliente"}</p><p className="text-xs text-slate-500">{order.sellerName || "Venda direta"}</p></div><p className="text-sm font-bold text-slate-900">{fmt(parseFloat(order.totalPrice))}</p></div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-500">Pagamento</p><p className="mt-1 font-medium text-slate-800">{paymentMethod}</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-500">Situação financeira</p><Badge variant="outline" className={`mt-1 text-[10px] ${payment.className}`}>{payment.label}</Badge></div></div>
                    <div className="mt-2 rounded-lg bg-slate-50 p-2"><p className="text-xs text-slate-500">Status operacional</p><Badge className={`mt-1 text-[10px] ${sc.color}`}><span aria-hidden="true">{sc.icon} </span>{sc.label}</Badge></div>
                    <div className="mt-3 flex justify-end gap-2"><Button variant="outline" size="sm" asChild><Link href={`/admin/pedidos/${order.id}`}>Ver pedido <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Link></Button>{canManageTrash && <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" aria-label={`Mover o pedido ${order.orderNumber} para a lixeira`} onClick={() => { setDeletionReason(""); setOrderToTrash(order); }}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>}</div>
                  </article>;
                })}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-600">
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Pedido</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Cliente</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Vendedor</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Valor</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Pagamento</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Situação financeira</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Status</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Data</th>
                      <th scope="col" className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order: any) => {
                      const sc = ORDER_STATUS[order.status] ?? ORDER_STATUS.analisando;
                      const payment = PAYMENT_STATUS_LABELS[order.paymentStatus] ?? PAYMENT_STATUS_LABELS.pendente;
                      const paymentMethod = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? "Método não informado";
                      return (
                        <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900">{order.orderNumber}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{order.deliveryFullName}</p>
                            <p className="text-xs text-gray-500">{order.deliveryPhone}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.sellerName || "Venda direta"}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {fmt(parseFloat(order.totalPrice))}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{paymentMethod}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${payment.className}`}>{payment.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${sc.color} text-xs`}><span aria-hidden="true">{sc.icon} </span>{sc.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{fmtDate(order.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/pedidos/${order.id}`} aria-label={`Ver detalhes do pedido ${order.orderNumber}`}>
                                  Ver <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                                </Link>
                              </Button>
                              {canManageTrash && <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" title={`Mover o pedido ${order.orderNumber} para a lixeira`} aria-label={`Mover o pedido ${order.orderNumber} para a lixeira`} onClick={() => { setDeletionReason(""); setOrderToTrash(order); }}><Trash2 className="w-4 h-4" aria-hidden="true" /></Button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>

        {canManageTrash && showTrash && (
          <Card className="mt-6 border border-pink-200 shadow-sm">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Trash2 className="w-4 h-4 text-pink-600" />Lixeira de Todos os Pedidos</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoadingTrash ? <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-pink-600" /></div> : !trashedOrders.length ? <div className="p-8 text-center text-sm text-gray-400">Nenhum pedido na lixeira.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-y bg-gray-50 text-gray-600"><th className="px-4 py-3 text-left font-semibold">Pedido</th><th className="px-4 py-3 text-left font-semibold">Cliente</th><th className="px-4 py-3 text-right font-semibold">Valor</th><th className="px-4 py-3 text-left font-semibold">Motivo</th><th className="px-4 py-3 text-left font-semibold">Excluído em</th><th className="px-4 py-3 text-left font-semibold">Usuário</th><th className="px-4 py-3 text-center font-semibold">Ação</th></tr></thead><tbody>{trashedOrders.map((order: any) => <tr key={order.trashId} className="border-b"><td className="px-4 py-3 font-mono font-semibold text-pink-600">{order.orderNumber}</td><td className="px-4 py-3 font-medium">{order.cliente || "Cliente não informado"}</td><td className="px-4 py-3 text-right font-semibold">{fmt(Number(order.valor))}</td><td className="max-w-60 px-4 py-3 text-xs text-gray-600">{order.deletionReason || "Motivo não informado"}</td><td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">{new Date(order.deletedAt).toLocaleString("pt-BR")}</td><td className="px-4 py-3 text-xs text-gray-600">{order.deletedByAdminName || "Usuário não informado"}</td><td className="px-4 py-3"><div className="flex justify-center gap-1"><Button variant="outline" size="sm" className="h-8 gap-1 text-xs" disabled={restoreOrderMutation.isPending} onClick={() => setOrderToRestore(order)}><RotateCcw className="w-3.5 h-3.5" />Restaurar</Button>{canPermanentlyDelete && <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" disabled={permanentlyDeleteOrderMutation.isPending} title={`Excluir permanentemente ${order.orderNumber}`} onClick={() => setOrderToPermanentlyDelete(order)}><Trash2 className="w-3.5 h-3.5" /></Button>}</div></td></tr>)}</tbody></table></div>}
            </CardContent>
          </Card>
        )}

        <Dialog open={Boolean(orderToTrash)} onOpenChange={(open) => { if (!open) { setOrderToTrash(null); setDeletionReason(""); } }}>
          <DialogContent><DialogHeader><DialogTitle className="text-red-600">Mover pedido para a lixeira</DialogTitle></DialogHeader><p className="text-sm text-gray-600">O pedido {orderToTrash?.orderNumber} será ocultado da lista ativa e poderá ser restaurado posteriormente por uma pessoa administradora.</p><div className="space-y-2"><label htmlFor="order-deletion-reason" className="text-sm font-medium">Motivo da exclusão <span className="text-red-600">*</span></label><textarea id="order-deletion-reason" value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} placeholder="Descreva o motivo da exclusão" maxLength={1000} className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" /><p className="text-xs text-gray-500">O motivo ficará registrado na lixeira e na auditoria.</p></div><DialogFooter><Button variant="outline" onClick={() => setOrderToTrash(null)}>Cancelar</Button><Button variant="destructive" disabled={moveToTrashMutation.isPending || deletionReason.trim().length < 3} onClick={() => { if (orderToTrash?.id && deletionReason.trim().length >= 3) moveToTrashMutation.mutate({ orderId: orderToTrash.id, reason: deletionReason.trim() }); }}>{moveToTrashMutation.isPending ? "Movendo..." : "Mover para lixeira"}</Button></DialogFooter></DialogContent>
        </Dialog>

        <Dialog open={Boolean(orderToRestore)} onOpenChange={(open) => !open && setOrderToRestore(null)}>
          <DialogContent><DialogHeader><DialogTitle>Restaurar este pedido?</DialogTitle></DialogHeader><p className="text-sm text-gray-600">O pedido {orderToRestore?.orderNumber} voltará imediatamente para a lista ativa de Todos os Pedidos.</p><DialogFooter><Button variant="outline" onClick={() => setOrderToRestore(null)}>Cancelar</Button><Button className="bg-green-600 hover:bg-green-700 text-white" disabled={restoreOrderMutation.isPending} onClick={() => { if (orderToRestore?.orderId) restoreOrderMutation.mutate({ orderId: orderToRestore.orderId }); }}>{restoreOrderMutation.isPending ? "Restaurando..." : "Confirmar restauração"}</Button></DialogFooter></DialogContent>
        </Dialog>

        <Dialog open={Boolean(orderToPermanentlyDelete)} onOpenChange={(open) => !open && setOrderToPermanentlyDelete(null)}>
          <DialogContent><DialogHeader><DialogTitle className="text-red-600">Excluir pedido permanentemente?</DialogTitle></DialogHeader><p className="text-sm text-gray-600">O pedido {orderToPermanentlyDelete?.orderNumber} e seus registros vinculados serão removidos definitivamente. Esta ação não poderá ser desfeita.</p><DialogFooter><Button variant="outline" onClick={() => setOrderToPermanentlyDelete(null)}>Cancelar</Button><Button variant="destructive" disabled={permanentlyDeleteOrderMutation.isPending} onClick={() => { if (orderToPermanentlyDelete?.orderId) permanentlyDeleteOrderMutation.mutate({ orderId: orderToPermanentlyDelete.orderId }); }}>{permanentlyDeleteOrderMutation.isPending ? "Excluindo..." : "Excluir permanentemente"}</Button></DialogFooter></DialogContent>
        </Dialog>
      </div>
    </div>
    </AdminLayout>
  );
}
