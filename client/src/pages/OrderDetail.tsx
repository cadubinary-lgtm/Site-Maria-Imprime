import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, Package, User, DollarSign, Truck, Clock, FileText } from "lucide-react";
import { toast } from "sonner";

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

const STATUS_OPTIONS = [
  "pedido_recebido",
  "pagamento_aprovado",
  "arte_em_analise",
  "aguardando_aprovacao",
  "em_producao",
  "impressao",
  "acabamento",
  "pronto",
  "enviado",
  "entregue",
  "cancelado",
];

export default function OrderDetail() {
  const [, params] = useRoute("/admin/erp/pedidos/:id");
  const [, setLocation] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : null;

  const [newStatus, setNewStatus] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Queries
  const { data: order, isLoading: orderLoading, refetch: refetchOrder } = trpc.checkout.getOrderById.useQuery(
    { id: orderId! },
    { enabled: !!orderId }
  );

  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = trpc.checkout.getOrderHistory.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  // Mutations
  const updateStatusMutation = trpc.checkout.updateOrderStatus.useMutation();

  const handleStatusChange = async (status: string) => {
    if (!orderId) return;

    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        newStatus: status as any,
      });

      toast.success(`Status alterado para ${STATUS_CONFIG[status].label}`);
      setNewStatus("");
      refetchOrder();
      refetchHistory();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar status");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-600">Pedido não encontrado</p>
            <Button onClick={() => setLocation("/admin/erp/pedidos")} className="mt-4">
              Voltar para Pedidos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const orderData = order as any;
  const statusConfig = STATUS_CONFIG[orderData.status] || STATUS_CONFIG.pedido_recebido;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin/erp/pedidos")}
            className="mb-4 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar para Pedidos
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{orderData.orderNumber}</h1>
              <p className="text-gray-600 mt-1">Criado em {formatDate(orderData.createdAt)}</p>
            </div>
            <Badge className={`${statusConfig.color} text-lg px-4 py-2`}>
              {statusConfig.icon} {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Status Update Card */}
        <Card className="mb-6 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Alterar Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Selecione um novo status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_CONFIG[status].icon} {STATUS_CONFIG[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => newStatus && handleStatusChange(newStatus)}
                disabled={!newStatus || isUpdating}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Status"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Cliente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 font-medium">Nome Completo</p>
                <p className="text-lg font-semibold text-gray-900">{orderData.deliveryFullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Telefone</p>
                <p className="text-lg font-semibold text-gray-900">{orderData.deliveryPhone}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 font-medium">Endereço</p>
                <p className="text-lg font-semibold text-gray-900">
                  {orderData.deliveryStreet}, {orderData.deliveryNumber}
                  {orderData.deliveryComplement && ` - ${orderData.deliveryComplement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {orderData.deliveryNeighborhood}, {orderData.deliveryCity} - {orderData.deliveryState} {orderData.deliveryZipCode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orderData.items && orderData.items.length > 0 ? (
              <div className="space-y-4">
                {orderData.items.map((item: any, index: number) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                        {item.selectedAttributes && (
                          <p className="text-sm text-gray-600 mt-1">
                            Atributos: {item.selectedAttributes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(parseFloat(item.priceAtOrder))}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(parseFloat(item.priceAtOrder) * item.quantity)} total
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">Nenhum produto neste pedido</p>
            )}
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal dos produtos:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(parseFloat(orderData.totalPrice))}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold text-gray-900">Total do Pedido:</span>
                <span className="text-xl font-bold text-indigo-600">
                  {formatCurrency(parseFloat(orderData.totalPrice))}
                </span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 font-medium">Status de Pagamento</p>
                <Badge variant="outline" className="mt-1">
                  {orderData.paymentStatus || "Pendente"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((entry: any, index: number) => {
                  const entryConfig = STATUS_CONFIG[entry.newStatus] || STATUS_CONFIG.pedido_recebido;
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${entryConfig.color}`}>
                          {entryConfig.icon}
                        </div>
                        {index < (history?.length || 0) - 1 && (
                          <div className="w-0.5 h-12 bg-gray-300 my-2" />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className="font-semibold text-gray-900">{entryConfig.label}</p>
                        <p className="text-sm text-gray-600">{formatDate(entry.createdAt)}</p>
                        {entry.notes && (
                          <p className="text-sm text-gray-500 mt-1 italic">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-600">Nenhum histórico disponível</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
