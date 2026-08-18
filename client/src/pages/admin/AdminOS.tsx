import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Printer, Search, Eye, FileText, ChevronRight,
  Loader2, AlertCircle, Filter, Download
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pagamento_aprovado: { label: "Pagamento Aprovado", color: "text-green-700",   bg: "bg-green-100" },
  pagamento_retirada: { label: "Pagamento Retirada",  color: "text-blue-700",    bg: "bg-blue-100" },
  analisando:         { label: "Analisando",          color: "text-orange-700",  bg: "bg-orange-100" },
  com_problemas:      { label: "Com Problemas",       color: "text-red-700",     bg: "bg-red-100" },
  em_producao:        { label: "Em Produção",         color: "text-orange-700",  bg: "bg-orange-100" },
  pronto_entrega:     { label: "Pronto p/ Entrega",   color: "text-teal-700",    bg: "bg-teal-100" },
  pronto_retirada:    { label: "Pronto p/ Retirada",  color: "text-cyan-700",    bg: "bg-cyan-100" },
  entregue:           { label: "Entregue",            color: "text-emerald-700", bg: "bg-emerald-100" },
  cancelado:          { label: "Cancelado",           color: "text-gray-700",    bg: "bg-gray-100" },
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

export default function AdminOS() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const { data: orders = [], isLoading } = trpc.checkout.getAllOrders.useQuery();
  const allOrders = orders as any[];

  const filtered = useMemo(() => {
    return allOrders.filter((o) => {
      const matchSearch =
        !search ||
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.deliveryFullName?.toLowerCase().includes(search.toLowerCase()) ||
        o.id?.toString().includes(search);
      const matchStatus = statusFilter === "todos" || o.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, search, statusFilter]);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-pink-600" aria-hidden="true" />
              Ordens de Serviço (OS)
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Visualize, imprima e gerencie as OS de todos os pedidos
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Printer className="w-4 h-4" aria-hidden="true" />
            <span aria-live="polite">{filtered.length} OS encontradas</span>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <label htmlFor="os-search" className="sr-only">Buscar ordens de serviço</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <Input
                id="os-search"
                placeholder="Buscar por número, cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" aria-hidden="true" />
              {["todos", "analisando", "em_producao", "pronto_entrega", "pronto_retirada", "entregue", "com_problemas"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    statusFilter === s
                      ? "bg-pink-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-700"
                  }`}
                  aria-pressed={statusFilter === s}
                >
                  {s === "todos" ? "Todos" : STATUS_CONFIG[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de OS */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando ordens de serviço" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <AlertCircle className="w-10 h-10" />
              <p className="text-sm">Nenhuma OS encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">OS / Pedido</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Cliente</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Valor</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Data</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const sc = STATUS_CONFIG[order.status];
                    return (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-pink-600" aria-hidden="true" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-xs">{order.orderNumber}</p>
                              <p className="text-[10px] text-gray-400">#{order.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-800 font-medium text-xs">{order.deliveryFullName || `Cliente #${order.clientId}`}</p>
                          {order.deliveryPhone && (
                            <p className="text-[10px] text-gray-400">{order.deliveryPhone}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900 text-xs">{fmt(parseFloat(order.totalPrice?.toString() ?? "0"))}</p>
                        </td>
                        <td className="px-4 py-3">
                          {sc ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                              {sc.label}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">{order.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {/* Botão Imprimir OS */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs border-pink-200 text-pink-600 hover:bg-pink-50"
                              onClick={() => setLocation(`/admin/os/${order.id}`)}
                              aria-label={`Imprimir ordem de serviço ${order.orderNumber}`}
                            >
                              <Printer className="w-3 h-3 mr-1" aria-hidden="true" />
                              Imprimir OS
                            </Button>
                            {/* Botão Ver Pedido */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              asChild
                            >
                              <Link href={`/admin/pedidos/${order.id}`}>
                                <Eye className="w-3 h-3 mr-1" aria-hidden="true" />
                                Ver
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-xs text-gray-400 text-center">
          Total de {allOrders.length} pedidos · {filtered.length} exibidos
        </div>
      </div>
    </AdminLayout>
  );
}
