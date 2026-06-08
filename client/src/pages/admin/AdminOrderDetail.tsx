import AdminLayout from "@/components/AdminLayout";
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
  Download, FileImage, Upload, Trash2, Eye, Archive, ImagePlus, X, Printer, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUS } from "./AdminOrders";
import { OrderLogisticsPanel } from "@/components/orders/OrderLogisticsPanel";
import { OrderShippingPanel } from '@/components/orders/OrderShippingPanel';
import { ShippingLabelViewer } from '@/components/orders/ShippingLabelViewer';

// Ordem linear dos status para a linha do tempo
const STATUS_STEPS = [
  { key: "pagamento_aprovado" },
  { key: "pagamento_retirada" },
  { key: "analisando" },
  { key: "com_problemas" },
  { key: "em_producao" },
  { key: "pronto_entrega" },
  { key: "pronto_retirada" },
  { key: "entregue" },
];

const STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, cfg]) => ({
  value,
  label: `${cfg.icon} ${cfg.label}`,
}));

/** Extrai o nome do arquivo de uma URL */
function fileNameFromUrl(url: string): string {
  try {
    const parts = url.split("/");
    const raw = parts[parts.length - 1] ?? "arquivo";
    // Remove hash prefix se houver (ex: "1234567890-nome.pdf" → "nome.pdf")
    const match = raw.match(/^\d+-(.+)$/);
    return match ? match[1] : raw;
  } catch {
    return "arquivo";
  }
}

