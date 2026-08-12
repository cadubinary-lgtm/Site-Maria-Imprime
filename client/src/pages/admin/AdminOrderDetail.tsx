import { useState, useRef, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2, ChevronLeft, Package, User, DollarSign, Truck, CheckCircle2,
  Download, FileImage, Upload, Trash2, Eye, ImagePlus, X, Printer, FileText,
  Ruler, Layers, Weight, StickyNote, AlertCircle, Clock, CheckCircle, PlayCircle, ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { ORDER_STATUS } from "./AdminOrders";
import { OrderItemSpecs } from "@/components/OrderItemSpecs";
import { OrderShippingPanel } from "@/components/orders/OrderShippingPanel";
import { ShippingLabelViewer } from "@/components/orders/ShippingLabelViewer";
import AdminLayout from "@/components/AdminLayout";
import { getAdminReturnTarget } from "@/lib/adminNavigation";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Formata telefone para (XX) XXXXX-XXXX ou (XX) XXXX-XXXX */
function formatPhone(phone?: string | null): string {
  if (!phone) return "Não informado";
  const cleaned = phone.replace(/\D/g, "");
  // Remove +55 se vier com código do país (13 dígitos = +55 + 11)
  const local = cleaned.startsWith("55") && cleaned.length > 11 ? cleaned.slice(2) : cleaned;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  } else if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}

