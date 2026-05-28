import { useParams, useLocation } from "wouter";
import { useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer, ArrowLeft, Loader2, AlertCircle, FileText,
  User, Phone, MapPin, Package, DollarSign,
  Calendar, Hash, Truck, Image as ImageIcon, Download,
  FileDown, CheckSquare, Scissors,
} from "lucide-react";

// ─── Tipos de impressão disponíveis ──────────────────────────────────────────
type PrintMode = "a4" | "thermal";

// ─── Configuração de status ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; hex: string; bg: string }> = {
  pagamento_aprovado: { label: "Pagamento Aprovado",   hex: "#166534", bg: "#dcfce7" },
  pagamento_retirada: { label: "Pagamento na Retirada", hex: "#1e40af", bg: "#dbeafe" },
  analisando:         { label: "Analisando",            hex: "#9a3412", bg: "#ffedd5" },
  com_problemas:      { label: "Com Problemas",         hex: "#991b1b", bg: "#fee2e2" },
  em_producao:        { label: "Em Produção",           hex: "#6b21a8", bg: "#f3e8ff" },
  pronto_entrega:     { label: "Pronto p/ Entrega",     hex: "#0f766e", bg: "#ccfbf1" },
  pronto_retirada:    { label: "Pronto p/ Retirada",    hex: "#155e75", bg: "#cffafe" },
  entregue:           { label: "Entregue",              hex: "#14532d", bg: "#dcfce7" },
  cancelado:          { label: "Cancelado",             hex: "#374151", bg: "#f3f4f6" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }) : "-";

const fmtDateShort = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }) : "-";

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url);
}

function isPdfUrl(url: string) {
  return /\.pdf(\?.*)?$/i.test(url);
}

