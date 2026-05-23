import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Search,
  ChevronRight,
  Package,
  Calendar,
  User,
  DollarSign,
  Truck,
  Clock,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pedido_recebido: { label: "Pedido Recebido", color: "bg-blue-100 text-blue-800", icon: "📦" },
  pagamento_aprovado: { label: "Pagamento Aprovado", color: "bg-green-100 text-green-800", icon: "✅" },
  arte_em_analise: { label: "Arte em Análise", color: "bg-yellow-100 text-yellow-800", icon: "🔍" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-orange-100 text-orange-800", icon: "⏳" },
  em_producao: { label: "Em Produção", color: "bg-purple-100 text-purple-800", icon: "⚙️" },
  impressao: { label: "Impressão", color: "bg-indigo-100 text-indigo-800", icon: "🖨️" },
  acabamento: { label: "Acabamento", color: "bg-pink-100 text-pink-800", icon: "✨" },
  pronto: { label: "Pronto", color: "bg-teal-100 text-teal-800", icon: "🎁" },
  enviado: { label: "Enviado", color: "bg-cyan-100 text-cyan-800", icon: "🚚" },
  entregue: { label: "Entregue", color: "bg-emerald-100 text-emerald-800", icon: "✔️" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: "❌" },
};

const FILTER_OPTIONS = [
  { id: "todos", label: "Todos" },
  { id: "pedido_recebido", label: "Pedido Recebido" },
  { id: "pagamento_aprovado", label: "Pagamento Aprovado" },
  { id: "arte_em_analise", label: "Arte em Análise" },
  { id: "em_producao", label: "Em Produção" },
  { id: "impressao", label: "Impressão" },
  { id: "acabamento", label: "Acabamento" },
  { id: "enviado", label: "Enviado" },
  { id: "entregue", label: "Entregue" },
  { id: "cancelado", label: "Cancelado" },
];

export default function OrdersManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { data: allOrders, isLoading } = trpc.checkout.getAllOrders.useQuery();

  // Filtrar e buscar
  const filteredOrders = useMemo(() => {
    if (!allOrders) return [];

    return allOrders.filter((order: any) => {
      // Filtro por status
      if (selectedFilter !== "todos" && order.status !== selectedFilter) {
        return false;
      }

      // Busca por número do pedido, cliente ou email
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          order.orderNumber?.toLowerCase().includes(search) ||
          order.deliveryFullName?.toLowerCase().includes(search) ||
          order.deliveryPhone?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [allOrders, selectedFilter, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando pedidos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            Gestão de Pedidos
          </h1>
          <p className="text-gray-600 mt-2">Acompanhe e gerencie todos os pedidos da gráfica</p>
        </div>

        {/* Busca e Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5" />
              Buscar e Filtrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Barra de Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar por número do pedido, cliente ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros {selectedFilter !== "todos" && `(${selectedFilter})`}
                </Button>

                {selectedFilter !== "todos" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFilter("todos")}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Limpar Filtro
                  </Button>
                )}
              </div>

              {/* Opções de Filtro */}
              {showFilters && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-4 border-t">
                  {FILTER_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      variant={selectedFilter === option.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFilter(option.id)}
                      className="text-xs"
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Pedidos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pedidos ({filteredOrders.length})</span>
              <Badge variant="outline">{filteredOrders.length} resultado(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Nenhum pedido encontrado</p>
                <p className="text-gray-500 text-sm">Tente ajustar seus filtros ou busca</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pedido</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pagamento</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Frete</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order: any) => {
                      const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pedido_recebido;
                      return (
                        <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-semibold text-gray-900">{order.orderNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{order.deliveryFullName}</p>
                              <p className="text-xs text-gray-500">{order.deliveryPhone}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(parseFloat(order.totalPrice))}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {order.paymentStatus || "Pendente"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {order.notes?.includes("Frete:") ? (
                              <span className="text-xs">
                                {order.notes.split("Frete: ")[1]?.split(" |")[0] || "-"}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`${statusConfig.color} text-xs`}>
                              {statusConfig.icon} {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/admin/erp/pedidos/${order.id}`}>
                              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                                Detalhes <ChevronRight className="w-4 h-4" />
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
