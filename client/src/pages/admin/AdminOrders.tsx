import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, ChevronRight, Package, Filter, X, Loader2 } from "lucide-react";

// ─── Mapa de status operacionais ────────────────────────────────────────────
export const ORDER_STATUS: Record<string, { label: string; color: string; icon: string }> = {
  pagamento_aprovado:  { label: "Pagamento Aprovado",      color: "bg-green-100 text-green-800",   icon: "💳" },
  pagamento_retirada:  { label: "Pagamento na Retirada",   color: "bg-blue-100 text-blue-800",     icon: "🏪" },
  analisando:          { label: "Analisando",              color: "bg-orange-100 text-orange-800", icon: "🔍" },
  com_problemas:       { label: "Com Problemas",           color: "bg-red-100 text-red-800",       icon: "⚠️" },
  em_producao:         { label: "Em Produção",             color: "bg-purple-100 text-purple-800", icon: "⚙️" },
  pronto_entrega:      { label: "Pronto para Entrega",     color: "bg-teal-100 text-teal-800",     icon: "🚚" },
  pronto_retirada:     { label: "Pronto para Retirada",    color: "bg-cyan-100 text-cyan-800",     icon: "🎁" },
  entregue:            { label: "Entregue",                color: "bg-emerald-100 text-emerald-800",icon: "✔️" },
  cancelado:           { label: "Cancelado",               color: "bg-red-100 text-red-800",       icon: "❌" },
};

const FILTER_OPTIONS = [
  { id: "todos",              label: "Todos" },
  { id: "pagamento_aprovado", label: "Pagamento Aprovado" },
  { id: "pagamento_retirada", label: "Pagamento na Retirada" },
  { id: "analisando",         label: "Analisando" },
  { id: "com_problemas",      label: "Com Problemas" },
  { id: "em_producao",        label: "Em Produção" },
  { id: "pronto_entrega",     label: "Pronto para Entrega" },
  { id: "pronto_retirada",    label: "Pronto para Retirada" },
  { id: "entregue",           label: "Entregue" },
  { id: "cancelado",          label: "Cancelado" },
];

export default function AdminOrders() {
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  const { data: allOrders, isLoading } = trpc.checkout.getAllOrders.useQuery();

  const filtered = useMemo(() => {
    if (!allOrders) return [];
    return (allOrders as any[]).filter((o) => {
      if (filter !== "todos" && o.status !== filter) return false;
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
  }, [allOrders, filter, search]);

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: any) =>
    d ? new Date(d).toLocaleDateString("pt-BR") : "-";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-indigo-600" />
              Gerenciamento de Pedidos
            </h1>
            <p className="text-gray-500 mt-1">Acompanhe e gerencie todos os pedidos operacionais</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="sm">← Voltar ao Admin</Button>
          </Link>
        </div>

        {/* Busca e Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
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
              >
                <Filter className="w-4 h-4 mr-1" />
                Filtros {filter !== "todos" && `• ${ORDER_STATUS[filter]?.label}`}
              </Button>
              {filter !== "todos" && (
                <Button variant="ghost" size="sm" onClick={() => setFilter("todos")}>
                  <X className="w-4 h-4 mr-1" /> Limpar
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-4 border-t">
                {FILTER_OPTIONS.map((opt) => (
                  <Button
                    key={opt.id}
                    variant={filter === opt.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs justify-start"
                    onClick={() => setFilter(opt.id)}
                  >
                    {opt.id !== "todos" && ORDER_STATUS[opt.id]?.icon + " "}
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pedidos</span>
              <Badge variant="outline">{filtered.length} resultado(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Nenhum pedido encontrado</p>
                <p className="text-gray-400 text-sm">Ajuste os filtros ou a busca</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-600">
                      <th className="px-4 py-3 text-left font-semibold">Pedido</th>
                      <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-4 py-3 text-left font-semibold">Valor</th>
                      <th className="px-4 py-3 text-left font-semibold">Pagamento</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Data</th>
                      <th className="px-4 py-3 text-left font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order: any) => {
                      const sc = ORDER_STATUS[order.status] ?? ORDER_STATUS.analisando;
                      return (
                        <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono font-semibold text-gray-900">{order.orderNumber}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{order.deliveryFullName}</p>
                            <p className="text-xs text-gray-500">{order.deliveryPhone}</p>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {fmt(parseFloat(order.totalPrice))}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">{order.paymentStatus || "Pendente"}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${sc.color} text-xs`}>{sc.icon} {sc.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{fmtDate(order.createdAt)}</td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/pedidos/${order.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