/** Baixa um arquivo via proxy para forçar o diálogo de salvar */
function downloadFile(url: string, name: string) {
  const proxyUrl = `/api/download-file?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`;
  const a = document.createElement("a");
  a.href = proxyUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Baixa todos os arquivos em sequência (abre diálogo para cada um) */
async function downloadAllFiles(files: { artFileUrl: string; productName: string }[]) {
  for (const f of files) {
    const name = fileNameFromUrl(f.artFileUrl);
    downloadFile(f.artFileUrl, name);
    await new Promise((r) => setTimeout(r, 500));
  }
}

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/pedidos/:id");
  const [, setLocation] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : null;

  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Art preview state
  const [previewNotes, setPreviewNotes] = useState("");
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const previewFileRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.checkout.getOrderById.useQuery(
    { id: orderId! },
    { enabled: !!orderId }
  );

  const { data: history, isLoading: histLoading } = trpc.checkout.getOrderHistory.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const { data: orderFiles = [], isLoading: filesLoading } = trpc.checkout.getOrderFiles.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const { data: artPreviews = [], isLoading: previewsLoading } = trpc.checkout.getArtPreviews.useQuery(
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

  const savePreviewMutation = trpc.checkout.saveArtPreview.useMutation({
    onSuccess: () => {
      utils.checkout.getArtPreviews.invalidate({ orderId: orderId! });
      toast.success("Prévia enviada com sucesso!");
      setPreviewNotes("");
    },
    onError: (err) => toast.error(err.message || "Erro ao salvar prévia"),
  });

  const deletePreviewMutation = trpc.checkout.deleteArtPreview.useMutation({
    onSuccess: () => {
      utils.checkout.getArtPreviews.invalidate({ orderId: orderId! });
      toast.success("Prévia removida");
    },
    onError: (err) => toast.error(err.message || "Erro ao remover prévia"),
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

  const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orderId) return;
    setIsUploadingPreview(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-art-preview", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro no upload");
      }
      const { url, key } = await res.json();
      await savePreviewMutation.mutateAsync({
        orderId,
        imageUrl: url,
        imageKey: key,
        notes: previewNotes || undefined,
      });
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar prévia");
    } finally {
      setIsUploadingPreview(false);
      if (previewFileRef.current) previewFileRef.current.value = "";
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
  const sc = ORDER_STATUS[o.status] ?? ORDER_STATUS.analisando;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === o.status);
  const isCancelled = o.status === "cancelado";
  const files = orderFiles as any[];
  const previews = artPreviews as any[];

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/admin/os")}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <FileText className="w-4 h-4 mr-1" /> Ver todas as OS
              </Button>
              <Button
                size="sm"
                onClick={() => setLocation(`/admin/os/${o.id}`)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
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
                    const cfg = ORDER_STATUS[entry.newStatus] ?? ORDER_STATUS.analisando;
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

        {/* ── Arquivos Enviados pelo Cliente ── */}
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileImage className="w-5 h-5 text-blue-600" />
              Arquivos Enviados pelo Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <FileImage className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum arquivo enviado pelo cliente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Botão baixar todos */}
                {files.length > 1 && (
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-blue-700 border-blue-300 hover:bg-blue-50"
                      onClick={() => downloadAllFiles(files)}
                    >
                      <Download className="w-4 h-4" />
                      Baixar todos os arquivos ({files.length})
                    </Button>
                  </div>
                )}
                {/* Lista de arquivos com preview automático */}
                <div className="space-y-3">
                  {files.map((f: any, i: number) => {
                    const name = fileNameFromUrl(f.artFileUrl);
                    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
                    const isPdf = /\.pdf$/i.test(name);
                    const canPreview = isImage || isPdf;
                    const ext = (name.split('.').pop() ?? 'FILE').toUpperCase();
                    const extColors: Record<string, string> = {
                      PDF: 'bg-red-100 text-red-700',
                      AI: 'bg-orange-100 text-orange-700',
                      PSD: 'bg-blue-100 text-blue-700',
                      CDR: 'bg-green-100 text-green-700',
                      EPS: 'bg-purple-100 text-purple-700',
                      SVG: 'bg-teal-100 text-teal-700',
                      JPG: 'bg-yellow-100 text-yellow-700',
                      JPEG: 'bg-yellow-100 text-yellow-700',
                      PNG: 'bg-indigo-100 text-indigo-700',
                    };
                    const badgeColor = extColors[ext] ?? 'bg-gray-100 text-gray-700';
                    return (
                      <div key={i} className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        {/* Thumbnail inline para imagens */}
                        {isImage && (
                          <div
                            className="w-full bg-gray-50 flex items-center justify-center cursor-pointer group relative overflow-hidden"
                            style={{ minHeight: 160, maxHeight: 280 }}
                            onClick={() => setLightboxUrl(f.artFileUrl)}
                          >
                            <img
                              src={f.artFileUrl}
                              alt={name}
                              className="max-w-full max-h-64 object-contain transition-transform group-hover:scale-105"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                                <Eye className="w-6 h-6 text-gray-800" />
                              </div>
                            </div>
                          </div>
                        )}
                        {/* Card de preview para PDF */}
                        {isPdf && (
                          <div
                            className="w-full bg-red-50 flex flex-col items-center justify-center cursor-pointer group py-8"
                            onClick={() => setLightboxUrl(f.artFileUrl)}
                          >
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-red-200 transition-colors">
                              <FileImage className="w-8 h-8 text-red-600" />
                            </div>
                            <p className="text-sm font-semibold text-red-700">Visualizar PDF</p>
                            <p className="text-xs text-red-500 mt-1">Clique para abrir</p>
                          </div>
                        )}
                        {/* Rodapé com info e ações */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-1 rounded-md flex-shrink-0 ${badgeColor}`}>{ext}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                            <p className="text-xs text-gray-500">{f.productName} · Qtd: {f.quantity}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {canPreview && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                                title="Visualizar"
                                onClick={() => setLightboxUrl(f.artFileUrl)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-700"
                              title="Baixar"
                              onClick={() => downloadFile(f.artFileUrl, name)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Prévia da Arte (Admin → Cliente) ── */}
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-purple-600" />
              Prévia da Arte para o Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">

            {/* Upload de nova prévia */}
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4 space-y-3">
              <p className="text-sm font-semibold text-purple-800">Enviar nova prévia</p>
              <p className="text-xs text-purple-600">
                A imagem ficará visível para o cliente na página de acompanhamento do pedido.
              </p>
              <Textarea
                placeholder="Observação para o cliente (opcional)..."
                value={previewNotes}
                onChange={(e) => setPreviewNotes(e.target.value)}
                rows={2}
                className="bg-white text-sm"
              />
              <div className="flex items-center gap-3">
                <input
                  ref={previewFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handlePreviewUpload}
                />
                <Button
                  onClick={() => previewFileRef.current?.click()}
                  disabled={isUploadingPreview}
                  className="bg-purple-600 hover:bg-purple-700 gap-2"
                >
                  {isUploadingPreview ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploadingPreview ? "Enviando..." : "Selecionar e Enviar Imagem"}
                </Button>
                <p className="text-xs text-gray-500">JPG, PNG, WEBP ou GIF · máx. 10MB</p>
              </div>
            </div>

            {/* Prévias já enviadas */}
            {previewsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : previews.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma prévia enviada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Prévias enviadas ({previews.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {previews.map((p: any) => (
                    <div key={p.id} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                      <img
                        src={p.imageUrl}
                        alt="Prévia da arte"
                        className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightboxUrl(p.imageUrl)}
                      />
                      {/* Overlay com ações */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-blue-50"
                          onClick={() => setLightboxUrl(p.imageUrl)}
                          title="Ampliar"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow hover:bg-red-50"
                          onClick={() => deletePreviewMutation.mutate({ previewId: p.id })}
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                      {/* Data */}
                      <div className="px-2 py-1.5 bg-white border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {new Date(p.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {p.notes && <p className="text-xs text-gray-700 truncate">{p.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              {(o.guestEmail || o.guestName) && (
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">E-mail do Convidado</p>
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
                        <button
                          onClick={() => downloadFile(item.artFileUrl, fileNameFromUrl(item.artFileUrl))}
                          className="text-xs text-blue-600 hover:underline mt-1 flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Baixar arquivo enviado
                        </button>
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

        {/* Logística - Status de Produção e Entrega */}
        <OrderLogisticsPanel
          orderId={o.id}
          productionStatus={o.productionStatus || 'pending'}
          deliveryStatus={o.deliveryStatus || 'pending'}
        />

        {/* Logística - Informações de Frete */}
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

        {/* Etiqueta de Envio */}
        <ShippingLabelViewer orderId={o.id} />

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

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95" aria-describedby={undefined}>
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizar imagem</DialogTitle>
            <DialogDescription>Visualização em tela cheia da imagem selecionada</DialogDescription>
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
                alt="Visualização"
                className="w-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
