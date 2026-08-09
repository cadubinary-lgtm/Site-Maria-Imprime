import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { EmailTimeline } from "@/components/EmailTimeline";
import { Loader2, ArrowLeft, Package, MapPin, Clock,
  CheckCircle2, Circle, RefreshCw, ShoppingCart,
  FileText, AlertCircle, Upload, ThumbsUp,
  Ruler, Layers, StickyNote, ZoomIn, X, Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { OrderItemSpecs } from "@/components/OrderItemSpecs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// ─── Prévia de Arte Aprovada por Item ───────────────────────────────────────────
// Constrói a URL absoluta da imagem a partir de uma URL relativa ou absoluta,
// garantindo que espaços e caracteres especiais sejam corretamente codificados.
function buildImageUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  // Já é uma URL absoluta (http/https) — apenas encode os espaços
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl.split(" ").join("%20");
  }
  // URL relativa: montar com origin atual + encode de espaços
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return base + rawUrl.split(" ").join("%20");
}

// ─── Alerta de resolução dinâmico ────────────────────────────────────────────
// Determina qual alerta exibir abaixo da prévia com base no status de pré-impressão
// e na ação de correção registrada pelo operador.
function PreviewResolutionAlert({ item }: { item: any }) {
  const { data: correctionData } = trpc.checkout.getItemCorrectionAction.useQuery(
    { orderItemId: item.id },
    { enabled: !!item.id }
  );

  const preProductionStatus: string = item.preProductionStatus ?? "";
  const correctionAction: string | null = correctionData?.correctionAction ?? null;
  const requireClientResend: boolean = correctionData?.requireClientResend ?? false;
  const sendProofForApproval: boolean = correctionData?.sendProofForApproval ?? false;

  // Cenário A — Arte Final Aprovada (em produção)
  if (preProductionStatus === "arte_final_aprovada") {
    return (
      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          ⚠️ <strong>Atenção:</strong> A imagem acima é apenas uma prévia do arquivo que já foi aprovado e encaminhado para a produção. Esta imagem serve estritamente para visualização do layout geral enviado e a qualidade da impressão dependerá estritamente da resolução original do seu arquivo, não sendo de nossa responsabilidade quaisquer distorções ou pixels aparentes decorrentes de artes enviadas em baixa qualidade.
        </p>
      </div>
    );
  }

  // Cenário B — Correção/Ajuste (Ajustar Arte OU Exigir Reenvio)
  if (preProductionStatus === "ajustar_arte" || requireClientResend || correctionAction === "resend") {
    return (
      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          ⚠️ <strong>Atenção:</strong> A imagem acima é um print da tela feito pelo operador para demonstrar o erro localizado na sua arte. A resolução desta imagem serve apenas para referência do ajuste necessário. A qualidade da impressão dependerá estritamente da resolução original do seu arquivo, não sendo de nossa responsabilidade quaisquer distorções ou pixels aparentes decorrentes de artes enviadas em baixa qualidade. Verifique seu arquivo antes de aprovar.
        </p>
      </div>
    );
  }

  // Cenário C — Prova para Validação (Enviar Prova para Aprovação)
  if (sendProofForApproval || correctionAction === "proof") {
    return (
      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          ⚠️ <strong>Atenção:</strong> A imagem acima é uma prova de layout para sua validação visual. Lembramos que a impressão final utilizará diretamente o arquivo enviado por você (incluindo artes feitas por IA ou outros aplicativos). A qualidade da impressão dependerá estritamente da resolução original do seu arquivo, não sendo de nossa responsabilidade quaisquer distorções ou pixels aparentes decorrentes de artes enviadas em baixa qualidade. Verifique seu arquivo antes de aprovar.
        </p>
      </div>
    );
  }

  // Nenhum alerta para status de transição interna (liberado_analise, aguardando_*, etc.)
  return null;
}

