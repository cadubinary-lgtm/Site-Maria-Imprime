
import { useState, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2, ChevronLeft, Package, User, DollarSign, Truck, CheckCircle2,
  Download, FileImage, Upload, Trash2, Eye, ImagePlus, X, Printer, FileText,
  Ruler, Layers, Weight, StickyNote, AlertCircle, Clock, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUS } from "./AdminOrders";
import { OrderShippingPanel } from '@/components/orders/OrderShippingPanel';
import { ShippingLabelViewer } from '@/components/orders/ShippingLabelViewer';

// Ordem linear dos status para a linha do tempo
function getAdminStatusSteps(order: any) {
  const isPickup = order.shippingMethod === 'retirada' || order.shippingMethod === 'pickup' || !order.deliveryStreet;
  const isInProduction = ['em_producao', 'pronto_entrega', 'pronto_retirada', 'saiu_entrega', 'em_transporte', 'entregue'].includes(order.status);

  const paymentStep = order.paymentMethod === 'pagar_na_retirada'
    ? { key: 'pagamento_retirada' }
    : { key: 'pagamento_aprovado' };

  const base = [
    paymentStep,
    { key: 'analisando' },
    ...(!isInProduction ? [{ key: 'com_problemas' }] : []),
    { key: 'em_producao' },
  ];

  if (isPickup) {
    return [...base, { key: 'pronto_retirada' }, { key: 'entregue' }];
  } else {
    return [...base, { key: 'saiu_entrega' }, { key: 'em_transporte' }, { key: 'entregue' }];
  }
}

const STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, cfg]) => ({
  value,
  label: `${cfg.icon} ${cfg.label}`,
}));

