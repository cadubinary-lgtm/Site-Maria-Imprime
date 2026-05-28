import { useParams, useLocation } from "wouter";
import { useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer, ArrowLeft, Loader2, AlertCircle, FileText,
  User, Phone, MapPin, Package, DollarSign, Clock,
  Calendar, Hash, Truck, Image as ImageIcon, Download,
  FileDown, CheckSquare, Scissors,
} from "lucide-react";

// ─── Tipos de impressão disponíveis ──────────────────────────────────────────
type PrintMode = "a4" | "thermal";

// ─── Configuração de status ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pagamento_aprovado: { label: "Pagamento Aprovado",   color: "text-green-800",  bg: "bg-green-100"  },
  pagamento_retirada: { label: "Pagamento na Retirada", color: "text-blue-800",   bg: "bg-blue-100"   },
  analisando:         { label: "Analisando",            color: "text-orange-800", bg: "bg-orange-100" },
  com_problemas:      { label: "Com Problemas",         color: "text-red-800",    bg: "bg-red-100"    },
  em_producao:        { label: "Em Produção",           color: "text-purple-800", bg: "bg-purple-100" },
  pronto_entrega:     { label: "Pronto p/ Entrega",     color: "text-teal-800",   bg: "bg-teal-100"   },
  pronto_retirada:    { label: "Pronto p/ Retirada",    color: "text-cyan-800",   bg: "bg-cyan-100"   },
  entregue:           { label: "Entregue",              color: "text-emerald-800",bg: "bg-emerald-100"},
  cancelado:          { label: "Cancelado",             color: "text-gray-800",   bg: "bg-gray-100"   },
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
  const printRef = useRef<HTMLDivElement>(null);
  const [printMode, setPrintMode] = useState<PrintMode>("a4");
  const [isExporting, setIsExporting] = useState(false);

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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!printRef.current) return;
    setIsExporting(true);

    // ── Injeta CSS temporário que substitui oklch por hex equivalente ──────
    // html2canvas não suporta oklch (Tailwind 4). Sobrescrevemos as variáveis
    // CSS com valores hex antes da captura e removemos depois.
    const overrideStyle = document.createElement("style");
    overrideStyle.id = "__pdf-oklch-override";
    overrideStyle.textContent = `
      * {
        --background: #ffffff !important;
        --foreground: #0a0a0a !important;
        --card: #ffffff !important;
        --card-foreground: #0a0a0a !important;
        --popover: #ffffff !important;
        --popover-foreground: #0a0a0a !important;
        --primary: #f97316 !important;
        --primary-foreground: #ffffff !important;
        --secondary: #f5f5f5 !important;
        --secondary-foreground: #171717 !important;
        --muted: #f5f5f5 !important;
        --muted-foreground: #737373 !important;
        --accent: #f5f5f5 !important;
        --accent-foreground: #171717 !important;
        --destructive: #ef4444 !important;
        --destructive-foreground: #ffffff !important;
        --border: #e5e7eb !important;
        --input: #e5e7eb !important;
        --ring: #f97316 !important;
        color-scheme: light !important;
      }
    `;
    document.head.appendChild(overrideStyle);

    try {
      // Importação dinâmica para não aumentar bundle inicial
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        // Ignora elementos que não precisam ser capturados
        ignoreElements: (el) => el.classList.contains("print:hidden"),
        onclone: (clonedDoc) => {
          // No clone, força background branco em todos os elementos
          // para evitar que oklch residual quebre a renderização
          const allEls = clonedDoc.querySelectorAll("*");
          allEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const computed = window.getComputedStyle(htmlEl);
            const bg = computed.backgroundColor;
            const color = computed.color;
            // Substitui oklch por transparent/inherit se ainda passar
            if (bg.includes("oklch")) htmlEl.style.backgroundColor = "transparent";
            if (color.includes("oklch")) htmlEl.style.color = "#1a1a1a";
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * pageW) / canvas.width;

      let yPos = 0;
      while (yPos < imgH) {
        if (yPos > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yPos, imgW, imgH);
        yPos += pageH;
      }

      const o = data?.order as any;
      pdf.save(`OS-${o?.orderNumber ?? orderId}.pdf`);
    } catch (err) {
      console.error("Erro ao exportar PDF:", err);
    } finally {
      // Remove o override de CSS
      document.getElementById("__pdf-oklch-override")?.remove();
      setIsExporting(false);
    }
  }, [data, orderId]);

  // ─── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
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

  // Subtotal calculado dos itens
  const subtotal = items.reduce(
    (acc: number, item: any) => acc + parseFloat(item.priceAtOrder?.toString() ?? "0") * item.quantity,
    0
  );
  const deliveryPrice = parseFloat(o.deliveryPrice?.toString() ?? "0");
  const discount = parseFloat(o.discountAmount?.toString() ?? "0");
  const total = parseFloat(o.totalPrice?.toString() ?? "0");

  return (
    <>
      {/* ── Barra de ações (não imprime) ──────────────────────────────────── */}
      <div className="print:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/os")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> OS
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/pedidos/${orderId}`)}>
            Ver Pedido
          </Button>
          {/* Seletor de modo de impressão */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-2">
            <button
              onClick={() => setPrintMode("a4")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                printMode === "a4"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              A4
            </button>
            <button
              onClick={() => setPrintMode("thermal")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                printMode === "thermal"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Térmica 80mm
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:block">OS #{o.orderNumber}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <FileDown className="w-4 h-4 mr-1" />
            )}
            Exportar PDF
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            size="sm"
          >
            <Printer className="w-4 h-4 mr-1" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* ── Área de impressão ─────────────────────────────────────────────── */}
      <div className={`bg-gray-200 print:bg-white min-h-screen py-6 print:py-0 ${
        printMode === "thermal" ? "os-thermal" : "os-a4"
      }`}>
        <div
          ref={printRef}
          className={`mx-auto bg-white shadow-xl print:shadow-none ${
            printMode === "thermal"
              ? "w-[80mm] print:w-full text-[10px]"
              : "w-[210mm] print:w-full"
          }`}
          style={printMode === "a4" ? { minHeight: "297mm" } : {}}
        >
          {/* ════════════════════════════════════════════════════════════════
              CABEÇALHO DA OS
          ════════════════════════════════════════════════════════════════ */}
          <div className="bg-gray-900 text-white px-6 py-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-wide uppercase">Ordem de Serviço</h1>
                <p className="text-gray-400 text-xs">Gráfica Ponto Digital</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <span className="text-orange-400 font-black text-2xl tracking-tight">{o.orderNumber}</span>
              <span className="text-gray-400 text-xs">{fmtDate(o.createdAt)}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                {sc.label}
              </span>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              FAIXA DE METADADOS
          ════════════════════════════════════════════════════════════════ */}
          <div className="bg-orange-500 px-6 py-2 flex flex-wrap items-center gap-x-6 gap-y-1">
            <div className="flex items-center gap-1.5 text-white text-xs">
              <Hash className="w-3 h-3" />
              <span className="font-semibold">ID:</span> {o.id}
            </div>
            <div className="flex items-center gap-1.5 text-white text-xs">
              <Calendar className="w-3 h-3" />
              <span className="font-semibold">Emissão:</span> {fmtDateShort(o.createdAt)}
            </div>
            <div className="flex items-center gap-1.5 text-white text-xs">
              <Truck className="w-3 h-3" />
              <span className="font-semibold">Entrega:</span>{" "}
              {isStorePickup ? "Retirada na Loja" : o.deliveryMethod ?? "A definir"}
            </div>
            {o.paymentMethod && (
              <div className="flex items-center gap-1.5 text-white text-xs">
                <DollarSign className="w-3 h-3" />
                <span className="font-semibold">Pagamento:</span>{" "}
                <span className="capitalize">{o.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              GRID: CLIENTE + ENTREGA + QR CODE
          ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-3 gap-0 border-b border-gray-200">
            {/* Dados do Cliente */}
            <div className="col-span-1 border-r border-gray-200 p-4">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <User className="w-3 h-3 text-orange-500" /> Cliente
              </h2>
              <p className="font-bold text-gray-900 text-sm leading-tight">{clientName}</p>
              {o.deliveryPhone && (
                <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-gray-400" /> {o.deliveryPhone}
                </p>
              )}
              {(o.guestEmail || o.clientEmail) && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{o.guestEmail || o.clientEmail}</p>
              )}
              {o.notes && (
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded p-1.5">
                  <p className="text-[10px] text-yellow-700 font-semibold uppercase">Obs. do cliente</p>
                  <p className="text-xs text-yellow-800 mt-0.5">{o.notes}</p>
                </div>
              )}
            </div>

            {/* Endereço / Entrega */}
            <div className="col-span-1 border-r border-gray-200 p-4">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" /> Entrega / Retirada
              </h2>
              {isStorePickup ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-green-800 text-xs">Retirada na Loja</p>
                    <p className="text-[10px] text-green-600">Cliente retira no estabelecimento</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-xs text-gray-700">
                  {o.deliveryStreet && (
                    <p className="font-medium">{o.deliveryStreet}, {o.deliveryNumber}{o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}</p>
                  )}
                  {o.deliveryNeighborhood && (
                    <p>{o.deliveryNeighborhood} · {o.deliveryCity} - {o.deliveryState}</p>
                  )}
                  {o.deliveryZipCode && (
                    <p className="text-gray-500">CEP: {o.deliveryZipCode}</p>
                  )}
                  {o.deliveryMethod && (
                    <p className="flex items-center gap-1 text-orange-700 font-semibold">
                      <Truck className="w-3 h-3" /> {o.deliveryMethod}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="col-span-1 p-4 flex flex-col items-center justify-center gap-2">
              <div className="bg-white border-2 border-orange-200 rounded-xl p-2 shadow-sm">
                <QRCodeSVG
                  value={trackingUrl}
                  size={80}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wide">Acompanhar Pedido</p>
                <p className="text-[8px] text-gray-400 mt-0.5">Escaneie para rastrear</p>
                <p className="text-[9px] font-black text-orange-600 mt-1">{o.orderNumber}</p>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              TABELA DE PRODUTOS
          ════════════════════════════════════════════════════════════════ */}
          <div className="border-b border-gray-200">
            <div className="bg-gray-50 px-5 py-2 flex items-center gap-2 border-b border-gray-200">
              <Package className="w-3.5 h-3.5 text-orange-500" />
              <h2 className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Produtos / Serviços</h2>
            </div>
            {items.length === 0 ? (
              <div className="px-5 py-4 text-center text-gray-400 text-xs">Nenhum produto neste pedido</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="text-left font-semibold px-5 py-2 text-[10px] uppercase tracking-wide">Produto / Serviço</th>
                    <th className="text-center font-semibold px-3 py-2 text-[10px] uppercase tracking-wide w-12">Qtd</th>
                    <th className="text-right font-semibold px-4 py-2 text-[10px] uppercase tracking-wide w-24">Unit.</th>
                    <th className="text-right font-semibold px-5 py-2 text-[10px] uppercase tracking-wide w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, i: number) => (
                    <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-5 py-2.5">
                        <p className="font-bold text-gray-900">{item.productName}</p>
                        {item.selectedAttributes && (
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {item.selectedAttributes}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-orange-600 mt-0.5 bg-orange-50 rounded px-1.5 py-0.5 inline-block">
                            {item.notes}
                          </p>
                        )}
                        {item.artFileUrl && (
                          <a
                            href={item.artFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-blue-600 hover:underline mt-1 flex items-center gap-1 print:hidden"
                          >
                            <Download className="w-2.5 h-2.5" /> arquivo
                          </a>
                        )}
                        {item.artFileUrl && (
                          <p className="text-[9px] text-gray-400 mt-0.5 hidden print:block">
                            Arquivo: {fileNameFromUrl(item.artFileUrl)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-gray-800">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">
                        {fmt(parseFloat(item.priceAtOrder?.toString() ?? "0"))}
                      </td>
                      <td className="px-5 py-2.5 text-right font-black text-gray-900">
                        {fmt(parseFloat(item.priceAtOrder?.toString() ?? "0") * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              RESUMO FINANCEIRO + ARQUIVOS DO CLIENTE
          ════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-0 border-b border-gray-200">
            {/* Resumo Financeiro */}
            <div className="border-r border-gray-200 p-4">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-orange-500" /> Resumo Financeiro
              </h2>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Subtotal dos produtos</span>
                  <span className="font-medium">{fmt(subtotal)}</span>
                </div>
                {deliveryPrice > 0 && (
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Frete / Entrega</span>
                    <span className="font-medium">{fmt(deliveryPrice)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Desconto</span>
                    <span className="font-medium">- {fmt(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-gray-900 border-t border-gray-200 pt-2 mt-1">
                  <span>TOTAL</span>
                  <span className="text-orange-600 text-base">{fmt(total)}</span>
                </div>
                {o.paymentMethod && (
                  <div className="flex justify-between text-[10px] text-gray-500 pt-1">
                    <span>Forma de pagamento</span>
                    <span className="capitalize font-semibold">{o.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Arquivos do Cliente — miniaturas */}
            <div className="p-4">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-orange-500" /> Arquivos do Cliente
              </h2>
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 text-gray-300 gap-1">
                  <ImageIcon className="w-6 h-6" />
                  <p className="text-[10px]">Nenhum arquivo enviado</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {files.slice(0, 6).map((file: any, i: number) => (
                    <div key={i} className="border border-gray-200 rounded overflow-hidden">
                      {isImageUrl(file.artFileUrl) ? (
                        <img
                          src={file.artFileUrl}
                          alt={`Arte ${i + 1}`}
                          className="w-full h-14 object-contain bg-gray-50 p-0.5"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : isPdfUrl(file.artFileUrl) ? (
                        <div className="h-14 flex flex-col items-center justify-center bg-red-50 gap-0.5">
                          <FileText className="w-5 h-5 text-red-400" />
                          <span className="text-[8px] text-red-600 font-bold">PDF</span>
                        </div>
                      ) : (
                        <div className="h-14 flex flex-col items-center justify-center bg-gray-50 gap-0.5">
                          <Download className="w-5 h-5 text-gray-400" />
                          <span className="text-[8px] text-gray-500 truncate px-1 w-full text-center">
                            {fileNameFromUrl(file.artFileUrl).split(".").pop()?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="bg-gray-50 px-1 py-0.5 border-t border-gray-100">
                        <p className="text-[8px] text-gray-500 truncate">{file.productName}</p>
                      </div>
                    </div>
                  ))}
                  {files.length > 6 && (
                    <div className="border border-dashed border-gray-300 rounded h-14 flex items-center justify-center">
                      <span className="text-[10px] text-gray-400">+{files.length - 6}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              PRÉVIAS DE ARTE (se houver)
          ════════════════════════════════════════════════════════════════ */}
          {previews.length > 0 && (
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-orange-500" /> Prévia de Arte Aprovada
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((preview: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded overflow-hidden">
                    <img
                      src={preview.imageUrl}
                      alt={`Prévia ${i + 1}`}
                      className="w-full h-20 object-contain bg-white p-1"
                    />
                    {preview.notes && (
                      <div className="px-1.5 py-1 bg-gray-50 border-t border-gray-100">
                        <p className="text-[9px] text-gray-500 line-clamp-2">{preview.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════
              CONTROLE DE PRODUÇÃO (assinaturas)
          ════════════════════════════════════════════════════════════════ */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-orange-500" /> Controle de Produção
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Recebido por", sub: "Conferência de entrada" },
                { label: "Produzido por", sub: "Responsável pela arte" },
                { label: "Entregue por", sub: "Conferência de saída" },
              ].map((field) => (
                <div key={field.label} className="border border-dashed border-gray-300 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{field.label}</p>
                  <p className="text-[9px] text-gray-400 mb-4">{field.sub}</p>
                  <div className="border-t border-gray-300 pt-1.5">
                    <p className="text-[9px] text-gray-400">Assinatura ________________________</p>
                    <p className="text-[9px] text-gray-400 mt-1">Data _____ / _____ / _________</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              RODAPÉ
          ════════════════════════════════════════════════════════════════ */}
          <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-3 h-3 text-gray-300" />
              <p className="text-[9px] text-gray-400">
                Gráfica Ponto Digital · OS #{o.orderNumber} · Gerada em{" "}
                {new Date().toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-400">
                Acompanhe em: <span className="font-semibold text-orange-600">{window.location.origin}/acompanhar</span>
              </p>
              {/* Mini QR Code no rodapé */}
              <QRCodeSVG
                value={trackingUrl}
                size={28}
                bgColor="#f9fafb"
                fgColor="#374151"
                level="L"
                includeMargin={false}
                className="rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Estilos globais de impressão ──────────────────────────────────── */}
      <style>{`
        /* ── A4 ─────────────────────────────────────────────────────────── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          .os-a4 > div {
            width: 100% !important;
            box-shadow: none !important;
          }
        }

        /* ── Térmica 80mm (preview na tela) ─────────────────────────────── */
        .os-thermal > div {
          font-size: 10px;
          line-height: 1.3;
        }

        /* ── Térmica 80mm (impressão) ────────────────────────────────────── */
        @media print {
          .os-thermal {
            background: white !important;
          }
          .os-thermal > div {
            width: 80mm !important;
            font-size: 9px !important;
          }
        }
      `}</style>
    </>
  );
}