function ItemApprovedPreview({ item, onLightbox, orderStatus }: { item: any; onLightbox: (url: string) => void; orderStatus?: string }) {
  const [imgError, setImgError] = useState(false);

  // Bloco verde só aparece se: status global é 'em_producao' (ou posterior) OU dropdown rosa salvo em 'arte_final_aprovada'
  const IN_PRODUCTION_STATUSES = ['em_producao', 'pronto_entrega', 'pronto_retirada', 'saiu_entrega', 'em_transporte', 'entregue'];
  const isInProduction = IN_PRODUCTION_STATUSES.includes(orderStatus ?? '');
  const isArteFinalAprovada = (item.preProductionStatus ?? '') === 'arte_final_aprovada';
  if (!isInProduction && !isArteFinalAprovada) return null;

  const { data: previews = [], isLoading } = trpc.checkout.getArtPreviews.useQuery(
    { orderId: item.orderId, orderItemId: item.id },
    { enabled: !!item.id && !!item.orderId }
  );

  // Aguardar o carregamento antes de decidir se há prévias
  if (isLoading) {
    return (
      <div className="mt-3 border border-green-200 bg-green-50 rounded-xl p-3 flex items-center gap-2">
        <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
        <span className="text-xs text-green-700">Carregando arte aprovada...</span>
      </div>
    );
  }

  const previewList = previews as any[];
  if (previewList.length === 0) return null;

  // A query retorna em ordem decrescente (mais recente primeiro) — usar o índice 0
  const latest = previewList[0];
  const imageUrl = buildImageUrl(latest.imageUrl ?? "");

  const handleOpen = () => {
    if (imageUrl) {
      onLightbox(imageUrl);
      setImgError(false);
    }
  };

  return (
    <div className="mt-3 border border-green-200 bg-green-50 rounded-xl p-3">
      <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
        <span className="text-green-500">🟢</span> Arte final aprovada para produção
      </p>
      <div className="flex items-start gap-3">
        <div className="relative group cursor-pointer" onClick={handleOpen}>
          {imgError ? (
            <div className="w-20 h-20 rounded-lg border border-green-200 bg-green-100 flex flex-col items-center justify-center gap-1">
              <ZoomIn className="w-5 h-5 text-green-500" />
              <span className="text-[9px] text-green-600 text-center leading-tight">Clique para<br/>abrir</span>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Arte aprovada"
              className="w-20 h-20 object-cover rounded-lg border border-green-200 shadow-sm"
              onError={() => setImgError(true)}
              onLoad={() => setImgError(false)}
            />
          )}
          <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs text-green-700">Clique na imagem para visualizar em tela cheia.</p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-100 gap-1.5"
            onClick={handleOpen}
          >
            <ZoomIn className="w-3.5 h-3.5" /> Ver Arte Aprovada
          </Button>
        </div>
      </div>
      {/* Alerta dinâmico de resolução — exibido logo abaixo da prévia */}
      <PreviewResolutionAlert item={item} />
    </div>
  );
}

// ─── Versão compacta (legenda discreta) do alerta de resolução ─────────────────
function PreviewResolutionAlertCompact({ item }: { item: any }) {
  const { data: correctionData } = trpc.checkout.getItemCorrectionAction.useQuery(
    { orderItemId: item.id },
    { enabled: !!item.id }
  );
  const preProductionStatus: string = item.preProductionStatus ?? "";
  const correctionAction: string | null = correctionData?.correctionAction ?? null;
  const requireClientResend: boolean = correctionData?.requireClientResend ?? false;
  const sendProofForApproval: boolean = correctionData?.sendProofForApproval ?? false;

  let text = "";
  if (preProductionStatus === "arte_final_aprovada") {
    text = "Prévia do arquivo aprovado. Qualidade de impressão depende da resolução original do arquivo enviado.";
  } else if (preProductionStatus === "ajustar_arte" || requireClientResend || correctionAction === "resend") {
    text = "Print do operador para referência do ajuste. Qualidade de impressão depende da resolução original do arquivo enviado.";
  } else if (sendProofForApproval || correctionAction === "proof") {
    text = "Prova de layout para validação visual. Qualidade de impressão depende da resolução original do arquivo enviado.";
  }

  if (!text) return null;
  return (
    <p className="text-[11px] text-gray-500 italic text-center leading-relaxed px-2">
      ⚠️ {text}
    </p>
  );
}