const PRE_PRODUCTION_OPTIONS = [
  { value: 'liberado_analise',    label: 'Liberado para Análise', icon: Clock,       color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ajustar_arte',        label: 'Ajustar Arte',          icon: AlertCircle, color: 'bg-orange-100 text-orange-700' },
  { value: 'arte_final_aprovada', label: 'Arte Final Aprovada',   icon: CheckCircle, color: 'bg-green-100 text-green-700' },
];

function fileNameFromUrl(url: string): string {
  try {
    const parts = url.split("/");
    const raw = parts[parts.length - 1] ?? "arquivo";
    const match = raw.match(/^\d+-(.+)$/);
    return match ? match[1] : raw;
  } catch {
    return "arquivo";
  }
}

function downloadFile(url: string, name: string) {
  const proxyUrl = `/api/download-file?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadAllFiles(files: { artFileUrl: string; productName: string }[]) {
  for (const f of files) {
    const name = fileNameFromUrl(f.artFileUrl);
    downloadFile(f.artFileUrl, name);
    await new Promise((r) => setTimeout(r, 500));
  }
}

// ─── Sub-componente: Arquivos do cliente por item ───────────────────────────
function ItemClientFiles({ itemFiles, onLightbox }: { itemFiles: any[]; onLightbox: (url: string) => void }) {
  if (itemFiles.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        <FileImage className="w-8 h-8 mx-auto mb-1 opacity-30" />
        <p className="text-xs">Nenhum arquivo enviado para este item</p>
      </div>
    );
  }

  const extColors: Record<string, string> = {
    PDF: 'bg-red-100 text-red-700', AI: 'bg-orange-100 text-orange-700',
    PSD: 'bg-blue-100 text-blue-700', CDR: 'bg-green-100 text-green-700',
    EPS: 'bg-orange-100 text-orange-700', SVG: 'bg-teal-100 text-teal-700',
    JPG: 'bg-yellow-100 text-yellow-700', JPEG: 'bg-yellow-100 text-yellow-700',
    PNG: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="space-y-3">
      {itemFiles.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="outline" size="sm"
            className="gap-2 text-blue-700 border-blue-300 hover:bg-blue-50 text-xs h-7"
            onClick={() => downloadAllFiles(itemFiles)}
          >
            <Download className="w-3 h-3" />
            Baixar todos ({itemFiles.length})
          </Button>
        </div>
      )}
      {itemFiles.map((f: any, i: number) => {
        const name = fileNameFromUrl(f.artFileUrl);
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
        const isPdf = /\.pdf$/i.test(name);
        const canPreview = isImage || isPdf;
        const ext = (name.split('.').pop() ?? 'FILE').toUpperCase();
        const badgeColor = extColors[ext] ?? 'bg-gray-100 text-gray-700';
        return (
          <div key={i} className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            {isImage && (
              <div
                className="w-full bg-gray-50 flex items-center justify-center cursor-pointer group relative overflow-hidden"
                style={{ minHeight: 140, maxHeight: 240 }}
                onClick={() => onLightbox(f.artFileUrl)}
              >
                <img
                  src={f.artFileUrl} alt={name}
                  className="max-w-full max-h-56 object-contain transition-transform group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                    <Eye className="w-5 h-5 text-gray-800" />
                  </div>
                </div>
              </div>
            )}
            {isPdf && (
              <div
                className="w-full bg-red-50 flex flex-col items-center justify-center cursor-pointer group py-6"
                onClick={() => onLightbox(f.artFileUrl)}
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-2 group-hover:bg-red-200 transition-colors">
                  <FileImage className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-xs font-semibold text-red-700">Visualizar PDF</p>
              </div>
            )}
            <div className="flex items-center gap-3 px-3 py-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${badgeColor}`}>{ext}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-xs truncate">{name}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {canPreview && (
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-600"
                    title="Visualizar" onClick={() => onLightbox(f.artFileUrl)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-500 hover:text-blue-700"
                  title="Baixar" onClick={() => downloadFile(f.artFileUrl, name)}>
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sub-componente: Pré-Impressão inline (global do pedido, exibida por item) ─
function InlinePreImpressao({
  orderId,
  preProductionStatus,
}: { orderId: number; preProductionStatus: string }) {
  const [selected, setSelected] = useState(preProductionStatus);
  const utils = trpc.useUtils();

  const mutation = trpc.admin.updatePreProductionStatus.useMutation({
    onSuccess: () => {
      toast.success('Status de pré-impressão atualizado!');
      utils.checkout.getOrderById.invalidate({ id: orderId });
      utils.checkout.getAllOrders.invalidate();
    },
    onError: () => toast.error('Erro ao atualizar status de pré-impressão'),
  });

  const current = PRE_PRODUCTION_OPTIONS.find(o => o.value === selected);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Status Atual:</span>
        {current && (
          <Badge className={`${current.color} text-xs`}>
            <current.icon className="w-3 h-3 mr-1" />
            {current.label}
          </Badge>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="flex-1 h-8 text-xs bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRE_PRODUCTION_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-8 text-xs bg-orange-500 hover:bg-orange-600 px-3"
          disabled={mutation.isPending || selected === preProductionStatus}
          onClick={() => mutation.mutate({ orderId, preProductionStatus: selected as any })}
        >
          {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Atualizar'}
        </Button>
      </div>
    </div>
  );
}

// ─── Sub-componente: Prévia da Arte inline (global do pedido, exibida por item) ─
function InlineArtPreview({
  orderId,
  previews,
  previewsLoading,
  onLightbox,
  onRefresh,
}: {
  orderId: number;
  previews: any[];
  previewsLoading: boolean;
  onLightbox: (url: string) => void;
  onRefresh: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const savePreviewMutation = trpc.checkout.saveArtPreview.useMutation({
    onSuccess: () => {
      utils.checkout.getArtPreviews.invalidate({ orderId });
      toast.success("Prévia enviada!");
      setNotes("");
      onRefresh();
    },
    onError: (err) => toast.error(err.message || "Erro ao salvar prévia"),
  });

  const deletePreviewMutation = trpc.checkout.deleteArtPreview.useMutation({
    onSuccess: () => {
      utils.checkout.getArtPreviews.invalidate({ orderId });
      toast.success("Prévia removida");
    },
    onError: (err) => toast.error(err.message || "Erro ao remover prévia"),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-art-preview", { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro no upload"); }
      const { url, key } = await res.json();
      await savePreviewMutation.mutateAsync({ orderId, imageUrl: url, imageKey: key, notes: notes || undefined });
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar prévia");
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload */}
      <div className="bg-orange-50 rounded-lg border border-orange-200 p-3 space-y-2">
        <p className="text-xs font-semibold text-orange-800">Enviar nova prévia</p>
        <Textarea
          placeholder="Observação para o cliente (opcional)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="bg-white text-xs"
        />
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleUpload} />
          <Button
            size="sm"
            className="h-7 text-xs bg-orange-600 hover:bg-orange-700 gap-1.5"
            disabled={isUploading}
            onClick={() => fileRef.current?.click()}
          >
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            {isUploading ? "Enviando..." : "Selecionar Imagem"}
          </Button>
          <p className="text-xs text-gray-400">JPG, PNG, WEBP · máx. 10MB</p>
        </div>
      </div>

      {/* Galeria */}
      {previewsLoading ? (
        <div className="flex justify-center py-3">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : previews.length === 0 ? (
        <div className="text-center py-3 text-gray-400">
          <ImagePlus className="w-7 h-7 mx-auto mb-1 opacity-30" />
          <p className="text-xs">Nenhuma prévia enviada ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {previews.map((p: any) => (
            <div key={p.id} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={p.imageUrl} alt="Prévia"
                className="w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onLightbox(p.imageUrl)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                <button className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:bg-blue-50"
                  onClick={() => onLightbox(p.imageUrl)}>
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                </button>
                <button className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50"
                  onClick={() => deletePreviewMutation.mutate({ previewId: p.id })}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
              <div className="px-2 py-1 bg-white border-t border-gray-100">
                <p className="text-[10px] text-gray-500">
                  {new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
                {p.notes && <p className="text-[10px] text-gray-700 truncate">{p.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/pedidos/:id");
  const [, setLocation] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : null;

  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.checkout.getOrderById.useQuery(
    { id: orderId! }, { enabled: !!orderId }
  );
  const { data: history, isLoading: histLoading } = trpc.checkout.getOrderHistory.useQuery(
    { orderId: orderId! }, { enabled: !!orderId }
  );
  const { data: orderFiles = [], isLoading: filesLoading } = trpc.checkout.getOrderFiles.useQuery(
    { orderId: orderId! }, { enabled: !!orderId }
  );
  const { data: artPreviews = [], isLoading: previewsLoading } = trpc.checkout.getArtPreviews.useQuery(
    { orderId: orderId! }, { enabled: !!orderId }
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
      await updateMutation.mutateAsync({ orderId, newStatus: newStatus as any, notes: statusNotes || undefined });
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
    d ? new Date(d).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

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
  const sc = ORDER_STATUS[o.status] ?? ORDER_STATUS.analisando;
  const STATUS_STEPS = getAdminStatusSteps(o);
  const currentStepIndex = STATUS_STEPS.findIndex((s: any) => s.key === o.status);
  const isCancelled = o.status === "cancelado";
  if (newStatus === "" && o.status) setNewStatus(o.status);

  const files = orderFiles as any[];
  const previews = artPreviews as any[];

  // Importar AdminLayout dinamicamente para evitar circular
  const AdminLayout = require("@/components/AdminLayout").default;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">

          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => setLocation("/admin/pedidos")}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Pedidos
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => setLocation("/admin/os")}
                  className="border-orange-200 text-orange-600 hover:bg-orange-50">
                  <FileText className="w-4 h-4 mr-1" /> Ver todas as OS
                </Button>
                <Button size="sm"
                  onClick={() => setLocation(`/admin/os/${o.id}`)}
                  className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Printer className="w-4 h-4 mr-1" /> Imprimir OS
                </Button>
              </div>
            </div>
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

          {/* ── Acompanhamento e Atualização do Pedido ── */}
          <Card className="border-indigo-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                Acompanhamento e Atualização do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status atual */}
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-medium">Status atual</p>
                  <p className="font-bold text-indigo-900">{sc.label}</p>
                </div>
              </div>

              {/* Linha do tempo */}
              {!isCancelled && (
                <div className="relative">
                  <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full" />
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
                    {STATUS_STEPS.map((step: any, i: number) => {
                      const cfg = ORDER_STATUS[step.key];
                      const isPast = i < currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-1.5"
                          style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 transition-all z-10 relative ${
                            isCurrent ? "bg-indigo-600 border-indigo-600 text-white shadow-md ring-4 ring-indigo-100 scale-110"
                            : isPast ? "bg-indigo-400 border-indigo-400 text-white"
                            : "bg-gray-100 border-gray-200 text-gray-300"
                          }`}>
                            {isPast || isCurrent ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-base opacity-40">{cfg?.icon ?? "●"}</span>}
                          </div>
                          <span className={`text-xs text-center font-medium leading-tight ${
                            isCurrent ? "text-indigo-700 font-bold" : isPast ? "text-indigo-400" : "text-gray-300"
                          }`} style={{ fontSize: "0.6rem" }}>
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
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleUpdate} disabled={!newStatus || isUpdating} className="bg-indigo-600 hover:bg-indigo-700">
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

              {/* Histórico */}
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-4">Histórico de Status</p>
                {histLoading ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : history && (history as any[]).length > 0 ? (
                  <div className="space-y-3">
                    {(history as any[]).map((entry, idx) => {
                      const cfg = ORDER_STATUS[entry.newStatus] ?? ORDER_STATUS.analisando;
                      return (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base ${cfg.color} flex-shrink-0`}>
                              {cfg.icon}
                            </div>
                            {idx < (history as any[]).length - 1 && <div className="w-0.5 h-4 bg-gray-200 my-1" />}
                          </div>
                          <div className="pt-1">
                            <p className="font-semibold text-gray-900 text-sm">{cfg.label}</p>
                            <p className="text-xs text-gray-500">{fmtDate(entry.createdAt)}</p>
                            {entry.notes && <p className="text-sm text-gray-600 mt-0.5 italic">{entry.notes}</p>}
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

          {/* ── PRODUTOS DO PEDIDO — container principal agrupado ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Itens do Pedido</h2>
              {o.items && <Badge variant="secondary">{o.items.length} {o.items.length === 1 ? 'item' : 'itens'}</Badge>}
            </div>

            {o.items && o.items.length > 0 ? (
              o.items.map((item: any, i: number) => {
                // Parse variation/attributes
                let variations: { name: string; value: string }[] = [];
                if (item.variationSnapshot) { try { variations = JSON.parse(item.variationSnapshot); } catch {} }
                let attrObj: Record<string, any> = {};
                if (item.selectedAttributes) { try { attrObj = JSON.parse(item.selectedAttributes); } catch {} }

                const pesoAttr = attrObj?.peso ?? attrObj?.weight ?? attrObj?.weightKg;
                const pesoVariation = variations.find(v => v.name?.toLowerCase().includes('peso') || v.name?.toLowerCase().includes('weight'));
                const pesoDisplay = pesoAttr ? `${pesoAttr} kg` : pesoVariation ? pesoVariation.value : null;

                const dims = item.customDimensions;
                let largura = "", altura = "";
                if (dims) {
                  const parts = String(dims).split(/[xX×]/);
                  if (parts.length >= 2) { largura = parts[0].trim(); altura = parts[1].trim(); }
                }

                const acabamentos = variations.filter(v =>
                  !v.name?.toLowerCase().includes('peso') && !v.name?.toLowerCase().includes('weight') &&
                  !v.name?.toLowerCase().includes('largura') && !v.name?.toLowerCase().includes('altura') &&
                  !v.name?.toLowerCase().includes('dimensão') && !v.name?.toLowerCase().includes('dimensao')
                );
                const outrasVariacoes = Object.entries(attrObj)
                  .filter(([k]) => !['peso', 'weight', 'weightKg', 'largura', 'altura'].includes(k))
                  .map(([k, v]) => ({ name: k, value: String(v) }));

                // Arquivos deste item (match por productName)
                const itemFiles = filesLoading ? [] : files.filter(
                  (f: any) => f.productName === item.productName
                );

                return (
                  <Card key={i} className="border-2 border-gray-200 shadow-sm overflow-hidden">
                    {/* Cabeçalho do item */}
                    <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-base">{item.productName}</p>
                            <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-gray-500">Unit.</p>
                          <p className="font-semibold text-gray-800">{fmt(parseFloat(item.priceAtOrder))}</p>
                          <p className="text-xs text-gray-400">Total: {fmt(parseFloat(item.priceAtOrder) * item.quantity)}</p>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-0">
                      {/* Grid de 3 colunas: Detalhes | Arquivos | Prévia + Pré-Impressão */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

                        {/* Coluna 1: Detalhes técnicos */}
                        <div className="p-4 space-y-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                            <Ruler className="w-3.5 h-3.5" /> Especificações
                          </p>
                          <div className="space-y-2">
                            {(largura || altura) && (
                              <div>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Dimensões</p>
                                <p className="text-sm font-semibold text-gray-900">{largura} × {altura} m</p>
                                {largura && altura && (
                                  <p className="text-xs text-gray-500">{(parseFloat(largura) * parseFloat(altura)).toFixed(2)} m²</p>
                                )}
                              </div>
                            )}
                            {pesoDisplay && (
                              <div className="flex items-center gap-1.5">
                                <Weight className="w-3 h-3 text-gray-400" />
                                <div>
                                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Peso</p>
                                  <p className="text-sm font-semibold text-gray-900">{pesoDisplay}</p>
                                </div>
                              </div>
                            )}
                            {acabamentos.length > 0 && (
                              <div>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                                  <Layers className="w-3 h-3" /> Acabamentos
                                </p>
                                <div className="space-y-1">
                                  {acabamentos.map((v, vi) => (
                                    <div key={vi}>
                                      <span className="text-[10px] text-gray-400">{v.name}: </span>
                                      <span className="text-xs text-gray-900 font-medium">{v.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {outrasVariacoes.length > 0 && (
                              <div>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">Outras Especificações</p>
                                <div className="space-y-1">
                                  {outrasVariacoes.map((v, vi) => (
                                    <div key={vi}>
                                      <span className="text-[10px] text-gray-400">{v.name}: </span>
                                      <span className="text-xs text-gray-900 font-medium">{v.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.notes && (
                              <div className="flex items-start gap-1.5">
                                <StickyNote className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Observações</p>
                                  <p className="text-xs text-gray-900 italic">{item.notes}</p>
                                </div>
                              </div>
                            )}
                            {!largura && !altura && acabamentos.length === 0 && outrasVariacoes.length === 0 && !item.notes && (
                              <p className="text-xs text-gray-400 italic">Sem especificações adicionais</p>
                            )}
                          </div>
                        </div>

                        {/* Coluna 2: Arquivos do cliente */}
                        <div className="p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                            <FileImage className="w-3.5 h-3.5 text-blue-500" /> Arquivo do Cliente
                          </p>
                          {filesLoading ? (
                            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                          ) : (
                            <ItemClientFiles itemFiles={itemFiles} onLightbox={setLightboxUrl} />
                          )}
                        </div>

                        {/* Coluna 3: Prévia da Arte + Pré-Impressão */}
                        <div className="p-4 space-y-5">
                          {/* Prévia da Arte */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                              <ImagePlus className="w-3.5 h-3.5 text-orange-500" /> Prévia da Arte
                              {o.items.length > 1 && (
                                <span className="text-[10px] text-orange-400 font-normal">(pedido)</span>
                              )}
                            </p>
                            {/* Só renderiza o componente completo no primeiro item para evitar duplicação */}
                            {i === 0 ? (
                              <InlineArtPreview
                                orderId={orderId!}
                                previews={previews}
                                previewsLoading={previewsLoading}
                                onLightbox={setLightboxUrl}
                                onRefresh={() => utils.checkout.getArtPreviews.invalidate({ orderId: orderId! })}
                              />
                            ) : (
                              <div className="text-center py-3 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <ImagePlus className="w-6 h-6 mx-auto mb-1 opacity-30" />
                                <p className="text-xs">Prévias compartilhadas com todos os itens</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Gerencie no primeiro item</p>
                              </div>
                            )}
                          </div>

                          {/* Pré-Impressão */}
                          <div className="border-t pt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                              <Layers className="w-3.5 h-3.5 text-orange-600" /> Pré-Impressão
                              {o.items.length > 1 && (
                                <span className="text-[10px] text-orange-400 font-normal">(pedido)</span>
                              )}
                            </p>
                            {i === 0 ? (
                              <InlinePreImpressao
                                orderId={orderId!}
                                preProductionStatus={o.preProductionStatus || 'liberado_analise'}
                              />
                            ) : (
                              <div className="text-center py-3 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <Layers className="w-6 h-6 mx-auto mb-1 opacity-30" />
                                <p className="text-xs">Status compartilhado com todos os itens</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Gerencie no primeiro item</p>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-gray-400">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum produto neste pedido</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Dados do Cliente ── */}
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
                {(o.guestEmail || o.guestName) && (
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">E-mail</p>
                    <p className="font-semibold text-gray-900">{o.guestEmail}</p>
                  </div>
                )}
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

          {/* ── Resumo Financeiro ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" /> Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                {o.items && o.items.length > 0 && (() => {
                  const subtotal = o.items.reduce((acc: number, item: any) =>
                    acc + parseFloat(item.priceAtOrder) * item.quantity, 0);
                  return (
                    <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-pink-500" />
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subtotal Produtos</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{fmt(subtotal)}</p>
                    </div>
                  );
                })()}
                {o.shippingPrice && parseFloat(o.shippingPrice) > 0 && (
                  <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-500" />
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frete</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{fmt(parseFloat(o.shippingPrice))}</p>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-green-600" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total do Pedido</p>
                  </div>
                  <p className="text-base font-bold text-indigo-600">{fmt(parseFloat(o.totalPrice))}</p>
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pagamento</p>
                      <span className={`inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        o.paymentStatus === 'pago' ? 'bg-emerald-100 text-emerald-800'
                        : o.paymentStatus === 'cancelado' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {o.paymentStatus === 'pago' ? 'Pago' : o.paymentStatus === 'cancelado' ? 'Cancelado' : o.paymentStatus === 'reembolsado' ? 'Reembolsado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                  {o.paymentMethod && (
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Método</p>
                        <p className="text-sm font-semibold text-gray-800 capitalize">{o.paymentMethod}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Status de Produção e Entrega (globais) ── */}
          <OrderShippingPanel
            shippingMethod={o.shippingMethod}
            shippingPrice={o.shippingPrice}
            deliveryZipCode={o.deliveryZipCode}
            deliveryStreet={o.deliveryStreet}
            deliveryNumber={o.deliveryNumber}
            deliveryComplement={o.deliveryComplement}
            deliveryNeighborhood={o.deliveryNeighborhood}
            deliveryCity={o.deliveryCity}
            deliveryState={o.deliveryState}
          />

          <ShippingLabelViewer orderId={o.id} />

          {o.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Observações do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap text-sm">{o.notes}</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizar imagem</DialogTitle>
            <DialogDescription>Visualização em tela cheia</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            {lightboxUrl && (
              <img src={lightboxUrl} alt="Visualização" className="w-full max-h-[85vh] object-contain rounded-lg" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