function fileNameFromUrl(url: string) {
  try {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1].split("?")[0]);
  } catch {
    return "arquivo";
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminOSPrint() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const orderId = params.id ? parseInt(params.id) : undefined;
  const [printMode, setPrintMode] = useState<PrintMode>("a4");

  const { data, isLoading, error } = trpc.admin.getOrderWithItems.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const { data: orderFiles = [] } = trpc.checkout.getOrderFiles.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const { data: artPreviews = [] } = trpc.checkout.getArtPreviews.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  // URL de acompanhamento para o QR Code
  const trackingUrl = `${window.location.origin}/acompanhar`;

  // ── Impressão nativa (funciona para PDF também via "Salvar como PDF") ────────
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ── Exportar PDF: abre diálogo de impressão com destino PDF pré-selecionado ──
  // Não usamos html2canvas (incompatível com oklch do Tailwind 4).
  // O navegador renderiza o CSS de impressão corretamente e o usuário
  // escolhe "Salvar como PDF" no diálogo nativo.
  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  // ─── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#f97316" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600">Pedido não encontrado</p>
        <Button onClick={() => setLocation("/admin/os")}>← Voltar para OS</Button>
      </div>
    );
  }

  const o = data.order as any;
  const items = data.items as any[];
  const files = orderFiles as any[];
  const previews = artPreviews as any[];
  const sc = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.analisando;
  const isStorePickup = o.freteId === "retirada" || (!o.deliveryStreet && !o.deliveryCity);
  const clientName = o.deliveryFullName || o.guestName || `Cliente #${o.clientId}`;

  const subtotal = items.reduce(
    (acc: number, item: any) => acc + parseFloat(item.priceAtOrder?.toString() ?? "0") * item.quantity,
    0
  );
  const deliveryPrice = parseFloat(o.deliveryPrice?.toString() ?? "0");
  const discount = parseFloat(o.discountAmount?.toString() ?? "0");
  const total = parseFloat(o.totalPrice?.toString() ?? "0");

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          BARRA DE AÇÕES — não aparece na impressão
      ════════════════════════════════════════════════════════════════════ */}
      <div className="no-print bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/os")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> OS
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/pedidos/${orderId}`)}>
            Ver Pedido
          </Button>
          {/* Seletor de modo */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-2">
            {(["a4", "thermal"] as PrintMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setPrintMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  printMode === m
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "a4" ? "A4" : "Térmica 80mm"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:block">OS #{o.orderNumber}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <FileDown className="w-4 h-4 mr-1" />
            Exportar PDF
          </Button>
          <Button
            onClick={handlePrint}
            size="sm"
            style={{ backgroundColor: "#f97316" }}
            className="text-white hover:opacity-90"
          >
            <Printer className="w-4 h-4 mr-1" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ÁREA DE IMPRESSÃO
      ════════════════════════════════════════════════════════════════════ */}
      <div
        className={`bg-gray-200 min-h-screen py-6 print-wrapper ${
          printMode === "thermal" ? "os-thermal" : "os-a4"
        }`}
      >
        <div
          id="os-document"
          className={`mx-auto bg-white shadow-xl os-doc ${
            printMode === "thermal" ? "w-[80mm]" : "w-[210mm]"
          }`}
          style={printMode === "a4" ? { minHeight: "297mm", fontFamily: "Arial, sans-serif" } : { fontFamily: "Arial, sans-serif" }}
        >
          {/* ── CABEÇALHO ─────────────────────────────────────────────────── */}
          {/* Cinza claro = economia de tinta, identidade laranja/preto/cinza */}
          <div
            className="px-6 py-4 flex items-start justify-between border-b-4"
            style={{ backgroundColor: "#f3f4f6", borderBottomColor: "#f97316" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#f97316" }}
              >
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-wide uppercase" style={{ color: "#111827" }}>
                  Ordem de Serviço
                </h1>
                <p className="text-xs" style={{ color: "#6b7280" }}>Gráfica Ponto Digital</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="font-black text-2xl tracking-tight" style={{ color: "#f97316" }}>
                {o.orderNumber}
              </span>
              <span className="text-xs" style={{ color: "#6b7280" }}>{fmtDate(o.createdAt)}</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: sc.bg, color: sc.hex }}
              >
                {sc.label}
              </span>
            </div>
          </div>

          {/* ── FAIXA LARANJA DE METADADOS ────────────────────────────────── */}
          <div
            className="px-6 py-2 flex flex-wrap items-center gap-x-6 gap-y-1"
            style={{ backgroundColor: "#f97316" }}
          >
            {[
              { icon: <Hash className="w-3 h-3" />, label: "OS", value: o.id },
              { icon: <Calendar className="w-3 h-3" />, label: "Emissão", value: fmtDateShort(o.createdAt) },
              {
                icon: <Truck className="w-3 h-3" />,
                label: "Entrega",
                value: isStorePickup ? "Retirada na Loja" : (o.deliveryMethod ?? "A definir"),
              },
              o.paymentMethod
                ? { icon: <DollarSign className="w-3 h-3" />, label: "Pagamento", value: o.paymentMethod }
                : null,
            ]
              .filter(Boolean)
              .map((item: any) => (
                <div key={item.label} className="flex items-center gap-1.5 text-white text-xs">
                  {item.icon}
                  <span className="font-semibold">{item.label}:</span> {item.value}
                </div>
              ))}
          </div>

          {/* ── GRID: CLIENTE | ENTREGA | QR CODE ────────────────────────── */}
          <div className="grid border-b" style={{ gridTemplateColumns: "1fr 1fr 120px", borderColor: "#e5e7eb" }}>
            {/* Cliente */}
            <div className="p-4 border-r" style={{ borderColor: "#e5e7eb" }}>
              <h2
                className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"
                style={{ color: "#9ca3af" }}
              >
                <User className="w-3 h-3" style={{ color: "#f97316" }} /> Cliente
              </h2>
              <p className="font-bold text-sm leading-tight" style={{ color: "#111827" }}>{clientName}</p>
              {o.deliveryPhone && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#4b5563" }}>
                  <Phone className="w-3 h-3" style={{ color: "#9ca3af" }} /> {o.deliveryPhone}
                </p>
              )}
              {(o.guestEmail || o.clientEmail) && (
                <p className="text-xs mt-0.5 truncate" style={{ color: "#6b7280" }}>
                  {o.guestEmail || o.clientEmail}
                </p>
              )}
              {o.notes && (
                <div
                  className="mt-2 rounded p-1.5 border"
                  style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
                >
                  <p className="text-[10px] font-semibold uppercase" style={{ color: "#92400e" }}>Obs.</p>
                  <p className="text-xs mt-0.5" style={{ color: "#78350f" }}>{o.notes}</p>
                </div>
              )}
            </div>

            {/* Entrega */}
            <div className="p-4 border-r" style={{ borderColor: "#e5e7eb" }}>
              <h2
                className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"
                style={{ color: "#9ca3af" }}
              >
                <MapPin className="w-3 h-3" style={{ color: "#f97316" }} /> Entrega / Retirada
              </h2>
              {isStorePickup ? (
                <div
                  className="rounded-lg p-2 flex items-center gap-2 border"
                  style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#16a34a" }} />
                  <div>
                    <p className="font-bold text-xs" style={{ color: "#14532d" }}>Retirada na Loja</p>
                    <p className="text-[10px]" style={{ color: "#15803d" }}>Cliente retira no estabelecimento</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs" style={{ color: "#374151" }}>
                  {o.deliveryStreet && (
                    <p className="font-medium">
                      {o.deliveryStreet}, {o.deliveryNumber}
                      {o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}
                    </p>
                  )}
                  {o.deliveryNeighborhood && (
                    <p>{o.deliveryNeighborhood} · {o.deliveryCity} - {o.deliveryState}</p>
                  )}
                  {o.deliveryZipCode && (
                    <p style={{ color: "#6b7280" }}>CEP: {o.deliveryZipCode}</p>
                  )}
                  {o.deliveryMethod && (
                    <p className="flex items-center gap-1 font-semibold" style={{ color: "#c2410c" }}>
                      <Truck className="w-3 h-3" /> {o.deliveryMethod}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="p-3 flex flex-col items-center justify-center gap-1.5">
              <div
                className="rounded-xl p-1.5 border-2"
                style={{ borderColor: "#fed7aa", backgroundColor: "#fff" }}
              >
                <QRCodeSVG
                  value={trackingUrl}
                  size={72}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-center" style={{ color: "#9ca3af" }}>
                Rastrear
              </p>
              <p className="text-[9px] font-black text-center" style={{ color: "#f97316" }}>
                {o.orderNumber}
              </p>
            </div>
          </div>

          {/* ── TABELA DE PRODUTOS ────────────────────────────────────────── */}
          <div className="border-b" style={{ borderColor: "#e5e7eb" }}>
            <div
              className="px-5 py-2 flex items-center gap-2 border-b"
              style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
            >
              <Package className="w-3.5 h-3.5" style={{ color: "#f97316" }} />
              <h2
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: "#4b5563" }}
              >
                Produtos / Serviços
              </h2>
            </div>
            {items.length === 0 ? (
              <div className="px-5 py-4 text-center text-xs" style={{ color: "#9ca3af" }}>
                Nenhum produto neste pedido
              </div>
            ) : (
              <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
                    <th className="text-left font-semibold px-5 py-2 text-[10px] uppercase tracking-wide">
                      Produto / Serviço
                    </th>
                    <th className="text-center font-semibold px-3 py-2 text-[10px] uppercase tracking-wide w-12">
                      Qtd
                    </th>
                    <th className="text-right font-semibold px-4 py-2 text-[10px] uppercase tracking-wide w-24">
                      Unit.
                    </th>
                    <th className="text-right font-semibold px-5 py-2 text-[10px] uppercase tracking-wide w-28">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, i: number) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <td className="px-5 py-2.5">
                        <p className="font-bold" style={{ color: "#111827" }}>{item.productName}</p>
                        {item.selectedAttributes && (
                          <p className="text-[10px] mt-0.5" style={{ color: "#6b7280" }}>
                            {item.selectedAttributes}
                          </p>
                        )}
                        {item.notes && (
                          <p
                            className="text-[10px] mt-0.5 rounded px-1.5 py-0.5 inline-block"
                            style={{ color: "#c2410c", backgroundColor: "#fff7ed" }}
                          >
                            {item.notes}
                          </p>
                        )}
                        {item.artFileUrl && (
                          <p className="text-[9px] mt-0.5" style={{ color: "#9ca3af" }}>
                            Arquivo: {fileNameFromUrl(item.artFileUrl)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold" style={{ color: "#1f2937" }}>
                        {item.quantity}
                      </td>
                      <td className="px-4 py-2.5 text-right" style={{ color: "#4b5563" }}>
                        {fmt(parseFloat(item.priceAtOrder?.toString() ?? "0"))}
                      </td>
                      <td className="px-5 py-2.5 text-right font-black" style={{ color: "#111827" }}>
                        {fmt(parseFloat(item.priceAtOrder?.toString() ?? "0") * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── RESUMO FINANCEIRO + ARQUIVOS ──────────────────────────────── */}
          <div className="grid grid-cols-2 border-b" style={{ borderColor: "#e5e7eb" }}>
            {/* Financeiro */}
            <div className="p-4 border-r" style={{ borderColor: "#e5e7eb" }}>
              <h2
                className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1"
                style={{ color: "#9ca3af" }}
              >
                <DollarSign className="w-3 h-3" style={{ color: "#f97316" }} /> Resumo Financeiro
              </h2>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs" style={{ color: "#4b5563" }}>
                  <span>Subtotal</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                {deliveryPrice > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: "#4b5563" }}>
                    <span>Frete</span>
                    <span className="font-medium">{fmt(deliveryPrice)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-xs" style={{ color: "#15803d" }}>
                    <span>Desconto</span>
                    <span className="font-medium">- {fmt(discount)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between font-black text-sm border-t pt-2 mt-1"
                  style={{ borderColor: "#e5e7eb", color: "#111827" }}
                >
                  <span>TOTAL</span>
                  <span className="text-base" style={{ color: "#f97316" }}>{fmt(total)}</span>
                </div>
                {o.paymentMethod && (
                  <div className="flex justify-between text-[10px] pt-1" style={{ color: "#6b7280" }}>
                    <span>Pagamento</span>
                    <span className="capitalize font-semibold">{o.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Arquivos */}
            <div className="p-4">
              <h2
                className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"
                style={{ color: "#9ca3af" }}
              >
                <ImageIcon className="w-3 h-3" style={{ color: "#f97316" }} /> Arquivos do Cliente
              </h2>
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 gap-1" style={{ color: "#d1d5db" }}>
                  <ImageIcon className="w-6 h-6" />
                  <p className="text-[10px]">Nenhum arquivo enviado</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {files.slice(0, 6).map((file: any, i: number) => (
                    <div
                      key={i}
                      className="rounded overflow-hidden border"
                      style={{ borderColor: "#e5e7eb" }}
                    >
                      {isImageUrl(file.artFileUrl) ? (
                        <img
                          src={file.artFileUrl}
                          alt={`Arte ${i + 1}`}
                          className="w-full h-14 object-contain p-0.5"
                          style={{ backgroundColor: "#f9fafb" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : isPdfUrl(file.artFileUrl) ? (
                        <div
                          className="h-14 flex flex-col items-center justify-center gap-0.5"
                          style={{ backgroundColor: "#fef2f2" }}
                        >
                          <FileText className="w-5 h-5" style={{ color: "#f87171" }} />
                          <span className="text-[8px] font-bold" style={{ color: "#dc2626" }}>PDF</span>
                        </div>
                      ) : (
                        <div
                          className="h-14 flex flex-col items-center justify-center gap-0.5"
                          style={{ backgroundColor: "#f9fafb" }}
                        >
                          <Download className="w-5 h-5" style={{ color: "#9ca3af" }} />
                          <span className="text-[8px] truncate px-1 w-full text-center" style={{ color: "#6b7280" }}>
                            {fileNameFromUrl(file.artFileUrl).split(".").pop()?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div
                        className="px-1 py-0.5 border-t"
                        style={{ backgroundColor: "#f9fafb", borderColor: "#f3f4f6" }}
                      >
                        <p className="text-[8px] truncate" style={{ color: "#6b7280" }}>{file.productName}</p>
                      </div>
                    </div>
                  ))}
                  {files.length > 6 && (
                    <div
                      className="rounded h-14 flex items-center justify-center border border-dashed"
                      style={{ borderColor: "#d1d5db" }}
                    >
                      <span className="text-[10px]" style={{ color: "#9ca3af" }}>+{files.length - 6}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── PRÉVIAS DE ARTE ───────────────────────────────────────────── */}
          {previews.length > 0 && (
            <div className="p-4 border-b" style={{ borderColor: "#e5e7eb" }}>
              <h2
                className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1"
                style={{ color: "#9ca3af" }}
              >
                <ImageIcon className="w-3 h-3" style={{ color: "#f97316" }} /> Prévia de Arte Aprovada
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((preview: any, i: number) => (
                  <div key={i} className="border rounded overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
                    <img
                      src={preview.imageUrl}
                      alt={`Prévia ${i + 1}`}
                      className="w-full h-20 object-contain bg-white p-1"
                    />
                    {preview.notes && (
                      <div className="px-1.5 py-1 border-t" style={{ backgroundColor: "#f9fafb", borderColor: "#f3f4f6" }}>
                        <p className="text-[9px] line-clamp-2" style={{ color: "#6b7280" }}>{preview.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CONTROLE DE PRODUÇÃO ──────────────────────────────────────── */}
          <div className="p-4 border-b" style={{ borderColor: "#e5e7eb" }}>
            <h2
              className="text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-1"
              style={{ color: "#9ca3af" }}
            >
              <CheckSquare className="w-3 h-3" style={{ color: "#f97316" }} /> Controle de Produção
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Recebido por", sub: "Conferência de entrada" },
                { label: "Produzido por", sub: "Responsável pela arte" },
                { label: "Entregue por", sub: "Conferência de saída" },
              ].map((field) => (
                <div
                  key={field.label}
                  className="rounded-lg p-3 border border-dashed"
                  style={{ borderColor: "#d1d5db" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#4b5563" }}>
                    {field.label}
                  </p>
                  <p className="text-[9px] mb-4" style={{ color: "#9ca3af" }}>{field.sub}</p>
                  <div className="border-t pt-1.5" style={{ borderColor: "#d1d5db" }}>
                    <p className="text-[9px]" style={{ color: "#9ca3af" }}>Assinatura ________________________</p>
                    <p className="text-[9px] mt-1" style={{ color: "#9ca3af" }}>Data _____ / _____ / _________</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RODAPÉ ────────────────────────────────────────────────────── */}
          <div
            className="px-5 py-3 flex items-center justify-between border-t"
            style={{ backgroundColor: "#f9fafb", borderColor: "#e5e7eb" }}
          >
            <div className="flex items-center gap-2">
              <Scissors className="w-3 h-3" style={{ color: "#d1d5db" }} />
              <p className="text-[9px]" style={{ color: "#9ca3af" }}>
                Gráfica Ponto Digital · OS #{o.orderNumber} · Gerada em{" "}
                {new Date().toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px]" style={{ color: "#9ca3af" }}>
                Rastreie em:{" "}
                <span className="font-semibold" style={{ color: "#f97316" }}>
                  {window.location.origin}/acompanhar
                </span>
              </p>
              <QRCodeSVG
                value={trackingUrl}
                size={28}
                bgColor="#f9fafb"
                fgColor="#374151"
                level="L"
                includeMargin={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ESTILOS DE IMPRESSÃO
          Usamos inline styles e cores hex no documento para garantir
          compatibilidade total com html2canvas e impressão nativa.
      ════════════════════════════════════════════════════════════════════ */}
      <style>{`
        /* Oculta a barra de ações na impressão */
        @media print {
          .no-print { display: none !important; }
          .print-wrapper {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .os-doc {
            width: 100% !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        /* Modo térmica na tela */
        .os-thermal .os-doc {
          font-size: 10px;
          line-height: 1.3;
        }
        @media print {
          .os-thermal .os-doc {
            width: 80mm !important;
            font-size: 9px !important;
          }
        }
      `}</style>
    </>
  );
}