// ─── Componente de Ação de Correção por Item ──────────────────────────────────────────────────────────────────────────────
function ItemCorrectionAction({ item, orderId }: { item: any; orderId: number }) {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showRefusalInput, setShowRefusalInput] = useState(false);
  const [refusalNote, setRefusalNote] = useState("");
  const [termAccepted, setTermAccepted] = useState(false);

  const { data: correctionData, isLoading } = trpc.checkout.getItemCorrectionAction.useQuery(
    { orderItemId: item.id },
    { enabled: !!item.id }
  );

  const approveMutation = trpc.checkout.clientApproveProof.useMutation({
    onSuccess: () => {
      toast.success("✅ Arte aprovada! Produção iniciada.");
      utils.checkout.getOrderByNumber.invalidate();
      utils.checkout.getItemCorrectionAction.invalidate({ orderItemId: item.id });
    },
    onError: (err) => toast.error(err?.message || "Erro ao aprovar arte. Tente novamente."),
  });

  const refuseMutation = trpc.checkout.clientRefuseProof.useMutation({
    onSuccess: () => {
      toast.success("Recusa registrada. Nossa equipe irá revisar e entrar em contato.");
      setShowRefusalInput(false);
      setRefusalNote("");
      utils.checkout.getOrderByNumber.invalidate();
      utils.checkout.getItemCorrectionAction.invalidate({ orderItemId: item.id });
    },
    onError: (err) => toast.error(err?.message || "Erro ao registrar recusa. Tente novamente."),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSendArt = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      // Chunked upload: pedaços de 5MB para contornar o limite do gateway
      const CHUNK_SIZE = 5 * 1024 * 1024;
      const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
      const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let finalUrl: string | undefined;
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const chunk = selectedFile.slice(start, start + CHUNK_SIZE);
        const fd = new FormData();
        fd.append("chunk", chunk, selectedFile.name);
        fd.append("uploadId", uploadId);
        fd.append("chunkIndex", String(i));
        fd.append("totalChunks", String(totalChunks));
        fd.append("filename", selectedFile.name);
        fd.append("contentType", selectedFile.type || "application/octet-stream");
        fd.append("orderItemId", String(item.id));
        const res = await fetch("/api/upload-art-chunk", { method: "POST", body: fd });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error || `Upload falhou (HTTP ${res.status})`);
        }
        const data = await res.json();
        if (data.status === "complete") {
          finalUrl = data.url;
        }
      }
      if (!finalUrl) throw new Error("Upload incompleto");
      // Notificar o backend sobre o reenvio com a nova URL
      const notifyFd = new FormData();
      notifyFd.append("orderItemId", String(item.id));
      notifyFd.append("artUrl", finalUrl);
      const notifyRes = await fetch("/api/upload-art-notify", { method: "POST", body: notifyFd });
      if (!notifyRes.ok) {
        // Fallback: mesmo sem notificação, o upload foi feito
        console.warn("[upload-art-notify] falhou, mas upload ok");
      }
      // Backend já salva artFileUrl, atualiza status e notifica operador
      toast.success("✅ Arte reenviada com sucesso! Nossa equipe irá analisar em breve.");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
      // Aguarda invalidate para garantir refetch imediato na tela
      await Promise.all([
        utils.checkout.getOrderByNumber.invalidate(),
        utils.checkout.getItemCorrectionAction.invalidate({ orderItemId: item.id }),
        utils.checkout.getArtPreviews.invalidate({ orderId: item.orderId, orderItemId: item.id }),
      ]);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  // Hook de prévias de arte — DEVE ficar aqui no topo (regras dos hooks do React)
  const artPreviewsQuery = trpc.checkout.getArtPreviews.useQuery(
    { orderId: item.orderId, orderItemId: item.id },
    { enabled: !!item.id && !!item.orderId }
  );

  if (isLoading || !correctionData?.correctionAction) return null;

  // Opção 1: Exigir Reenvio do Cliente
  if (correctionData.correctionAction === "resend") {
    return (
      <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 mt-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-bold text-orange-800">⚠️ Arte com problemas — Reenvio necessário</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Nossa equipe analisou a arte deste produto e identificou um problema. Veja abaixo o que precisa ser corrigido.
              </p>
            </div>
            {correctionData.operatorNote && (
              <div className="bg-white border border-orange-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-orange-700 mb-1">📋 Problema identificado:</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{correctionData.operatorNote}</p>
              </div>
            )}
            {/* Prévia do erro enviada pelo operador */}
            {(() => {
              const latestPreview = (artPreviewsQuery.data as any[])?.[0];
              const previewUrl = latestPreview?.imageUrl ? buildImageUrl(latestPreview.imageUrl) : null;
              if (!previewUrl) return null;
              return (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-orange-700">🖼️ Print do erro identificado:</p>
                  <img
                    src={previewUrl}
                    alt="Print do erro"
                    className="w-full max-h-64 object-contain rounded-lg border border-orange-200 bg-white cursor-pointer"
                    onClick={() => window.open(previewUrl, "_blank")}
                    title="Clique para ampliar"
                  />
                  <p className="text-[10px] text-orange-500">Clique na imagem para ampliar</p>
                </div>
              );
            })()}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Selecione o arquivo corrigido e clique em Enviar:</p>
              <input ref={fileRef} type="file" accept="image/*,.pdf,.ai,.eps,.cdr,.psd,.tif,.tiff" className="hidden" onChange={handleFileSelect} />
              {!selectedFile ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-400 text-orange-700 hover:bg-orange-100 gap-2"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Escolher Arquivo Corrigido
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-2">
                    <FileText className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <span className="text-xs text-gray-700 truncate flex-1">{selectedFile.name}</span>
                    <button
                      className="text-gray-400 hover:text-red-500 text-xs ml-1"
                      onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    >✕</button>
                  </div>
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white gap-2 w-full sm:w-auto"
                    disabled={isUploading}
                    onClick={handleSendArt}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? "Enviando..." : "Enviar Nova Arte"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Opção 2: Enviar Prova para Aprovação — layout em duas colunas
  if (correctionData.correctionAction === "proof") {
    // Usa o hook já declarado no topo do componente (regras dos hooks do React)
    const latestPreview = (artPreviewsQuery.data as any[])?.[0];
    const previewImageUrl = latestPreview?.imageUrl ? buildImageUrl(latestPreview.imageUrl) : (item.artPreviewUrl ? buildImageUrl(item.artPreviewUrl) : null);

    // Texto do WhatsApp com número do pedido
    const waMessage = encodeURIComponent(`Olá, estou com dúvidas sobre a prévia da arte do meu pedido ${item.orderNumber || item.orderId}`);
    const waLink = `https://wa.me/5522999459596?text=${waMessage}`;

    // Termo de responsabilidade — vem do banco (editado pelo operador) ou usa o texto padrão
    const PROOF_TERM_DEFAULT = "Layout para aprovação! Favor conferir todas as informações contidas no layout. A aprovação do layout é de inteira responsabilidade do cliente a verificação de possíveis erros ortográficos ou de identidade. Cores dos produtos e materiais poderão sofrer variações de 15% para mais ou 15% para menos. Após confirmação, não nos responsabilizamos por erros. Obrigado pela compreensão!";
    const termText = (correctionData as any).termText?.trim() || PROOF_TERM_DEFAULT;
    // Nota do operador — exibida SOMENTE no balão de chat, se existir
    const operatorNote = correctionData.operatorNote?.trim() || null;

    return (
      <div className="border border-blue-200 bg-blue-50 rounded-xl overflow-hidden mt-3">
        {/* Cabeçalho */}
        <div className="px-4 pt-4 pb-2 border-b border-blue-100">
          <p className="text-sm font-bold text-blue-800">🎨 Prévia da Arte Pronta para Aprovação</p>
        </div>

        {/* Layout em duas colunas */}
        <div className="flex flex-col md:flex-row gap-0">

          {/* ── Coluna Esquerda: Imagem (55%) ── */}
          <div className="md:w-[55%] p-4 flex flex-col items-center justify-start gap-3 border-b md:border-b-0 md:border-r border-blue-100 bg-white/60">
            {previewImageUrl ? (
              <>
                <div
                  className="relative group cursor-pointer w-full max-w-xs"
                  onClick={() => {
                    const url = previewImageUrl;
                    if (url) {
                      // Abre lightbox via evento customizado ou window.open
                      window.open(url, "_blank");
                    }
                  }}
                >
                  <img
                    src={previewImageUrl}
                    alt="Prévia da Arte"
                    className="w-full rounded-xl border border-blue-200 shadow-sm object-contain max-h-64"
                  />
                  <div className="absolute inset-0 bg-black/25 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/90 rounded-full p-2">
                      <ZoomIn className="w-5 h-5 text-blue-700" />
                    </div>
                  </div>
                </div>
                {/* Legenda discreta abaixo da imagem */}
                <PreviewResolutionAlertCompact item={item} />
              </>
            ) : (
              <div className="w-full max-w-xs h-40 rounded-xl border border-blue-200 bg-blue-100/50 flex flex-col items-center justify-center gap-2">
                <FileText className="w-8 h-8 text-blue-400" />
                <p className="text-xs text-blue-600 text-center">Prévia sendo preparada<br/>pela nossa equipe</p>
              </div>
            )}
          </div>

          {/* ── Coluna Direita: Informações e Ações (45%) ── */}
          <div className="md:w-[45%] p-4 flex flex-col gap-3 min-w-0">

            {/* Mensagem da equipe (balão de chat) — só aparece se o operador digitou algo */}
            {operatorNote ? (
              <div className="bg-blue-100 border border-blue-200 rounded-2xl rounded-tl-sm px-3 py-2.5">
                <p className="text-xs font-semibold text-blue-700 mb-1">⚠️ Notas do Layout:</p>
                <p className="text-xs text-blue-900 leading-relaxed whitespace-pre-wrap">{operatorNote}</p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tl-sm px-3 py-2.5">
                <p className="text-[11px] font-semibold text-green-700 mb-1">✅ Arte pronta para aprovação!</p>
                <p className="text-xs text-green-800 leading-relaxed">Nossa equipe preparou a arte do seu produto. Revise com atenção antes de aprovar.</p>
              </div>
            )}

            {/* Termo de Responsabilidade retrátil — texto jurídico fixo */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="term" className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <AccordionTrigger className="px-3 py-2.5 text-xs font-medium text-gray-600 hover:no-underline hover:bg-gray-50">
                  📄 Termo de Responsabilidade
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <p className="text-[11px] text-gray-500 leading-relaxed">{termText}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Botões de ação */}
            <div className="space-y-2">
              {!showRefusalInput ? (
                <>
                  {/* Checkbox obrigatório de aceite do termo */}
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termAccepted}
                      onChange={(e) => setTermAccepted(e.target.checked)}
                      className="mt-0.5 w-3.5 h-3.5 accent-green-600 flex-shrink-0"
                    />
                    <span className="text-[11px] text-gray-600 leading-tight">
                      Li e aceito o{" "}
                      <span className="font-semibold text-gray-800">Termo de Responsabilidade</span>
                    </span>
                  </label>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-1.5 h-auto py-2.5 text-xs font-semibold px-3 whitespace-normal text-center leading-tight disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={approveMutation.isPending || !termAccepted}
                    onClick={() => approveMutation.mutate({ orderItemId: item.id })}
                  >
                    {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : <ThumbsUp className="w-3.5 h-3.5 flex-shrink-0" />}
                    Aprovar Arte e Iniciar Produção
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 gap-1.5 bg-transparent h-9 text-xs"
                    onClick={() => setShowRefusalInput(true)}
                  >
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    Recusar Prova
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-red-700">Descreva o que precisa ser alterado:</p>
                  <textarea
                    value={refusalNote}
                    onChange={(e) => setRefusalNote(e.target.value)}
                    placeholder="Ex: Preciso que o texto do telefone seja alterado para (11) 99999-0000 e a cor do fundo fique mais escura."
                    rows={3}
                    className="w-full text-xs border border-red-200 rounded-lg p-2 resize-none bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white gap-1.5 flex-1 text-xs"
                      disabled={refuseMutation.isPending || !refusalNote.trim()}
                      onClick={() => refuseMutation.mutate({ orderItemId: item.id, refusalNote: refusalNote.trim() })}
                    >
                      {refuseMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Enviar Recusa
                    </Button>
                    <Button size="sm" variant="outline" className="bg-transparent text-xs" onClick={() => { setShowRefusalInput(false); setRefusalNote(""); }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Botão de suporte WhatsApp — ícone maior, texto em duas linhas */}
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-green-700 hover:text-green-900 transition-colors pt-2.5 border-t border-gray-100 mt-1"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-[11px] leading-tight">
                  Dúvidas sobre a sua arte?<br/>Fale com nosso suporte
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Wrapper com exclusão mútua: Prova Pendente vs Arte Aprovada ────────────────
// Regra: se há uma prova/correção ATIVA (correctionAction não nulo), renderiza APENAS
// o bloco de correção (laranja ou azul). O bloco verde só aparece quando não há
// nenhuma ação pendente E as condições de produção/aprovada são satisfeitas.
function ItemPreviewOrApproved({
  item, orderId, orderStatus, onLightbox
}: {
  item: any; orderId: number; orderStatus?: string; onLightbox: (url: string) => void;
}) {
  const { data: correctionData, isLoading } = trpc.checkout.getItemCorrectionAction.useQuery(
    { orderItemId: item.id },
    { enabled: !!item.id }
  );

  // Enquanto carrega, não renderiza nada para evitar flash
  if (isLoading) return null;

  // Se há uma ação de correção ativa (resend ou proof), renderiza SOMENTE o bloco de correção
  const hasActiveCorrection = !!correctionData?.correctionAction;
  if (hasActiveCorrection) {
    return <ItemCorrectionAction item={item} orderId={orderId} />;
  }

  // Sem ação pendente: renderiza o bloco verde de arte aprovada (se condições satisfeitas)
  return <ItemApprovedPreview item={item} onLightbox={onLightbox} orderStatus={orderStatus} />;
}

// Status steps dinâmicos por tipo de entrega e pagamento
function getStatusSteps(order: any) {
  const isPickup = order.shippingMethod === 'retirada' || order.shippingMethod === 'pickup' || !order.deliveryStreet;
  const isInProduction = ['em_producao', 'pronto_entrega', 'pronto_retirada', 'saiu_entrega', 'em_transporte', 'entregue'].includes(order.status);

  // Passo 1: definir o status de pagamento correto (apenas o que foi usado)
  const paymentStep = order.paymentMethod === 'pagar_na_retirada'
    ? { key: 'pagamento_retirada', label: 'Pagamento\nna Retirada', emoji: '🏪' }
    : { key: 'pagamento_aprovado', label: 'Pagamento\nAprovado', emoji: '💳' };

  // Passo 2: montar fluxo base
  const base = [
    paymentStep,
    { key: 'analisando', label: 'Analisando', emoji: '🔍' },
    // "Com Problemas" só aparece se ainda não entrou em produção
    ...(!isInProduction ? [{ key: 'com_problemas', label: 'Com\nProblemas', emoji: '⚠️' }] : []),
    { key: 'em_producao', label: 'Em\nProdução', emoji: '🏭' },
  ];

  // Passo 3: adicionar etapas finais conforme tipo de entrega
  if (isPickup) {
    return [
      ...base,
      { key: 'pronto_retirada', label: 'Pronto p/\nRetirada', emoji: '🎁' },
      { key: 'entregue', label: 'Retirado', emoji: '✅' },
    ];
  } else {
    return [
      ...base,
      { key: 'em_transporte', label: 'Em\nTransporte', emoji: '🚛' },
      { key: 'entregue', label: 'Entregue', emoji: '✅' },
    ];
  }
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

function formatDate(dateStr: string | Date, includeTime = false) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

// ─── Email History Section ───────────────────────────────────────────────────────
function EmailHistorySection({ orderId }: { orderId: number }) {
  const { data: emails = [], isLoading } = trpc.checkout.getEmailHistory.useQuery(
    { orderId },
    { enabled: !!orderId }
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="w-4 h-4 text-orange-500" />
          Histórico de E-mails
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmailTimeline emails={emails} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

export default function OrderDetailPage() {
  const [, params] = useRoute("/pedido/:id");
  const [, setLocation] = useLocation();
  const orderNumber = params?.id ?? "";
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.checkout.getOrderByNumber.useQuery(
    { orderNumber },
    { enabled: !!orderNumber }
  );

  const reorderMutation = trpc.customerAuth.reorder.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.addedCount} ${result.addedCount === 1 ? "item adicionado" : "itens adicionados"} ao carrinho!`, {
        action: { label: "Ver carrinho", onClick: () => setLocation("/carrinho") },
      });
    },
    onError: () => toast.error("Erro ao recomprar pedido"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <AlertCircle className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">Pedido não encontrado</h2>
        <p className="text-gray-500">Este pedido não existe ou não pertence à sua conta</p>
        <Button onClick={() => setLocation("/meus-pedidos")} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Meus Pedidos
        </Button>
      </div>
    );
  }

  // getOrderByNumber returns the order directly; items come from a separate query
  const order = (data as any)?.order ?? data as any;
  const items = (data as any)?.items ?? [];
  const isCancelled = order.status === "cancelado";
  const STATUS_STEPS = getStatusSteps(order);
  const currentStepIndex = STATUS_STEPS.findIndex((s: any) => s.key === order.status);
  const progressPercent = currentStepIndex >= 0
    ? (currentStepIndex / (STATUS_STEPS.length - 1)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/meus-pedidos")} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Meus Pedidos
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
            <p className="text-sm text-gray-500">Realizado em {formatDate(order.createdAt, true)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => reorderMutation.mutate({ orderId: order.id })}
            disabled={reorderMutation.isPending}
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${reorderMutation.isPending ? "animate-spin" : ""}`} />
            Recomprar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Status Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Acompanhamento do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCancelled ? (
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-700">Pedido Cancelado</p>
                      <p className="text-sm text-red-600">Este pedido foi cancelado. Entre em contato para mais informações.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Current status highlight */}
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200 mb-5">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-orange-600 font-medium">Status atual</p>
                        <p className="font-bold text-orange-800">{STATUS_LABELS[order.status] ?? order.status}</p>
                      </div>
                    </div>

                      {/* Progress bar */}
                    <div className="relative mb-8">
                      {/* Background line */}
                      <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full" />
                      {/* Progress line (only up to current step) */}
                      <div
                        className="absolute top-5 left-5 h-1 bg-orange-500 rounded-full transition-all duration-700"
                        style={{ width: currentStepIndex >= 0 ? `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 0px)` : "0%", maxWidth: "calc(100% - 2.5rem)" }}
                      />
                      {/* Steps */}
                      <div className="relative flex justify-between">
                        {STATUS_STEPS.map((step, i) => {
                          const isPast = i < currentStepIndex;
                          const isCurrent = i === currentStepIndex;
                          const isFuture = i > currentStepIndex;
                          return (
                            <div key={step.key} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 transition-all z-10 relative ${
                                  isCurrent
                                    ? "bg-orange-500 border-orange-500 text-white shadow-md ring-4 ring-orange-100 scale-110"
                                    : isPast
                                    ? "bg-orange-400 border-orange-400 text-white"
                                    : "bg-gray-100 border-gray-200 text-gray-300"
                                }`}
                              >
                                {isPast ? <CheckCircle2 className="w-4 h-4" /> : isCurrent ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-base opacity-40">{step.emoji}</span>}
                              </div>
                              <span
                                className={`text-xs text-center font-medium leading-tight whitespace-pre-line ${
                                  isCurrent ? "text-orange-600 font-bold" : isPast ? "text-orange-400" : "text-gray-300"
                                }`}
                                style={{ fontSize: "0.65rem" }}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="w-4 h-4 text-orange-500" />
                  Itens do Pedido ({(items ?? []).length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(items ?? []).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhum item encontrado</p>
                ) : (
                  (items ?? []).map((item: any) => {
                    // Parse variações e dimensões (igual ao admin)
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

                    return (
                      <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Cabeçalho do item */}
                        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName ?? "Produto"}
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{item.productName ?? "Produto"}</p>
                              <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-400">Unit. {formatCurrency(item.priceAtOrder)}</p>
                            <p className="font-bold text-gray-800 text-sm">Total: {formatCurrency(parseFloat(item.priceAtOrder) * item.quantity)}</p>
                          </div>
                        </div>

                        {/* Corpo: specs + prévia aprovada + ação de correção */}
                        <div className="p-4 space-y-3">
                          {/* Especificações técnicas padronizadas */}
                          <OrderItemSpecs
                            customDimensions={item.customDimensions}
                            variationSnapshot={item.variationSnapshot}
                            selectedAttributes={item.selectedAttributes}
                            notes={item.notes}
                          />

                          {/* Bloco de prévia/correção: exclusão mútua entre prova pendente e arte aprovada */}
                          <ItemPreviewOrApproved item={item} orderId={order.id} orderStatus={order.status} onLightbox={setLightboxUrl} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Card de Retirada na Loja */}
            {(order.shippingMethod === 'retirada' || order.shippingMethod === 'pickup' || !order.deliveryStreet) && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-orange-800">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Retirada na Loja
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Endereço */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">Endereço</p>
                      <p className="text-sm text-gray-600">Av. Ver. Antônio Ferreira dos Santos, 651</p>
                      <p className="text-sm text-gray-600">Braga, Cabo Frio - RJ, 28908-200</p>
                    </div>
                  </div>
                  {/* Telefone */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">📞</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-0.5">Telefone</p>
                      <a href="tel:+5522999459596" className="text-sm text-orange-600 hover:underline">(22) 99945-9596</a>
                    </div>
                  </div>
                  {/* Horários */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 mb-2">Horário de Funcionamento</p>
                      <div className="space-y-1">
                        {[
                          { day: 'Segunda', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Terça', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Quarta', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Quinta', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Sexta', hours: '09:00–12:00 | 13:30–18:00' },
                          { day: 'Sábado', hours: 'Fechado', closed: true },
                          { day: 'Domingo', hours: 'Fechado', closed: true },
                        ].map(({ day, hours, closed }) => (
                          <div key={day} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-medium w-20">{day}</span>
                            <span className={closed ? 'text-red-500 font-medium' : 'text-gray-700'}>{hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Aviso */}
                  <div className="bg-orange-100 rounded-lg p-3">
                    <p className="text-xs text-orange-800">
                      <strong>Importante:</strong> Aguarde o aviso de que seu pedido está pronto antes de vir buscar. Você será notificado por e-mail ou WhatsApp.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery address */}
            {order.deliveryStreet && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.deliveryFullName && (
                    <p className="font-semibold text-gray-800 mb-1">{order.deliveryFullName}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {order.deliveryStreet}, {order.deliveryNumber}
                    {order.deliveryComplement ? `, ${order.deliveryComplement}` : ""}
                  </p>
                  {order.deliveryNeighborhood && (
                    <p className="text-sm text-gray-600">{order.deliveryNeighborhood}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {order.deliveryCity} - {order.deliveryState}
                  </p>
                  {order.deliveryZipCode && (
                    <p className="text-sm text-gray-600">CEP: {order.deliveryZipCode}</p>
                  )}
                  {order.deliveryPhone && (
                    <p className="text-sm text-gray-600 mt-1">📞 {order.deliveryPhone}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {order.notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Observações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 italic">"{order.notes}"</p>
                </CardContent>
              </Card>
            )}

            {/* Email History Timeline */}
            <EmailHistorySection orderId={order.id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Entrega Selecionada */}
            {order.shippingLabel && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Entrega Selecionada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-gray-900">{order.shippingLabel}</p>
                  {order.shippingPrice && (
                    <p className="text-sm text-gray-600 mt-1">{formatCurrency(order.shippingPrice)}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Financial summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({(items ?? []).length} {(items ?? []).length === 1 ? "item" : "itens"})</span>
                  <span>{formatCurrency((order.totalPrice ?? 0) - (order.shippingPrice ?? 0))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete</span>
                  <span>{order.shippingPrice ? formatCurrency(order.shippingPrice) : "Grátis"}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-orange-600 text-lg">{formatCurrency(order.totalPrice)}</span>
                </div>
                <div className={`text-xs px-3 py-2 rounded-lg font-medium text-center ${
                  order.paymentStatus === "pago"
                    ? "bg-green-100 text-green-800"
                    : order.paymentStatus === "falhou"
                    ? "bg-red-100 text-red-800"
                    : "bg-orange-100 text-orange-800"
                }`}>
                  {order.paymentStatus === "pago" ? "✅ Pago"
                    : order.paymentStatus === "falhou" ? "❌ Pagamento Falhou"
                    : "⏳ Pagamento Pendente"}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600"
                onClick={() => reorderMutation.mutate({ orderId: order.id })}
                disabled={reorderMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${reorderMutation.isPending ? "animate-spin" : ""}`} />
                Recomprar este pedido
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/carrinho")}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ver Carrinho
              </Button>
              <Button
                variant="ghost"
                className="w-full text-gray-600"
                onClick={() => setLocation("/meus-pedidos")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Todos os Pedidos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxUrl ?? ""}
            alt="Arte aprovada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
