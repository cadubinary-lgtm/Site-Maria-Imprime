import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, Package, User, DollarSign, Truck, Clock, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUS } from "./AdminOrders";

const STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, cfg]) => ({
  value,
  label: `${cfg.icon} ${cfg.label}`,
}));

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/pedidos/:id");
  const [, setLocation] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : null;

  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.checkout.getOrderById.useQuery(
    { id: orderId! },
    { enabled: !!orderId }
  );

  const { data: history, isLoading: histLoading } = trpc.checkout.getOrderHistory.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const updateMutation = trpc.checkout.updateOrderStatus.useMutation({
    onSuccess: () => {
      utils.checkout.getOrderById.invalidate({ id: orderId! });
      utils.checkout.getOrderHistory.invalidate({ orderId: orderId! });
      utils.checkout.getAllOrders.invalidate();
    },
  });

  const handleUpdate = async () => {
    if (!newStatus || !orderId) return;
    setIsUpdating(true);
    try {
      await updateMutation.mutateAsync({
        orderId,
        newStatus: newStatus as any,
        notes: statusNotes || undefined,
      });
      toast.success(`Status atualizado para ${ORDER_STATUS[newStatus]?.label}`);
      setNewStatus("");
      setStatusNotes("");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar status");
    } finally {
      setIsUpdating(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const fmtDate = (d: any) =>
    d
      ? new Date(d).toLocaleDateString("pt-BR", {
          year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "-";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Pedido não encontrado</p>
        <Button onClick={() => setLocation("/admin/pedidos")}>← Voltar</Button>
      </div>
    );
  }

  const o = order as any;
  const sc = ORDER_STATUS[o.status] ?? ORDER_STATUS.pedido_recebido;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">

        {/* Header */}
        <div>
          <Button variant="ghost" onClick={() => setLocation("/admin/pedidos")} className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Pedidos
          </Button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{o.orderNumber}</h1>
              <p className="text-gray-500 mt-1">Criado em {fmtDate(o.createdAt)}</p>
            </div>
            <Badge className={`${sc.color} text-base px-4 py-2`}>
              {sc.icon} {sc.label}
            </Badge>
          </div>
        </div>

        {/* Alterar Status */}
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              Alterar Status do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-72 bg-white">
                  <SelectValue placeholder="Selecione o novo status..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleUpdate}
                disabled={!newStatus || isUpdating}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Atualizar Status
              </Button>
            </div>
            <Textarea
              placeholder="Observação sobre a mudança de status (opcional)..."
              value={statusNotes}
              onChange={(e) => setStatusNotes(e.target.value)}
              rows={2}
              className="bg-white"
            />
          </CardContent>
        </Card>

        {/* Dados do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Nome</p>
                <p className="font-semibold text-gray-900">{o.deliveryFullName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Telefone</p>
                <p className="font-semibold text-gray-900">{o.deliveryPhone}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Endereço de Entrega</p>
                <p className="font-semibold text-gray-900">
                  {o.deliveryStreet}, {o.deliveryNumber}
                  {o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}
                </p>
                <p className="text-sm text-gray-600">
                  {o.deliveryNeighborhood} · {o.deliveryCity} - {o.deliveryState} · CEP {o.deliveryZipCode}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" /> Produtos do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            {o.items && o.items.length > 0 ? (
              <div className="space-y-4">
                {o.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-start border-b pb-4 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                      {item.selectedAttributes && (
                        <p className="text-xs text-gray-500 mt-1">Atributos: {item.selectedAttributes}</p>
                      )}
                      {item.artFileUrl && (
                        <a
                          href={item.artFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 block"
                        >
                          📎 Ver arquivo enviado
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{fmt(parseFloat(item.priceAtOrder))}</p>
                      <p className="text-xs text-gray-500">
                        {fmt(parseFloat(item.priceAtOrder) * item.quantity)} total
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum produto neste pedido</p>
            )}
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total do Pedido</span>
              <span className="font-bold text-lg text-indigo-600">{fmt(parseFloat(o.totalPrice))}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-gray-600">Status de Pagamento</span>
              <Badge variant="outline">{o.paymentStatus || "Pendente"}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Frete / Observações */}
        {o.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" /> Frete e Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap text-sm">{o.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" /> Histórico de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {histLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : history && (history as any[]).length > 0 ? (
              <div className="space-y-4">
                {(history as any[]).map((entry, idx) => {
                  const cfg = ORDER_STATUS[entry.newStatus] ?? ORDER_STATUS.pedido_recebido;
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${cfg.color}`}>
                          {cfg.icon}
                        </div>
                        {idx < (history as any[]).length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className="pt-1 pb-4">
                        <p className="font-semibold text-gray-900">{cfg.label}</p>
                        <p className="text-xs text-gray-500">{fmtDate(entry.createdAt)}</p>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1 italic">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum histórico disponível</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
