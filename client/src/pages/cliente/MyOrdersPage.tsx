import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Search, RefreshCw, Eye, ShoppingBag,
  ArrowLeft, AlertCircle, Filter, Calendar,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pagamento_aprovado:   { label: "Pagamento em Análise", color: "bg-yellow-100 text-yellow-700" },
  pedido_recebido:      { label: "Pedido em Análise",    color: "bg-blue-100 text-blue-700" },
  arte_em_analise:      { label: "Arte em Análise",      color: "bg-orange-100 text-orange-700" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-amber-100 text-amber-700" },
  em_producao:          { label: "Em Produção",          color: "bg-purple-100 text-purple-700" },
  impressao:            { label: "Impressão",            color: "bg-indigo-100 text-indigo-700" },
  acabamento:           { label: "Acabamento",           color: "bg-pink-100 text-pink-700" },
  pronto:               { label: "Pronto",               color: "bg-teal-100 text-teal-700" },
  saiu_para_entrega:    { label: "Saiu para Entrega",    color: "bg-cyan-100 text-cyan-700" },
  entregue:             { label: "Entregue",             color: "bg-emerald-100 text-emerald-700" },
  cancelado:            { label: "Cancelado",            color: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function MyOrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderBy, setOrderBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");

  const { data: orders, isLoading, refetch } = trpc.customerAuth.getMyOrders.useQuery(
    { status: statusFilter, search, orderBy },
    { enabled: isAuthenticated }
  );

  const reorderMutation = trpc.customerAuth.reorder.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.addedCount} ${data.addedCount === 1 ? "item adicionado" : "itens adicionados"} ao carrinho!`, {
        action: { label: "Ver carrinho", onClick: () => setLocation("/carrinho") },
      });
    },
    onError: () => toast.error("Erro ao recomprar pedido"),
  });

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Faça login para ver seus pedidos</h2>
            <p className="text-gray-500 mb-6">Você precisa estar logado para acessar seus pedidos</p>
            <Button className="bg-orange-500 hover:bg-orange-600 w-full" onClick={() => setLocation("/login-cliente")}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orderList = (orders ?? []) as any[];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Início
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-orange-500" />
              Meus Pedidos
            </h1>
            {!isLoading && (
              <p className="text-sm text-gray-500">
                {orderList.length} {orderList.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
              </p>
            )}
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setLocation("/catalogo")}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número do pedido..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-52">
                  <Filter className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={orderBy} onValueChange={(v) => setOrderBy(v as any)}>
                <SelectTrigger className="w-full sm:w-44">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigos</SelectItem>
                  <SelectItem value="highest">Maior valor</SelectItem>
                  <SelectItem value="lowest">Menor valor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {(isLoading || authLoading) && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !authLoading && orderList.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {search || statusFilter !== "all" ? "Nenhum pedido encontrado" : "Você ainda não fez nenhum pedido"}
            </h2>
            <p className="text-gray-500 mb-6">
              {search || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Comece a comprar e seus pedidos aparecerão aqui"}
            </p>
            {!search && statusFilter === "all" && (
              <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setLocation("/catalogo")}>
                Ver Produtos
              </Button>
            )}
          </div>
        )}

        {/* Orders list */}
        {!isLoading && !authLoading && orderList.length > 0 && (
          <div className="space-y-4">
            {orderList.map((order: any) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{order.orderNumber}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="font-semibold text-orange-600 text-base">
                          {formatCurrency(order.totalPrice)}
                        </span>
                        {order.itemCount && (
                          <span>{order.itemCount} {Number(order.itemCount) === 1 ? "item" : "itens"}</span>
                        )}
                      </div>
                      {order.deliveryCity && (
                        <p className="text-xs text-gray-400 mt-1">
                          Entrega: {order.deliveryCity}/{order.deliveryState}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">"{order.notes}"</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/pedido/${order.orderNumber}`)}
                        className="text-gray-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reorderMutation.mutate({ orderId: order.id })}
                        disabled={reorderMutation.isPending}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${reorderMutation.isPending ? "animate-spin" : ""}`} />
                        Recomprar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
