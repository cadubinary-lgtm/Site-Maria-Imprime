import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useRoute, Link } from "wouter";
import {
  Loader2, CheckCircle2, Clock, Package, Printer, Scissors, Box, Truck, Home, X, ZoomIn,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TIMELINE_STEPS = [
  { key: "pagamento_aprovado",  label: "Pagamento Aprovado",     icon: Clock },
  { key: "pagamento_retirada",  label: "Pagamento na Retirada",  icon: CheckCircle2 },
  { key: "analisando",          label: "Analisando",             icon: Package },
  { key: "com_problemas",       label: "Com Problemas",          icon: X },
  { key: "em_producao",         label: "Em Produção",            icon: Printer },
  { key: "pronto_entrega",      label: "Pronto para Entrega",    icon: Truck },
  { key: "pronto_retirada",     label: "Pronto para Retirada",   icon: Box },
  { key: "entregue",            label: "Entregue",               icon: Home },
];

function getStepIndex(status: string): number {
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === status);
  if (status === "cancelado") return -1;
  return idx >= 0 ? idx : 0;
}

const STATUS_LABELS: Record<string, string> = {
  pagamento_aprovado:  "Pagamento Aprovado",
  pagamento_retirada:  "Pagamento na Retirada",
  analisando:          "Analisando",
  com_problemas:       "Com Problemas",
  em_producao:         "Em Produção",
  pronto_entrega:      "Pronto para Entrega",
  pronto_retirada:     "Pronto para Retirada",
  entregue:            "Entregue",
  cancelado:           "Cancelado",
};

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

export default function GuestOrderTracking() {
  const [, params] = useRoute("/pedido/acompanhar/:token");
  const token = params?.token ?? "";
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data, isLoading } = trpc.checkout.getOrderByToken.useQuery(
    { token },
    { enabled: !!token, refetchInterval: 15000 }
  );

  const order = (data as any)?.order ?? null;
  const items = (data as any)?.items ?? [];
  const history = (data as any)?.history ?? [];

  // Buscar prévias de arte pelo token
  const { data: artPreviews = [] } = trpc.checkout.getArtPreviewsByToken.useQuery(
    { token },
    { enabled: !!token, refetchInterval: 15000 }
  );
  const previews = artPreviews as any[];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-600">Link de acompanhamento inválido ou expirado.</p>
        <Link href="/">
          <Button>Voltar ao Início</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === "cancelado";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Package className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Acompanhamento do Pedido</h1>
          <p className="text-gray-500 mt-1">
            Pedido <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
          </p>
        </div>

        {/* Status atual */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-orange-500" />
              Status do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-600 font-medium">Status atual</p>
              <p className="text-lg font-bold text-orange-700">
                {isCancelled ? "Cancelado" : STATUS_LABELS[order.status] || order.status}
              </p>
            </div>

            {/* Timeline */}
            {!isCancelled && (
              <div className="flex items-center justify-between overflow-x-auto pb-4">
                {TIMELINE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center min-w-[70px] relative">
                      {i > 0 && (
                        <div
                          className={`absolute top-5 -left-1/2 w-full h-0.5 ${
                            i <= currentStepIndex ? "bg-orange-400" : "bg-gray-200"
                          }`}
                        />
                      )}
                      <div
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent
                            ? "bg-orange-500 border-orange-500 text-white scale-110 ring-4 ring-orange-100"
                            : isActive
                            ? "bg-orange-100 border-orange-400 text-orange-600"
                            : "bg-gray-100 border-gray-200 text-gray-400"
                        }`}
                      >
                        {isActive && !isCurrent ? (
                          <CheckCircle2 className="w-5 h-5 text-orange-500" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <p className={`text-xs mt-2 text-center leading-tight max-w-[70px] ${
                        isCurrent ? "font-semibold text-orange-600" : isActive ? "text-orange-500" : "text-gray-400"
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Histórico */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Histórico de atualizações</p>
                <div className="space-y-2">
                  {history.map((h: any) => (
                    <div key={h.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-orange-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-800">{STATUS_LABELS[h.status] || h.status}</span>
                        {h.notes && <span className="text-gray-500"> — {h.notes}</span>}
                        <p className="text-xs text-gray-400">
                          {new Date(h.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Prévia da Arte (enviada pela gráfica) ── */}
        {previews.length > 0 && (
          <Card className="mb-6 border-2 border-orange-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-orange-800">
                <ZoomIn className="w-5 h-5 text-orange-600" />
                Prévia da Arte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                A gráfica enviou uma prévia da arte do seu pedido. Clique na imagem para ampliar.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {previews.map((p: any) => (
                  <div
                    key={p.id}
                    className="relative group rounded-xl overflow-hidden border border-orange-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setLightboxUrl(p.imageUrl)}
                  >
                    <img
                      src={p.imageUrl}
                      alt="Prévia da arte"
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Overlay de zoom */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">
                        <ZoomIn className="w-5 h-5 text-orange-700" />
                      </div>
                    </div>
                    {/* Data e observação */}
                    <div className="px-2 py-1.5 bg-white border-t border-orange-100">
                      <p className="text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {p.notes && (
                        <p className="text-xs text-orange-700 font-medium truncate">{p.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Toque ou clique em qualquer imagem para ver em tamanho completo
              </p>
            </CardContent>
          </Card>
        )}

        {/* Itens do pedido */}
        {items.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Itens do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {item.productImage && (
                      <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-cover rounded-lg" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.productName}</p>
                      <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(item.priceAtCart) * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.deliveryFullName && (
              <div className="flex justify-between">
                <span className="text-gray-600">Entrega para:</span>
                <span className="font-medium">{order.deliveryFullName}</span>
              </div>
            )}
            {order.deliveryCity && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cidade:</span>
                <span className="font-medium">{order.deliveryCity}, {order.deliveryState}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-2 border-t">
              <span>Total</span>
              <span className="text-orange-600">{formatCurrency(order.totalPrice)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/catalogo">
            <Button variant="outline" className="w-full sm:w-auto">
              Continuar Comprando
            </Button>
          </Link>
          <Link href="/cliente/login">
            <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
              Criar Conta / Fazer Login
            </Button>
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>Prévia da arte</DialogTitle>
            <DialogDescription>Visualização em tela cheia da prévia da arte enviada pela gráfica</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {lightboxUrl && (
              <img
                src={lightboxUrl}
                alt="Prévia da arte"
                className="w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