/** Formata CPF/CNPJ para exibição */
function formatCpfCnpj(doc?: string | null): string {
  if (!doc) return "Não informado";
  const cleaned = doc.replace(/\D/g, "");
  if (cleaned.length === 11) {
    // CPF: XXX.XXX.XXX-XX
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  } else if (cleaned.length === 14) {
    // CNPJ: XX.XXX.XXX/XXXX-XX
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  return doc;
}

/** Formata endereço completo */
function formatAddress(order: any): string {
  const parts = [];
  if (order.deliveryStreet) parts.push(order.deliveryStreet);
  if (order.deliveryNumber) parts.push(order.deliveryNumber);
  if (order.deliveryComplement) parts.push(order.deliveryComplement);
  if (order.deliveryNeighborhood) parts.push(order.deliveryNeighborhood);
  if (order.deliveryCity || order.deliveryState) {
    const city = order.deliveryCity || "";
    const state = order.deliveryState || "";
    parts.push(`${city}${city && state ? "/" : ""}${state}`);
  }
  if (order.deliveryZipCode) parts.push(`CEP ${order.deliveryZipCode}`);
  return parts.length > 0 ? parts.join(" - ") : "Endereço não informado";
}

function getAdminStatusSteps(order: any) {
  const isPickup = order.shippingMethod === "retirada" || order.shippingMethod === "pickup" || !order.deliveryStreet;
  const isInProduction = ["em_producao", "pronto_entrega", "pronto_retirada", "saiu_entrega", "em_transporte", "entregue"].includes(order.status);
  const paymentStep = order.paymentMethod === "pagar_na_retirada"
    ? { key: "pagamento_retirada" }
    : { key: "pagamento_aprovado" };
  const base = [
    paymentStep,
    { key: "analisando" },
    ...(!isInProduction ? [{ key: "com_problemas" }] : []),
    { key: "em_producao" },
  ];
  return isPickup
    ? [...base, { key: "pronto_retirada" }, { key: "entregue" }]
    : [...base, { key: "saiu_entrega" }, { key: "em_transporte" }, { key: "entregue" }];
}

const STATUS_OPTIONS = Object.entries(ORDER_STATUS).map(([value, cfg]) => ({
  value,
  label: `${cfg.icon} ${cfg.label}`,
}));

const PRE_PRODUCTION_OPTIONS = [
  { value: "aguardando_liberacao_comercial", label: "Aguardando Liberação Comercial", icon: Clock, color: "bg-gray-100 text-gray-500" },
  { value: "liberado_analise",              label: "Liberado para Análise",          icon: Clock,       color: "bg-yellow-100 text-yellow-700" },
  { value: "ajustar_arte",                  label: "Ajustar Arte",                   icon: AlertCircle, color: "bg-orange-100 text-orange-700" },
  { value: "aguardando_reenvio_arquivo",    label: "Aguardando Reenvio do Arquivo",  icon: Clock,       color: "bg-red-100 text-red-700" },
  { value: "aguardando_aprovacao_cliente",  label: "Aguardando Aprovação do Cliente", icon: Clock,       color: "bg-purple-100 text-purple-700" },
  { value: "nova_arte_reenviada",           label: "Nova Arte Reenviada",             icon: AlertCircle, color: "bg-amber-100 text-amber-700" },
  { value: "arte_final_aprovada",           label: "Arte Final Aprovada",             icon: CheckCircle, color: "bg-green-100 text-green-700" },
  { value: "em_producao",                   label: "Em Produção",                      icon: CheckCircle, color: "bg-blue-100 text-blue-700" },
];

/** Status do pedido que bloqueiam a pré-impressão */
const LOCKED_ORDER_STATUSES = ["pagamento_aprovado", "pagamento_retirada"];

function fileNameFromUrl(url: string): string {
  try {
    const parts = url.split("/");
    const raw = decodeURIComponent(parts[parts.length - 1] ?? "arquivo");
    // Remove prefixo de timestamp: "1784159743746-nome.cdr" → "nome.cdr"
    const withoutTimestamp = raw.replace(/^\d{10,}-/, '');
    // Remove hash de unicidade adicionado pelo storagePut: "nome_21ba3d1b.cdr" → "nome.cdr"
    const withoutHash = withoutTimestamp.replace(/_[0-9a-f]{8}(\.[^.]+)$/, '$1');
    return withoutHash || raw;
  } catch { return "arquivo"; }
}

async function downloadFile(url: string, name: string, onLegacyError?: () => void) {
  try {
    // Download via fetch + createObjectURL para forçar nome correto
    const resp = await fetch(url);
    if (!resp.ok) {
      // Se 403 em arquivo legado com espaços, acionar callback de toast
      if (resp.status === 403 && onLegacyError) {
        onLegacyError();
        return;
      }
      throw new Error(`HTTP ${resp.status}`);
    }
    const blob = await resp.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
  } catch (err) {
    console.error("[downloadFile] error:", err);
    window.open(url, "_blank");
  }
}

const EXT_COLORS: Record<string, string> = {
  PDF: "bg-red-100 text-red-700", AI: "bg-orange-100 text-orange-700",
  PSD: "bg-blue-100 text-blue-700", CDR: "bg-green-100 text-green-700",
  EPS: "bg-orange-100 text-orange-700", SVG: "bg-teal-100 text-teal-700",
  JPG: "bg-yellow-100 text-yellow-700", JPEG: "bg-yellow-100 text-yellow-700",
  PNG: "bg-indigo-100 text-indigo-700",
};

// ─── Coluna 2: Arquivo do item ───────────────────────────────────────────────
function ItemFileColumn({
  artFileUrl, onLightbox, preProductionStatus, orderItemId, orderId,
}: {
  artFileUrl?: string | null;
  onLightbox: (url: string) => void;
  preProductionStatus?: string;
  orderItemId?: number;
  orderId?: number;
}) {
  const utils = trpc.useUtils();
  const logDownloadMutation = trpc.checkout.logArtDownload.useMutation({
    onSuccess: () => utils.checkout.getOrderItemLogs.invalidate({ orderItemId }),
  });

  // Buscar histórico de versões (logs de reenvio) para exibir versões anteriores
  // Usamos os logs do item para detectar reenvios — por simplicidade, o artFileUrl atual é sempre a versão mais recente
  const isNewArt = preProductionStatus === "nova_arte_reenviada";

  if (!artFileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-gray-300">
        <FileImage className="w-8 h-8 mb-1.5 opacity-40" />
        <p className="text-xs text-gray-400">Sem arquivo</p>
      </div>
    );
  }

  const name = fileNameFromUrl(artFileUrl);
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
  const isPdf = /\.pdf$/i.test(name);
  const ext = (name.split(".").pop() ?? "FILE").toUpperCase();
  const badgeColor = EXT_COLORS[ext] ?? "bg-gray-100 text-gray-700";
  const storageKey = artFileUrl.replace('/manus-storage/', '');
  const isLegacyFile = storageKey.includes(' ');

  function handleDownload() {
    // Registrar log de download quando status é nova_arte_reenviada
    if (isNewArt && orderItemId && orderId) {
      logDownloadMutation.mutate({ orderItemId, orderId });
    }
    downloadFile(
      artFileUrl!,
      name,
      isLegacyFile
        ? () => toast.error(
            'Arquivo legado inacessível',
            {
              description:
                'Este arquivo foi enviado com espaços no nome e está inacessível devido a uma limitação do servidor. Utilize o botão "Solicitar Reenvio de Arte" para atualizar o arquivo com o cliente.',
              duration: 8000,
            }
          )
        : undefined
    );
  }

  return (
    <div className="space-y-2">
      {/* Badge de alerta: Nova Arte Reenviada */}
      {isNewArt && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5 mb-1">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">⚠️ NOVA ARTE REENVIADA</span>
        </div>
      )}

      {/* Label de versão */}
      {isNewArt && (
        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Versão 2 (Atual)</p>
      )}

      {/* Miniatura */}
      {isImage ? (
        <div
          className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
          style={{ width: 120, height: 90 }}
          onClick={() => onLightbox(artFileUrl)}
        >
          <img
            src={artFileUrl} alt={name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </div>
        </div>
      ) : isPdf ? (
        <div
          className="flex flex-col items-center justify-center cursor-pointer rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
          style={{ width: 120, height: 90 }}
          onClick={() => onLightbox(artFileUrl)}
        >
          <FileImage className="w-8 h-8 text-red-500 mb-1" />
          <p className="text-[10px] font-semibold text-red-600">Ver PDF</p>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50"
          style={{ width: 120, height: 90 }}
        >
          <span className={`text-xs font-bold px-2 py-1 rounded ${badgeColor}`}>{ext}</span>
          <p className="text-[10px] text-gray-500 mt-1">Arquivo</p>
        </div>
      )}

      {/* Nome + botões */}
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${badgeColor}`}>{ext}</span>
        <p className="text-xs text-gray-700 truncate flex-1 max-w-[90px]" title={name}>{name}</p>
      </div>
      <div className="flex gap-1">
        {(isImage || isPdf) && (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => onLightbox(artFileUrl)}>
            <Eye className="w-3 h-3" /> Ver
          </Button>
        )}
        <Button variant="outline" size="sm"
          className={`h-7 text-xs gap-1 px-2 ${isNewArt ? "text-amber-700 border-amber-300 hover:bg-amber-50" : "text-gray-600 hover:bg-gray-50"}`}
          title="Baixar arquivo"
          onClick={handleDownload}>
          <Download className="w-3 h-3" /> Baixar
        </Button>
      </div>
    </div>
  );
}

// ─── Coluna 3: Prévia da Arte (independente por item) ───────────────────────
// pendingPreviewFile e pendingPreviewNotes são controlados pelo pai (ItemPreviewSection)
// para que o botão "Enviar para o Cliente" possa disparar o upload junto com a ação de correção
function ArtPreviewColumn({
  orderId, orderItemId, previews, previewsLoading, onLightbox, onRefresh,
  pendingFile, pendingNotes, onPendingFileChange, onPendingNotesChange, selectedStatus,
}: {
  orderId: number; orderItemId: number; previews: any[]; previewsLoading: boolean;
  onLightbox: (url: string) => void; onRefresh: () => void;
  pendingFile: File | null; pendingNotes: string;
  onPendingFileChange: (f: File | null) => void; onPendingNotesChange: (n: string) => void;
  selectedStatus?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [pendingLightbox, setPendingLightbox] = useState(false);

  const deletePreviewMutation = trpc.checkout.deleteArtPreview.useMutation({
    onSuccess: () => { onRefresh(); toast.success("Prévia removida"); },
    onError: (err) => toast.error(err.message || "Erro ao remover prévia"),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onPendingFileChange(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find(it => it.type.startsWith("image/"));
    if (!imageItem) return;
    e.preventDefault();
    const blob = imageItem.getAsFile();
    if (!blob) return;
    // Cria um File com nome descritivo baseado na data/hora
    const ext = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp";
    const now = new Date();
    const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    const file = new File([blob], `print_${ts}.${ext}`, { type: blob.type });
    onPendingFileChange(file);
    toast.success("🖼️ Imagem colada da área de transferência!");
  };

  return (
    <>
    <div className="space-y-3">
      {/* Upload — seleção local ou Ctrl+V; envio acontece via "Enviar para o Cliente" */}
      <div
        ref={dropZoneRef}
        className="bg-orange-50 rounded-lg border border-orange-200 p-2.5 space-y-2 focus-within:ring-2 focus-within:ring-orange-400 focus-within:ring-offset-1"
        onPaste={handlePaste}
        tabIndex={0}
        title="Cole uma imagem aqui com Ctrl+V ou clique em Selecionar"
      >
        <p className="text-[10px] font-semibold text-orange-800 uppercase tracking-wide">Enviar prévia</p>
        <Textarea
          placeholder="Clique aqui e cole o print (Ctrl + V)"
          value={pendingNotes}
          onChange={(e) => onPendingNotesChange(e.target.value)}
          rows={2}
          className="bg-white text-xs py-1.5 w-full resize-none"
        />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />
        
        {pendingFile && (
          <div className="space-y-2">
            <img
              src={URL.createObjectURL(pendingFile)}
              alt="Preview"
              className="w-full max-h-64 object-contain rounded border border-orange-300 bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
              onClick={() => setPendingLightbox(true)}
              title="Clique para ampliar em tela cheia"
            />
            <button
              className="w-full py-1.5 text-sm bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded transition-colors"
              onClick={() => onPendingFileChange(null)}
              title="Remover imagem"
            >
              Excluir
            </button>
          </div>
        )}
        
        {!pendingFile && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 gap-1 px-2.5"
              onClick={() => fileRef.current?.click()}>
              <Upload className="w-3 h-3" />
              Selecionar
            </Button>
            <p className="text-[10px] text-gray-400">JPG/PNG · 10MB · ou <kbd className="bg-orange-100 border border-orange-300 rounded px-0.5 font-mono text-[9px]">Ctrl+V</kbd></p>
          </div>
        )}
        {pendingFile && (
          <p className="text-[10px] text-orange-600 font-medium">
            {selectedStatus === "arte_final_aprovada"
              ? '✅ Arquivo selecionado. Clique em "Salvar" para enviar a prévia da arte final para o cliente e liberar para a produção.'
              : '⚠️ Arquivo selecionado. Clique em "Enviar para o Cliente" para confirmar o envio.'}
          </p>
        )}
      </div>

      {/* Galeria de prévias */}
      {previewsLoading ? (
        <div className="flex justify-center py-2"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
      ) : previews.length === 0 ? (
        <div className="text-center py-2 text-gray-400">
          <ImagePlus className="w-5 h-5 mx-auto mb-0.5 opacity-30" />
          <p className="text-[10px]">Nenhuma prévia enviada</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {previews.map((p: any) => (
            <div key={p.id} className="relative group rounded overflow-hidden border border-gray-200" style={{ width: 56, height: 56 }}>
              <img src={p.imageUrl} alt="Prévia" className="w-full h-full object-cover cursor-pointer" onClick={() => onLightbox(p.imageUrl)} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100">
                <button className="w-5 h-5 bg-white rounded-full flex items-center justify-center" onClick={() => onLightbox(p.imageUrl)}>
                  <Eye className="w-2.5 h-2.5 text-blue-600" />
                </button>
                <button className="w-5 h-5 bg-white rounded-full flex items-center justify-center" onClick={() => deletePreviewMutation.mutate({ previewId: p.id })}>
                  <Trash2 className="w-2.5 h-2.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Lightbox tela cheia para imagem pendente */}
    {pendingLightbox && pendingFile && (
      <div
        className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
        onClick={() => setPendingLightbox(false)}
      >
        <div className="relative max-w-[95vw] max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
          <img
            src={URL.createObjectURL(pendingFile)}
            alt="Prévia ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
          <button
            className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
            onClick={() => setPendingLightbox(false)}
            title="Fechar"
          >
            <X className="w-4 h-4 text-gray-700" />
          </button>
          <p className="text-center text-white/60 text-xs mt-2">Clique fora ou no X para fechar · {pendingFile.name}</p>
        </div>
      </div>
    )}
    </>
  );
}

const PROOF_TERM = `Layout para aprovação! Favor conferir todas as informações contidas no layout. A aprovação do layout é de inteira responsabilidade do cliente a verificação de possíveis erros ortográficos ou de identidade. Cores dos produtos e materiais poderão sofrer variações de 15% para mais ou 15% para menos. Após confirmação, não nos responsabilizamos por erros. Obrigado pela compreensão!`;

function PreImpressaoColumn({
  orderId, orderItemId, preProductionStatus, pendingPreviewFile, pendingPreviewNotes, onPreviewUploaded, onSelectedStatusChange, orderStatus, totalItems, onCollapseItem,
}: {
  orderId: number; orderItemId: number; preProductionStatus: string;
  pendingPreviewFile: File | null; pendingPreviewNotes: string;
  onPreviewUploaded: () => void;
  onSelectedStatusChange?: (s: string) => void;
  orderStatus?: string;
  totalItems?: number;
  onCollapseItem?: () => void;
}) {
  // totalItems: quando > 1, o botão Produzir apenas marca arte_final_aprovada sem mudar status global
  const isCommercialLocked = LOCKED_ORDER_STATUSES.includes(orderStatus ?? "");
  // Quando o pedido está bloqueado comercialmente, exibe sempre o status de espera
  const effectiveStatus = isCommercialLocked ? "aguardando_liberacao_comercial" : preProductionStatus;
  const [selected, setSelected] = useState(effectiveStatus);
  
  // ─── Sincronizar estado local com mudanças de orderStatus (reatividade em tempo real) ───
  useEffect(() => {
    const newEffectiveStatus = isCommercialLocked ? "aguardando_liberacao_comercial" : preProductionStatus;
    setSelected(newEffectiveStatus);
    onSelectedStatusChange?.(newEffectiveStatus);
  }, [orderStatus, preProductionStatus, isCommercialLocked, onSelectedStatusChange]);
  
  // Notifica o pai quando o status muda (para alerta dinâmico na col de prévia)
  const handleSelectedChange = (v: string) => { setSelected(v); onSelectedStatusChange?.(v); };
  const [requireResend, setRequireResend] = useState(false);
  const [sendProof, setSendProof] = useState(false);
  const [operatorNote, setOperatorNote] = useState("");
  const [termText, setTermText] = useState(PROOF_TERM);
  const [isSendingToClient, setIsSendingToClient] = useState(false);
  const [showProductionConfirm, setShowProductionConfirm] = useState(false);
  const [arteFinalAprovada, setArteFinalAprovada] = useState(preProductionStatus === "arte_final_aprovada");
  const utils = trpc.useUtils();

  const mutation = trpc.admin.updatePreProductionStatus.useMutation({
    onSuccess: () => {
      toast.success("Pré-impressão atualizada!");
      utils.checkout.getOrderById.invalidate({ id: orderId });
    },
    onError: () => toast.error("Erro ao atualizar pré-impressão"),
  });

  const productionMutation = trpc.admin.triggerProductionStart.useMutation({
    onSuccess: () => {
      toast.success("▶ Item enviado para produção!");
      utils.checkout.getOrderById.invalidate({ id: orderId });
      utils.checkout.getOrderItemLogs.invalidate({ orderItemId });
      // Colapsa automaticamente o card deste item após aprovar
      onCollapseItem?.();
    },
    onError: () => toast.error("Erro ao iniciar produção"),
  });

  // Query de logs do item (linha do tempo)
  const { data: itemLogs = [] } = trpc.checkout.getOrderItemLogs.useQuery(
    { orderItemId },
    { refetchOnWindowFocus: false }
  );

  const correctionMutation = trpc.checkout.saveArtCorrectionAction.useMutation({
    onSuccess: (data) => {
      const msg = data.correctionAction === "resend"
        ? "📨 Cliente será notificado para reenviar a arte!"
        : "✅ Prova enviada para aprovação do cliente!";
      toast.success(msg);
      // Resetar checkboxes e nota após envio bem-sucedido
      setRequireResend(false);
      setSendProof(false);
      setOperatorNote("");
      setTermText(PROOF_TERM);
      utils.checkout.getOrderById.invalidate({ id: orderId });
      utils.checkout.getItemCorrectionAction.invalidate({ orderItemId });
      utils.checkout.getOrderItemLogs.invalidate({ orderItemId });
    },
    onError: () => toast.error("Erro ao enviar para o cliente"),
  });

  const saveArtPreviewMutation = trpc.checkout.saveArtPreview.useMutation();

  const current = PRE_PRODUCTION_OPTIONS.find(o => o.value === selected);

  const handleRequireResendChange = (checked: boolean) => {
    setRequireResend(checked);
    if (checked) {
      setSendProof(false);
      setOperatorNote(""); // Limpa para o operador descrever o problema
    }
  };

  const handleSendProofChange = (checked: boolean) => {
    setSendProof(checked);
    if (checked) {
      setRequireResend(false);
      setOperatorNote(""); // Mensagem personalizada inicia vazia
      setTermText(PROOF_TERM); // Termo já vem preenchido com o texto oficial
    } else {
      setOperatorNote("");
    }
  };

  return (
    <div className="border-t border-gray-100 pt-3 space-y-2">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
        <Layers className="w-3 h-3 text-orange-500" /> Pré-Impressão
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">Status:</span>
        {current && (
          <Badge className={`${current.color} text-[10px] py-0 px-1.5`}>
            <current.icon className="w-2.5 h-2.5 mr-0.5" />
            {current.label}
          </Badge>
        )}
      </div>
      {/* Banner de bloqueio comercial */}
      {isCommercialLocked && (
        <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 rounded px-2 py-1.5 text-[10px] text-gray-600">
          <span>🔒</span>
          <span>Aguardando liberação do setor comercial. O pedido precisa estar em <strong>Analisando</strong> para liberar a pré-impressão.</span>
        </div>
      )}
      <div className="flex gap-1.5">
        <Select value={selected} onValueChange={handleSelectedChange} disabled={isCommercialLocked}>
          <SelectTrigger className={`flex-1 h-7 text-xs bg-white ${isCommercialLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRE_PRODUCTION_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ações de Correção — ocultas quando arte está aprovada ou pedido bloqueado comercialmente */}
      {isCommercialLocked ? null : <div className="bg-blue-50 rounded-lg border border-blue-200 p-2.5 space-y-2 mt-2">
        <p className="text-[10px] font-semibold text-blue-800 uppercase tracking-wide">Ação de Correção</p>
        <div className="space-y-1.5">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={requireResend}
              onChange={(e) => handleRequireResendChange(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 accent-orange-500 flex-shrink-0"
            />
            <div>
              <p className="text-xs font-medium text-gray-800">Exigir Reenvio do Cliente</p>
              <p className="text-[10px] text-gray-500">Descreva o problema no campo abaixo</p>
            </div>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sendProof}
              onChange={(e) => handleSendProofChange(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 accent-blue-500 flex-shrink-0"
            />
            <div>
              <p className="text-xs font-medium text-gray-800">Enviar Prova para Aprovação</p>
              <p className="text-[10px] text-gray-500">Termo de responsabilidade será preenchido</p>
            </div>
          </label>
        </div>

        {/* Campo 1 — Mensagem personalizada para o cliente */}
        {(requireResend || sendProof) && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-700">
              {requireResend ? "Descreva o problema para o cliente:" : "Mensagem para o cliente (editável):"}
            </p>
            <textarea
              value={operatorNote}
              onChange={(e) => setOperatorNote(e.target.value)}
              placeholder="Digite um recado personalizado para o cliente..."
              rows={3}
              className="w-full text-xs border border-blue-200 rounded p-1.5 resize-none bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        )}

        {/* Campo 2 — Termo de Responsabilidade editável (só aparece ao enviar prova) */}
        {sendProof && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-700">Termo de Responsabilidade (editável):</p>
            <textarea
              value={termText}
              onChange={(e) => setTermText(e.target.value)}
              rows={5}
              className="w-full text-xs border border-blue-200 rounded p-1.5 resize-none bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        )}

        <Button
          size="sm"
          className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700"
          disabled={isSendingToClient || correctionMutation.isPending || (!requireResend && !sendProof)}
          onClick={async () => {
            // Validação: se o status exigir observação obrigatória, verifica se está preenchida
            if ((selected === "liberado_analise" || selected === "ajustar_arte") && !operatorNote.trim()) {
              toast.error("A observação é obrigatória para este status");
              return;
            }
            setIsSendingToClient(true);
            try {
              // Se há prévia pendente para upload, faz o upload primeiro
              let uploadedPreviewUrl: string | undefined;
              let uploadedPreviewKey: string | undefined;
              if (pendingPreviewFile && (sendProof || requireResend)) {
                const formData = new FormData();
                formData.append("file", pendingPreviewFile);
                const res = await fetch("/api/upload-art-preview", { method: "POST", body: formData });
                if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro no upload da prévia"); }
                const { url, key } = await res.json();
                uploadedPreviewUrl = url;
                uploadedPreviewKey = key;
                // Salva a prévia no banco
                await saveArtPreviewMutation.mutateAsync({
                  orderId, orderItemId, imageUrl: url, imageKey: key,
                  notes: pendingPreviewNotes || undefined
                });
                onPreviewUploaded();
              }
              // Dispara a ação de correção
              await correctionMutation.mutateAsync({
                orderItemId,
                requireClientResend: requireResend,
                sendProofForApproval: sendProof,
                operatorNote: operatorNote.trim() || undefined,
                termText: sendProof ? (termText.trim() || undefined) : undefined,
              });
              // Atualiza automaticamente o status de pré-impressão com base na ação selecionada
              const autoStatus = requireResend ? "aguardando_reenvio_arquivo" : "aguardando_aprovacao_cliente";
              await mutation.mutateAsync({ orderItemId, preProductionStatus: autoStatus as any });
            } catch (err: any) {
              toast.error(err?.message || "Erro ao enviar para o cliente");
            } finally {
              setIsSendingToClient(false);
            }
          }}
        >
          {(isSendingToClient || correctionMutation.isPending) ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          Enviar para o Cliente
        </Button>
      </div>}

      {/* ── Bloco fixo: Arte Final Aprovada + Produzir ── */}
      {!isCommercialLocked && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={arteFinalAprovada}
              onChange={(e) => {
                setArteFinalAprovada(e.target.checked);
                if (e.target.checked) {
                  mutation.mutate({ orderItemId, preProductionStatus: "arte_final_aprovada" as any });
                }
              }}
              className="w-3.5 h-3.5 accent-green-600 flex-shrink-0"
            />
            <span className="text-xs font-medium text-gray-700">Arte Final Aprovada</span>
          </label>
          <Button
            size="sm"
            className={`h-7 text-xs px-2.5 transition-colors ${arteFinalAprovada ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            disabled={!arteFinalAprovada || productionMutation.isPending}
            onClick={() => {
              // Multi-item: apenas confirma aprovação deste item; status global aguarda botão verde do rodapé
              if ((totalItems ?? 1) > 1) {
                toast.success("✅ Arte aprovada! Continue aprovando os demais itens.");
                return;
              }
              // 1 item: abre modal de confirmação de produção normalmente
              setShowProductionConfirm(true);
            }}
          >
            {productionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "▶ Produzir"}
          </Button>
        </div>
      )}
      {/* Nota visual para pedidos multi-item: o botão Produzir marca apenas este item */}
      {!isCommercialLocked && (totalItems ?? 1) > 1 && arteFinalAprovada && (
        <p className="text-[10px] text-green-700 italic mt-1">
          ✅ Item aprovado. Use o botão "Enviar para Produção" abaixo para liberar todos os itens.
        </p>
      )}

      {/* Modal de confirmação de início de produção */}
      <Dialog open={showProductionConfirm} onOpenChange={setShowProductionConfirm}>
        <DialogContent className="max-w-sm" aria-describedby="prod-confirm-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <PlayCircle className="w-5 h-5" />
              Iniciar Produção
            </DialogTitle>
            <DialogDescription id="prod-confirm-desc" className="text-sm text-gray-600 pt-1">
              Ao confirmar, o pedido será movido para <strong>Em Produção</strong> e o cliente será notificado. Essa ação não pode ser desfeita automaticamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={() => setShowProductionConfirm(false)}
              disabled={productionMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={productionMutation.isPending}
              onClick={async () => {
                // Se há prévia pendente, faz upload e salva antes de iniciar produção
                if (pendingPreviewFile) {
                  try {
                    const formData = new FormData();
                    formData.append("file", pendingPreviewFile);
                    const res = await fetch("/api/upload-art-preview", { method: "POST", body: formData });
                    if (res.ok) {
                      const { url, key } = await res.json();
                      await saveArtPreviewMutation.mutateAsync({
                        orderId, orderItemId, imageUrl: url, imageKey: key,
                        notes: pendingPreviewNotes || undefined
                      });
                      onPreviewUploaded();
                    }
                  } catch {
                    // Continua para produção mesmo se upload da prévia falhar
                  }
                }
                await productionMutation.mutateAsync({ orderItemId, orderId });
                setShowProductionConfirm(false);
              }}
            >
              {productionMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Confirmar Produção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Linha do tempo de logs do item */}
      {itemLogs.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Histórico
          </p>
          <div className="space-y-1.5">
            {(itemLogs as any[]).map((log: any) => {
              const d = new Date(log.createdAt);
              const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
              const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={log.id} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                  <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-gray-400">[{dateStr} - {timeStr}]</span>{" "}
                    <span className="font-semibold text-gray-700">{log.operatorName ?? "Operador"}</span>{" "}
                    <span className="text-gray-600">{log.action}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Wrapper por item: carrega prévias independentes e renderiza Col 3 ─────────────────
function ItemPreviewSection({
  orderId, orderItemId, preProductionStatus, onLightbox, orderStatus,
  onExternalFileChange, onExternalNotesChange, externalFile,
}: {
  orderId: number; orderItemId: number; preProductionStatus: string;
  onLightbox: (url: string) => void;
  orderStatus?: string;
  onExternalFileChange?: (f: File | null) => void;
  onExternalNotesChange?: (n: string) => void;
  externalFile?: File | null;
}) {
  const utils = trpc.useUtils();
  const [pendingPreviewFile, setPendingPreviewFile] = useState<File | null>(null);
  const [pendingPreviewNotes, setPendingPreviewNotes] = useState("");
  // Estado do status selecionado no dropdown (para mensagem dinâmica no alerta)
  const [selectedStatus, setSelectedStatus] = useState(preProductionStatus);
  
  // Sincronizar selectedStatus com preProductionStatus (reatividade em tempo real)
  useEffect(() => {
    setSelectedStatus(preProductionStatus);
  }, [preProductionStatus]);

  // Quando o pai zerar o arquivo (após envio confirmado), limpar o state local
  useEffect(() => {
    if (externalFile === null || externalFile === undefined) {
      setPendingPreviewFile(null);
      setPendingPreviewNotes("");
    }
  }, [externalFile]);

  const { data: itemPreviews = [], isLoading: itemPreviewsLoading } =
    trpc.checkout.getArtPreviews.useQuery({ orderId, orderItemId });
  const previews = itemPreviews as any[];

  const handlePreviewUploaded = () => {
    setPendingPreviewFile(null);
    setPendingPreviewNotes("");
    utils.checkout.getArtPreviews.invalidate({ orderId, orderItemId });
  };

  return (
    <div className="p-5">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <ImagePlus className="w-3 h-3 text-orange-500" /> Prévia da Arte
      </p>
      <ArtPreviewColumn
        orderId={orderId}
        orderItemId={orderItemId}
        previews={previews}
        previewsLoading={itemPreviewsLoading}
        onLightbox={onLightbox}
        onRefresh={() => utils.checkout.getArtPreviews.invalidate({ orderId, orderItemId })}
        pendingFile={pendingPreviewFile}
        pendingNotes={pendingPreviewNotes}
        onPendingFileChange={(f) => { setPendingPreviewFile(f); onExternalFileChange?.(f); }}
        onPendingNotesChange={(n) => { setPendingPreviewNotes(n); onExternalNotesChange?.(n); }}
        selectedStatus={selectedStatus}
      />
    </div>
  );
}

// ─── Wrapper por item: Pré-Impressão e Ação de Correção (Col 3) ─────────────────
function ItemProductionSection({
  orderId, orderItemId, preProductionStatus, orderStatus, totalItems,
  pendingPreviewFile, pendingPreviewNotes, onPreviewUploaded, onCollapseItem,
}: {
  orderId: number; orderItemId: number; preProductionStatus: string;
  orderStatus?: string;
  totalItems?: number;
  pendingPreviewFile: File | null;
  pendingPreviewNotes: string;
  onPreviewUploaded: () => void;
  onCollapseItem?: () => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState(preProductionStatus);
  
  useEffect(() => {
    setSelectedStatus(preProductionStatus);
  }, [preProductionStatus]);

  return (
    <div className="p-5 space-y-4">
      <PreImpressaoColumn
        orderId={orderId}
        orderItemId={orderItemId}
        preProductionStatus={preProductionStatus}
        pendingPreviewFile={pendingPreviewFile}
        pendingPreviewNotes={pendingPreviewNotes}
        onPreviewUploaded={onPreviewUploaded}
        onSelectedStatusChange={setSelectedStatus}
        orderStatus={orderStatus}
        totalItems={totalItems}
        onCollapseItem={onCollapseItem}
      />
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export function OrderDetailContent({
  orderId: externalOrderId,
  backRoute = "/admin/pedidos",
  backLabel = "Voltar para Pedidos",
}: {
  orderId: number | null;
  backRoute?: string;
  backLabel?: string;
}) {
  const [, setLocation] = useLocation();
  const orderId = externalOrderId;

  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showSendToProductionConfirm, setShowSendToProductionConfirm] = useState(false);
  // Accordion dos cards de item: Set de índices expandidos (todos expandidos por padrão)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const toggleItemExpanded = (idx: number) => setExpandedItems(prev => {
    const next = new Set(prev);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    return next;
  });
  const collapseItem = (idx: number) => setExpandedItems(prev => {
    const next = new Set(prev); next.delete(idx); return next;
  });

  // Estado compartilhado de prévia pendente por itemId (Col2 → Col3)
  const [pendingFiles, setPendingFiles] = useState<Map<number, File>>(new Map());
  const [pendingNotes, setPendingNotes] = useState<Map<number, string>>(new Map());
  const setPendingFile = (itemId: number, file: File | null) => {
    setPendingFiles(prev => { const m = new Map(prev); file ? m.set(itemId, file) : m.delete(itemId); return m; });
  };
  const setPendingNote = (itemId: number, note: string) => {
    setPendingNotes(prev => { const m = new Map(prev); m.set(itemId, note); return m; });
  };

  // Controle de visibilidade de preços por role
  const { adminUser } = useAdminAuth();
  const isProductionRole = adminUser?.role === "production";

  const utils = trpc.useUtils();

  const { data: order, isLoading } = trpc.checkout.getOrderById.useQuery(
    { id: orderId! }, {
      enabled: !!orderId,
      refetchInterval: 15000, // Atualiza a cada 15s para detectar nova arte reenviada pelo cliente
    }
  );
  const { data: history, isLoading: histLoading } = trpc.checkout.getOrderHistory.useQuery(
    { orderId: orderId! }, { enabled: !!orderId }
  );
  // Prévias são carregadas por item individualmente via ItemPreviewCard

  const updateMutation = trpc.checkout.updateOrderStatus.useMutation({
    onSuccess: async () => {
      // Aguarda o refetch completo para que o painel de Pré-Impressão atualize em tempo real
      await utils.checkout.getOrderById.invalidate({ id: orderId! });
      utils.checkout.getOrderHistory.invalidate({ orderId: orderId! });
      utils.checkout.getAllOrders.invalidate();
      utils.admin.getAllOrders.invalidate();
    },
  });

  const sendToProductionMutation = trpc.checkout.sendToProduction.useMutation({
    onSuccess: () => {
      utils.checkout.getOrderById.invalidate({ id: orderId! });
      utils.checkout.getOrderHistory.invalidate({ orderId: orderId! });
      utils.checkout.getAllOrders.invalidate();
      utils.admin.getAllOrders.invalidate();
      toast.success("Pedido enviado para produção com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao enviar para produção");
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
        <Button onClick={() => setLocation(backRoute)}>← {backLabel}</Button>
      </div>
    );
  }

  const o = order as any;
  const sc = ORDER_STATUS[o.status] ?? ORDER_STATUS.analisando;
  const STATUS_STEPS = getAdminStatusSteps(o);
  const currentStepIndex = STATUS_STEPS.findIndex((s: any) => s.key === o.status);
  const isCancelled = o.status === "cancelado";
  if (newStatus === "" && o.status) setNewStatus(o.status);


  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 space-y-6">

          {/* ── Header ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => setLocation(backRoute)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> {backLabel}
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
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-medium">Status atual</p>
                  <p className="font-bold text-indigo-900">{sc.label}</p>
                </div>
              </div>

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
                          <span className={`text-center font-medium leading-tight ${
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

              <div className="border-t pt-4">
                <button
                  onClick={() => setHistoryOpen(prev => !prev)}
                  className="flex items-center gap-2 w-full text-left cursor-pointer group mb-2"
                >
                  <p className="text-sm font-semibold text-gray-700">Histórico de Status</p>
                  <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${historyOpen ? 'rotate-180' : ''}`} />
                </button>
                {historyOpen && (histLoading ? (
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── ITENS DO PEDIDO — card por produto ── */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-700" />
              <h2 className="text-lg font-bold text-gray-900">Itens do Pedido</h2>
              {o.items && <Badge variant="secondary">{o.items.length} {o.items.length === 1 ? "item" : "itens"}</Badge>}
            </div>

            {o.items && o.items.length > 0 ? (
              o.items.map((item: any, i: number) => {
                // Initialize all items as expanded on first render
                if (expandedItems.size === 0 && o.items && o.items.length > 0) {
                  // Use a ref-free approach: start all expanded via the initial Set
                }
                const isExpanded = !expandedItems.has(i);
                // Parse variações
                let variations: { name: string; value: string }[] = [];
                if (item.variationSnapshot) { try { variations = JSON.parse(item.variationSnapshot); } catch {} }
                let attrObj: Record<string, any> = {};
                if (item.selectedAttributes) { try { attrObj = JSON.parse(item.selectedAttributes); } catch {} }

                const dims = item.customDimensions;
                let largura = "", altura = "";
                if (dims) {
                  const parts = String(dims).split(/[xX×]/);
                  if (parts.length >= 2) { largura = parts[0].trim(); altura = parts[1].trim(); }
                }

                const acabamentos = variations.filter(v =>
                  !["peso", "weight", "largura", "altura", "dimensão", "dimensao"].some(k => v.name?.toLowerCase().includes(k))
                );
                const outrasVariacoes = Object.entries(attrObj)
                  .filter(([k]) => !["peso", "weight", "weightKg", "largura", "altura"].includes(k))
                  .map(([k, v]) => ({ name: k, value: String(v) }));

                // Badge de status do item
                const itemStatus = item.preProductionStatus ?? "liberado_analise";
                const itemStatusConfig: Record<string, { label: string; cls: string }> = {
                  liberado_analise: { label: "Liberado para Análise", cls: "bg-yellow-100 text-yellow-800" },
                  aguardando_liberacao_comercial: { label: "Aguardando Liberação", cls: "bg-pink-100 text-pink-800" },
                  ajustar_arte: { label: "Ajustar Arte", cls: "bg-orange-100 text-orange-800" },
                  aguardando_reenvio_arquivo: { label: "Aguardando Reenvio", cls: "bg-orange-100 text-orange-800" },
                  aguardando_aprovacao_cliente: { label: "Aguardando Aprovação", cls: "bg-purple-100 text-purple-800" },
                  nova_arte_reenviada: { label: "Nova Arte Enviada", cls: "bg-indigo-100 text-indigo-800" },
                  arte_final_aprovada: { label: "Arte Final Aprovada", cls: "bg-green-100 text-green-800" },
                  em_producao: { label: "Em Produção", cls: "bg-blue-100 text-blue-800" },
                };
                const statusBadge = itemStatusConfig[itemStatus] ?? { label: itemStatus, cls: "bg-gray-100 text-gray-700" };

                return (
                  <Card key={i} className="border border-gray-200 shadow-sm overflow-hidden">
                    {/* Cabeçalho do item — clicável para expandir/recolher */}
                    <div
                      className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-5 py-3.5 cursor-pointer select-none"
                      onClick={() => toggleItemExpanded(i)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900">{item.productName}</p>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge.cls}`}>
                                {statusBadge.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Preços: ocultos para Linha de Produção */}
                          {!isProductionRole && (
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Unit. {fmt(parseFloat(item.priceAtOrder))}</p>
                              <p className="font-bold text-gray-800">Total: {fmt(parseFloat(item.priceAtOrder) * item.quantity)}</p>
                            </div>
                          )}
                          {/* Seta de toggle */}
                          <div className="text-gray-400 hover:text-gray-600 transition-colors">
                            {isExpanded
                              ? <ChevronUp className="w-5 h-5" />
                              : <ChevronDown className="w-5 h-5" />}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grid 3 colunas com divisores visuais — colapsável */}
                    {isExpanded && <div className="grid grid-cols-1 lg:grid-cols-3">

                      {/* Col 1 — Especificações + Arquivo do Cliente */}
                      <div className="lg:border-r border-gray-100">
                        {/* Especificações */}
                        <div className="p-5 lg:border-b border-gray-100">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                            <Ruler className="w-3 h-3" /> Especificações
                          </p>
                          <OrderItemSpecs
                            customDimensions={item.customDimensions}
                            variationSnapshot={item.variationSnapshot}
                            selectedAttributes={item.selectedAttributes}
                            notes={item.notes}
                          />
                          {!item.customDimensions && !item.variationSnapshot && !item.selectedAttributes && !item.notes && (
                            <p className="text-xs text-gray-400 italic">Sem especificações adicionais</p>
                          )}
                        </div>

                        {/* Arquivo do Cliente */}
                        <div className="p-5">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                            <FileImage className="w-3 h-3 text-blue-500" /> Arquivo do Cliente
                          </p>
                          <ItemFileColumn
                            artFileUrl={item.artFileUrl}
                            onLightbox={setLightboxUrl}
                            preProductionStatus={item.preProductionStatus || "liberado_analise"}
                            orderItemId={item.id}
                            orderId={orderId!}
                          />
                        </div>
                      </div>

                      {/* Col 2 — Prévia da Arte */}
                      <div className="lg:border-r border-gray-100">
                        <ItemPreviewSection
                          orderId={orderId!}
                          orderItemId={item.id}
                          preProductionStatus={item.preProductionStatus || "liberado_analise"}
                          onLightbox={setLightboxUrl}
                          orderStatus={o.status}
                          onExternalFileChange={(f) => setPendingFile(item.id, f)}
                          onExternalNotesChange={(n) => setPendingNote(item.id, n)}
                          externalFile={pendingFiles.get(item.id) ?? null}
                        />
                      </div>

                      {/* Col 3 — Pré-Impressão + Ação de Correção */}
                      <ItemProductionSection
                        orderId={orderId!}
                        orderItemId={item.id}
                        preProductionStatus={item.preProductionStatus || "liberado_analise"}
                        orderStatus={o.status}
                        totalItems={(o.items ?? []).length}
                        pendingPreviewFile={pendingFiles.get(item.id) ?? null}
                        pendingPreviewNotes={pendingNotes.get(item.id) ?? ""}
                        onPreviewUploaded={() => { setPendingFile(item.id, null); setPendingNote(item.id, ""); }}
                        onCollapseItem={() => collapseItem(i)}
                      />

                    </div>}
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

         {/* ── Botão Enviar para Produção — rodapé da seção de itens ── */}
          {(o.status === "com_problemas" || o.status === "analisando") && (() => {
            // Bloco visível para pedidos em análise (analisando) ou com problemas (com_problemas).
            // O status global SÓ muda para em_producao quando o operador clicar em "Enviar para Produção".
            const items: any[] = o.items ?? [];
            // Para pedidos de 1 item: o bloco não precisa aparecer (o botão "Produzir" já cuida disso)
            if (items.length <= 1) return null;

            const allApproved = items.length > 0 && items.every(
              (i: any) => i.preProductionStatus === "arte_final_aprovada"
            );

            // Há ação de correção pendente (resend ou proof) em algum item
            const hasCorrectionPending = items.some(
              (i: any) => i.correctionAction === "resend" || i.correctionAction === "proof"
            );
            const hasRefused = items.some(
              (i: any) => i.preProductionStatus === "com_problemas" && i.clientRefusalNote
            );
            const hasPending = items.some(
              (i: any) => i.preProductionStatus === "aguardando_aprovacao"
            );

            // Regra: se todos aprovados → verde.
            // Se há ação de correção pendente ou recusa → amarelo com motivo.
            // Se nenhum dos dois → não exibe o bloco (operador ainda está analisando).
            if (!allApproved && !hasCorrectionPending && !hasRefused && !hasPending) return null;

            let lockReason = "";
            if (!allApproved) {
              if (hasCorrectionPending || hasPending) lockReason = "Aguardando resposta do cliente";
              else if (hasRefused) lockReason = "Cliente recusou a arte — corrija e reenvie";
              else lockReason = "Todos os itens precisam ter a arte aprovada";
            }

            return (
              <Card className={`border-2 ${
                allApproved ? "border-green-300 bg-green-50" : "border-amber-200 bg-amber-50"
              }`}>
                <CardContent className="py-5">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm mb-1">
                        {allApproved ? "✅ Artes aprovadas — pronto para produção" : "🔒 Aguardando aprovação das artes"}
                      </p>
                      {!allApproved && lockReason && (
                        <p className="text-xs text-amber-700">{lockReason}</p>
                      )}
                      {allApproved && (
                        <p className="text-xs text-green-700">
                          Todos os itens foram aprovados pelo cliente. Clique para iniciar a produção.
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => setShowSendToProductionConfirm(true)}
                      disabled={!allApproved || sendToProductionMutation.isPending}
                      size="lg"
                      className={`gap-2 ${
                        allApproved
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {sendToProductionMutation.isPending
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <PlayCircle className="w-5 h-5" />
                      }
                      Enviar para Produção
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* ── Dados do Cliente ── */}
          {/* ── Modal de confirmação: Enviar para Produção ── */}
          <Dialog open={showSendToProductionConfirm} onOpenChange={setShowSendToProductionConfirm}>
            <DialogContent className="max-w-sm" aria-describedby="send-prod-desc">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-700">
                  <PlayCircle className="w-5 h-5" />
                  Enviar para Produção
                </DialogTitle>
                <DialogDescription id="send-prod-desc" className="text-sm text-gray-600 pt-1">
                  Todos os itens deste pedido serão liberados para a linha de produção e o cliente será notificado. Essa ação não pode ser desfeita automaticamente.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowSendToProductionConfirm(false)}
                  disabled={sendToProductionMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={sendToProductionMutation.isPending}
                  onClick={() => {
                    if (!orderId) return;
                    sendToProductionMutation.mutate({ orderId }, {
                      onSuccess: () => setShowSendToProductionConfirm(false),
                    });
                  }}
                >
                  {sendToProductionMutation.isPending
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    : null}
                  Confirmar Produção
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {(() => {
            // Prioridade: dados do perfil cadastrado > dados do checkout
            const cd = o.customerData;
            const name = cd ? `${cd.firstName} ${cd.lastName}` : (o.deliveryFullName || o.guestName || "Não informado");
            // Telefone: perfil (com remoção de +55) > checkout
            const phone = cd?.phone || o.deliveryPhone || null;
            const email = cd?.email || o.guestEmail || null;
            const cpfCnpj = cd?.cpfCnpj || o.cpfCnpj || null;
            // Endereço: customerData já vem com COALESCE (addr > ca.address*)
            // formatAddress espera campos com prefixo "delivery" — mapeamos aqui
            const addrObj = {
              deliveryStreet: cd?.street || o.deliveryStreet || null,
              deliveryNumber: cd?.number || o.deliveryNumber || null,
              deliveryComplement: cd?.complement || o.deliveryComplement || null,
              deliveryNeighborhood: cd?.neighborhood || o.deliveryNeighborhood || null,
              deliveryCity: cd?.city || o.deliveryCity || null,
              deliveryState: cd?.state || o.deliveryState || null,
              deliveryZipCode: cd?.zipCode || o.deliveryZipCode || null,
            };
            return (
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
                      <p className="font-semibold text-gray-900">{name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Telefone</p>
                      <p className="font-semibold text-gray-900">{formatPhone(phone)}</p>
                    </div>
                    {email && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">E-mail</p>
                        <p className="font-semibold text-gray-900 break-all">{email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">CPF/CNPJ</p>
                      <p className="font-semibold text-gray-900">{formatCpfCnpj(cpfCnpj)}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Endereço de Entrega</p>
                      <p className="font-semibold text-gray-900">{formatAddress(addrObj)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

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
                        o.paymentStatus === "pago" ? "bg-emerald-100 text-emerald-800"
                        : o.paymentStatus === "cancelado" ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {o.paymentStatus === "pago" ? "Pago" : o.paymentStatus === "cancelado" ? "Cancelado" : o.paymentStatus === "reembolsado" ? "Reembolsado" : "Pendente"}
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

          {/* ── Logística e Entrega ── */}
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
    </>
  );
}

export default function AdminOrderDetail() {
  const [, params] = useRoute("/admin/pedidos/:id");
  const orderId = params?.id ? parseInt(params.id) : null;
  const { path: backRoute, label: backLabel } = getAdminReturnTarget("/admin/pedidos");
  return (
    <AdminLayout>
      <OrderDetailContent orderId={orderId} backRoute={backRoute} backLabel={backLabel} />
    </AdminLayout>
  );
}
