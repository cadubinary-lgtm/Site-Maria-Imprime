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
import { Loader2, ChevronLeft, Package, User, DollarSign, Truck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUS } from "./AdminOrders";

// Ordem linear dos status para a linha do tempo
const STATUS_STEPS = [
  { key: "pagamento_aprovado" },
  { key: "pedido_recebido" },
  { key: "arte_em_analise" },
  { key: "aguardando_aprovacao" },
  { key: "em_producao" },
  { key: "impressao" },
  { key: "acabamento" },
  { key: "pronto" },
  { key: "saiu_para_entrega" },
  { key: "entregue" },
];

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
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === o.status);
  const isCancelled = o.status === "cancelado";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">

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

        {/* ── Linha do tempo + Alterar Status + Histórico ── */}
        <Card className="border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Acompanhamento e Atualização do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Status atual highlight */}
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-medium">Status atual</p>
                <p className="font-bold text-indigo-900">{sc.label}</p>
              </div>
            </div>

            {/* Linha do tempo visual */}
            {!isCancelled && (
              <div className="relative">
                {/* Background line */}
                <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full" />
                {/* Progress line */}
                <div
                  className="absolute top-5 left-5 h-1 bg-indigo-500 rounded-full transition-all duration-700"
                  style={{
                    width: currentStepIndex >= 0
                      ? `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%)`
                      : "0%",
                    maxWidth: "calc(100% - 2.5rem)",
                  }}
                />
                <div className="relative flex justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const cfg = ORDER_STATUS[step.key];
                    const isPast = i < currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center gap-1.5"
                        style={{ width: `${100 / STATUS_STEPS.length}%` }}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 transition-all z-10 relative ${
                            isCurrent
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md ring-4 ring-indigo-100 scale-110"
                              : isPast
                              ? "bg-indigo-400 border-indigo-400 text-white"
                              : "bg-gray-100 border-gray-200 text-gray-300"
                          }`}
                        >
                          {isPast || isCurrent ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-base opacity-40">{cfg?.icon ?? "●"}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs text-center font-medium leading-tight ${
                            isCurrent
                              ? "text-indigo-700 font-bold"
                              : isPast
                              ? "text-indigo-400"
                              : "text-gray-300"
                          }`}
                          style={{ fontSize: "0.6rem" }}
                        >
                          {cfg?.label ?? step.key}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Alterar Status */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Alterar Status do Pedido</p>
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
            </div>

            {/* Histórico de Status */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-4">Histórico de Status</p>
              {histLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : history && (history as any[]).length > 0 ? (
                <div className="space-y-3">
                  {(history as any[]).map((entry, idx) => {
                    const cfg = ORDER_STATUS[entry.newStatus] ?? ORDER_STATUS.pedido_recebido;
                    return (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${cfg.color} flex-shrink-0`}>
                            {cfg.icon}
                          </div>
                          {idx < (history as any[]).length - 1 && (
                            <div className="w-0.5 h-4 bg-gray-200 my-1" />
                          )}
                        </div>
                        <div className="pt-1">
                          <p className="font-semibold text-gray-900 text-sm">{cfg.label}</p>
                          <p className="text-xs text-gray-500">{fmtDate(entry.createdAt)}</p>
                          {entry.notes && (
                            <p className="text-sm text-gray-600 mt-0.5 italic">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">Nenhum histórico disponível</p>
              )}
            </div>

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

      </div>
    </div>
  );
}
