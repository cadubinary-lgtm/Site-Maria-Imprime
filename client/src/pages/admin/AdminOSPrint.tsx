import { useParams, useLocation } from "wouter";
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { getCompanyAddressLine, getCompanyLocationLine, useCompanySettings } from "@/hooks/useCompanySettings";
import { QRCodeSVG } from "qrcode.react";
import { createAdminDetailLocation, getAdminMenuParentTarget } from "@/lib/adminNavigation";
import { formatProductionDeadlineSurcharge } from "@/lib/production-deadline-pricing";
import { toast } from "sonner";
import {
  Printer, ArrowLeft, Loader2, AlertCircle, FileText,
  Phone, MapPin, Package, DollarSign,
  Calendar, Image as ImageIcon, Download,
  FileDown, Info, ClipboardList, User, Settings, CheckSquare,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d
    ? new Date(d).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "-";

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
  } catch { return "arquivo"; }
}

/** Parseia variationSnapshot ou selectedAttributes → [{name, value}] */
function parseSpecifications(item: any): Array<{ name: string; value: string }> {
  const raw = item.variationSnapshot || item.selectedAttributes;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((p: any) => ({
          name: String(p.name ?? "").trim().replace(/:$/, ""),
          value: String(p.value ?? "").trim(),
        }))
        .filter((p) => p.name && p.value);
    }
    if (typeof parsed === "object" && parsed !== null) {
      return Object.entries(parsed)
        .map(([k, v]) => ({ name: k.trim(), value: String(v).trim() }))
        .filter((p) => p.name && p.value);
    }
  } catch {
    return raw.split(" | ").map((attr: string) => {
      const idx = attr.indexOf(": ");
      if (idx > -1) return { name: attr.slice(0, idx).trim(), value: attr.slice(idx + 2).trim() };
      return { name: attr.trim(), value: "" };
    }).filter((p: any) => p.name);
  }
  return [];
}

// ─── Ícones do Controle de Produção (mesmos do acompanhamento, todos cinza claro) ──
const gray = "#d1d5db"; // cinza claro para todos
const green = "#22c55e"; // verde apenas para Concluído

const IconPayment = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconGear = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const IconTruckOut = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="2">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
    <rect x="9" y="11" width="14" height="10" rx="1" />
    <circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
  </svg>
);
const IconTruckSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconPackageSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gray} strokeWidth="2">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconCheckGreen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const PRODUCTION_STEPS = [
  { icon: <IconPayment />, label: "Pagamento\nAprovado" },
  { icon: <IconSearch />, label: "Analisando" },
  { icon: <IconAlertTriangle />, label: "Com\nProblemas" },
  { icon: <IconGear />, label: "Em Produção" },
  { icon: <IconTruckOut />, label: "Pronto p/\nEntrega" },
  { icon: <IconTruckSVG />, label: "Em\nTransporte" },
  { icon: <IconPackageSVG />, label: "Entregue" },
  { icon: <IconCheckGreen />, label: "Concluído" },
];

const orange = "#E6005C"; // Rosa Magenta — cor oficial da marca
const dark = "#1f2937";
const border = "#d1d5db";

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function AdminOSPrint() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { company } = useCompanySettings();
  const orderId = params.id ? parseInt(params.id) : undefined;
  const returnTarget = getAdminMenuParentTarget(`/admin/os/${orderId ?? "0"}`);
  const [printMode, setPrintMode] = useState<"a4" | "thermal">("a4");
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const { data, isLoading, error } = trpc.admin.getOrderWithItems.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );
  const { data: orderFiles = [] } = trpc.checkout.getOrderFiles.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const trackingUrl = `${window.location.origin}/acompanhar`;
  const handlePrint = useCallback(() => window.print(), []);
  const handleExportPdf = useCallback(async () => {
    const documentNode = document.getElementById("os-document");
    if (!documentNode || isExportingPdf) return;

    setIsExportingPdf(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(documentNode, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const margin = 8;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const renderedHeight = (canvas.height * printableWidth) / canvas.width;
      const imageData = canvas.toDataURL("image/png");

      for (let offset = 0; offset < renderedHeight; offset += printableHeight) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(imageData, "PNG", margin, margin - offset, printableWidth, renderedHeight, undefined, "FAST");
      }

      pdf.save(`ordem-de-servico-${orderId ?? "documento"}.pdf`);
      toast.success("PDF da Ordem de Serviço exportado.", { id: "os-pdf-export" });
    } catch (exportError) {
      console.error("Erro ao exportar Ordem de Serviço em PDF:", exportError);
      toast.error("Não foi possível exportar o PDF da Ordem de Serviço.", { id: "os-pdf-export" });
    } finally {
      setIsExportingPdf(false);
    }
  }, [isExportingPdf, orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: orange }} aria-label="Carregando ordem de serviço" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" aria-hidden="true" />
        <p className="text-gray-600">Pedido não encontrado</p>
        <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => setLocation(returnTarget.path)}><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{returnTarget.label}</Button>
      </div>
    );
  }

  const o = data.order as any;
  const items = data.items as any[];
  const files = orderFiles as any[];

  const isStorePickup = o.freteId === "retirada" || (!o.deliveryStreet && !o.deliveryCity);
  const clientName = o.deliveryFullName || o.guestName || `Cliente #${o.clientId}`;
  const clientPhone = o.deliveryPhone || o.guestPhone || "";
  const clientEmail = o.guestEmail || "";
  const salesOwnerName = o.salesOwnerName || o.sellerName || null;
  const salesOwnerLabel = o.salesOwnerType === "admin"
    ? "ADMINISTRADOR RESPONSÁVEL"
    : o.salesOwnerType === "seller" || o.sellerName
      ? "VENDEDOR RESPONSÁVEL"
      : null;

  const subtotal = items.reduce(
    (acc: number, item: any) =>
      acc + parseFloat(item.priceAtOrder?.toString() ?? "0") * item.quantity,
    0
  );
  const deliveryPrice = parseFloat(o.deliveryPrice?.toString() ?? "0") || parseFloat(o.shippingPrice?.toString() ?? "0") || 0;
  const discount = parseFloat(o.discountAmount?.toString() ?? "0") || 0;
  const total = parseFloat(o.totalPrice?.toString() ?? "0");

  // Mapa de arquivos por productName
  const filesByProduct: Record<string, any[]> = {};
  files.forEach((f: any) => {
    const key = f.productName || "geral";
    if (!filesByProduct[key]) filesByProduct[key] = [];
    filesByProduct[key].push(f);
  });

  const paymentLabel =
    o.paymentMethod === "pix" ? "PIX" :
    o.paymentMethod === "cartao" || o.paymentMethod === "cartao_credito" ? "Cartão de débito/crédito" :
    o.paymentMethod === "dinheiro" ? "Dinheiro" :
    o.paymentMethod === "boleto" ? "Boleto" :
    o.paymentMethod === "pagar_na_retirada" ? "Pagamento na Retirada" :
    o.paymentMethod || "";

  const freteLabel = isStorePickup
    ? "Retirada na Loja"
    : (o.shippingLabel || o.deliveryMethod || "");

  const s = (v: string | null | undefined) => v || null;

  return (
    <>
      {/* ════ BARRA DE AÇÕES (não imprime) ════════════════════════════════ */}
      <div className="no-print" style={{
        backgroundColor: "#fff", borderBottom: `1px solid ${border}`,
        padding: "10px 16px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button variant="ghost" size="sm" className="text-pink-700 hover:bg-pink-50 hover:text-pink-800" onClick={() => setLocation(returnTarget.path)}>
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" /> {returnTarget.label}
          </Button>
          <Button variant="ghost" size="sm" className="text-pink-700 hover:bg-pink-50 hover:text-pink-800" onClick={() => setLocation(createAdminDetailLocation(`/admin/pedidos/${orderId}`, returnTarget.path))}>
            Ver Pedido
          </Button>
          <div style={{ display: "flex", gap: "4px", backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "4px", marginLeft: "8px" }}>
            {(["a4", "thermal"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={printMode === m} aria-label={`Formato de impressão ${m === "a4" ? "A4" : "térmica 80 milímetros"}`} onClick={() => setPrintMode(m)} style={{
                padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                border: "none", cursor: "pointer",
                backgroundColor: printMode === m ? "#fff" : "transparent",
                color: printMode === m ? "#111827" : "#6b7280",
                boxShadow: printMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}>
                {m === "a4" ? "A4" : "Térmica 80mm"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>OS #{o.orderNumber}</span>
          <Button variant="outline" size="sm" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={handleExportPdf} disabled={isExportingPdf} aria-busy={isExportingPdf}>
            <Download className="w-4 h-4 mr-1" aria-hidden="true" /> {isExportingPdf ? "Gerando PDF..." : "Exportar PDF"}
          </Button>
          <Button variant="outline" size="sm" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={handlePrint}>
            <FileDown className="w-4 h-4 mr-1" aria-hidden="true" /> Abrir impressão
          </Button>
          <Button onClick={handlePrint} size="sm" style={{ backgroundColor: orange, color: "#fff" }}>
            <Printer className="w-4 h-4 mr-1" aria-hidden="true" /> Imprimir
          </Button>
        </div>
      </div>

      {/* ════ ÁREA DE IMPRESSÃO ════════════════════════════════════════════ */}
      <div style={{ backgroundColor: "#e5e7eb", minHeight: "100vh", padding: "24px 0" }}
        className={`print-wrapper ${printMode === "thermal" ? "os-thermal" : "os-a4"}`}>
        <div id="os-document" style={{
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "10px", color: "#1f2937", backgroundColor: "#ffffff",
          width: printMode === "thermal" ? "80mm" : "210mm",
          margin: "0 auto", boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        }}>

          {/* ══ 1. CABEÇALHO: 3 colunas com divisores verticais ═════════════════════ */}
          <div style={{ display: "flex", borderBottom: `1px solid ${border}` }}>

            {/* COL 1: Logo, CNPJ e contatos da empresa */}
            <div style={{
              width: "210px", flexShrink: 0,
              padding: "12px 14px 12px 14px",
              borderRight: `1px solid ${border}`,
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", marginBottom: "10px" }}>
                {company.printLogoUrl ? (
                  <img src={company.printLogoUrl} alt={`Logotipo ${company.tradeName}`} style={{ width: "108px", height: "50px", objectFit: "contain", objectPosition: "left bottom", flexShrink: 0, marginTop: "4px", marginBottom: "-4px" }} />
                ) : (
                  <div style={{
                    width: "38px", height: "38px", backgroundColor: orange,
                    borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <FileText style={{ width: "19px", height: "19px", color: "#fff" }} />
                  </div>
                )}
                <div style={{ fontSize: "8px", fontWeight: 700, color: "#4b5563", letterSpacing: "0.1px" }}>CNPJ: 34.528.399/0001-08</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: "#374151" }}>
                  <svg style={{ width: "9px", height: "9px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  {company.commercialPhone}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: "#374151" }}>
                  <svg style={{ width: "9px", height: "9px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {company.supportEmail}
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "5px", fontSize: "9px", color: "#374151" }}>
                  <svg style={{ width: "9px", height: "9px", flexShrink: 0, marginTop: "1px" }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span>{getCompanyAddressLine(company)}<br />{getCompanyLocationLine(company)}</span>
                </div>
              </div>
            </div>

            {/* COL 2: Ícone laranja + ORDEM DE SERVIÇO + número em borda + emissão */}
            <div style={{
              flex: 1,
              padding: "12px 18px",
              borderRight: `1px solid ${border}`,
              display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "36px", height: "36px", backgroundColor: orange,
                  borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <FileText style={{ width: "18px", height: "18px", color: "#fff" }} />
                </div>
                <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#111827", margin: 0, letterSpacing: "1.5px" }}>
                  ORDEM DE SERVIÇO
                </h1>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{
                  border: `2px solid ${orange}`, borderRadius: "5px",
                  padding: "3px 12px", display: "inline-flex", alignItems: "center",
                }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: orange }}>{o.orderNumber}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{
                  width: "20px", height: "20px", border: `1.5px solid ${border}`,
                  borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: "#f9fafb", flexShrink: 0,
                }}>
                  <svg style={{ width: "10px", height: "10px" }} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                  <div>
                    <div style={{ fontSize: "7px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>EMISSÃO</div>
                    <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#374151" }}>{fmtDate(o.createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* COL 3: QR Code menor + texto RASTREAMENTO */}
            <div style={{
              width: "150px", flexShrink: 0,
              padding: "10px 12px",
              display: "flex", flexDirection: "row", alignItems: "center", gap: "8px",
            }}>
              <div className="os-qr-code" style={{ flexShrink: 0 }}>
                <QRCodeSVG className="os-qr-code-svg" value={trackingUrl} size={54} bgColor="#ffffff" fgColor="#111827" level="M" includeMargin={false} style={{ display: "block", backgroundColor: "#ffffff" }} />
              </div>
              <div>
                <div style={{ fontSize: "7px", fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>RASTREAMENTO</div>
                <div style={{ fontSize: "7px", color: "#374151", lineHeight: 1.4 }}>
                  Escaneie o QR Code<br />para acompanhar<br />este pedido
                </div>
              </div>
            </div>
          </div>

          {/* ══ RESPONSÁVEL COMERCIAL: faixa exclusiva alinhada ao cabeçalho ══ */}
          {salesOwnerName && salesOwnerLabel && (
            <div style={{ display: "flex", minHeight: "40px", borderBottom: `1px solid ${border}`, backgroundColor: "#fff" }}>
              <div style={{ flex: 1, borderRight: `1px solid ${border}` }} />
              <div style={{ flex: 1, padding: "9px 18px", display: "flex", alignItems: "center", gap: "6px" }}>
                <User style={{ width: "12px", height: "12px", flexShrink: 0, color: orange }} aria-hidden="true" />
                <span style={{ fontSize: "9px", color: "#374151", lineHeight: 1.2 }}>
                  <strong style={{ fontSize: "8px", letterSpacing: "0.55px" }}>{salesOwnerLabel}:</strong> {salesOwnerName}
                </span>
              </div>
              <div style={{ width: "150px", flexShrink: 0, borderLeft: `1px solid ${border}` }} />
            </div>
          )}

          {/* ══ 2. FAIXA: DADOS DO CLIENTE (esq) | NÚMERO DO PEDIDO (dir) ══════════════ */}
          <div style={{ display: "flex", borderBottom: `1px solid ${border}`, backgroundColor: "#fff" }}>

            {/* Esquerda: DADOS DO CLIENTE com dados reais do pedido */}
            <div style={{ flex: 1, padding: "9px 14px", borderRight: `1px solid ${border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                <svg style={{ width: "10px", height: "10px" }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2">
                  <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
                <span style={{ fontSize: "7.5px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  DADOS DO CLIENTE
                </span>
              </div>
              {/* Nome completo do cliente */}
              {clientName && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: "#374151", marginBottom: "2px" }}>
                  <svg style={{ width: "9px", height: "9px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2">
                    <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
                  </svg>
                  {clientName}
                </div>
              )}
              {clientPhone && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: "#374151", marginBottom: "2px" }}>
                  <svg style={{ width: "9px", height: "9px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  {clientPhone}
                </div>
              )}
              {clientEmail && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: "#374151", marginBottom: "2px" }}>
                  <svg style={{ width: "9px", height: "9px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  {clientEmail}
                </div>
              )}
              {!isStorePickup && s(o.deliveryStreet) && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "5px", fontSize: "9px", color: "#374151" }}>
                  <svg style={{ width: "9px", height: "9px", flexShrink: 0, marginTop: "1px" }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <span>
                    {o.deliveryStreet}{o.deliveryNumber ? ` ${o.deliveryNumber}` : ""}
                    {o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}
                    {o.deliveryNeighborhood ? `  ${o.deliveryNeighborhood}` : ""}
                    {o.deliveryCity ? ` · ${o.deliveryCity}` : ""}
                    {o.deliveryState ? ` - ${o.deliveryState}` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Direita: PRAZO DE ENTREGA */}
            {(() => {
              const deadline = o.deliveryDeadline ? Number(o.deliveryDeadline) : null;
              const isUrgent = deadline
                ? new Date(deadline).toDateString() === new Date().toDateString()
                : false;
              return (
                <div style={{ width: "240px", flexShrink: 0, padding: "9px 14px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                    <svg style={{ width: "9px", height: "9px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <span style={{ fontSize: "7.5px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                      PRAZO DE ENTREGA
                    </span>
                  </div>
                  {deadline ? (
                    <>
                      <div style={{ fontSize: "13px", fontWeight: 900, color: "#111827", marginBottom: "1px", letterSpacing: "0.2px" }}>
                        {fmtDate(deadline)}
                      </div>
                      {isUrgent && (
                        <div style={{
                          fontSize: "11px", fontWeight: 900, color: "#dc2626",
                          letterSpacing: "1px", marginTop: "2px",
                        }}>
                          ⚠️ URGENTE
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: "10px", color: "#9ca3af", fontStyle: "italic" }}>
                      Não definido
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* ══ 4. TABELA DE PRODUTOS (cresce livremente) ════════════════════ */}
          <div style={{ borderBottom: `2px solid ${border}` }}>
            {/* Título */}
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "6px 12px", backgroundColor: "#f9fafb", borderBottom: `1px solid ${border}`,
            }}>
              <svg style={{ width: "12px", height: "12px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
              <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                PRODUTOS / SERVIÇOS
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: dark, color: "#fff" }}>
                  <th style={{ padding: "5px 8px", textAlign: "center", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", width: "26px" }}>ITEM</th>
                  <th style={{ padding: "5px 8px", textAlign: "center", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", width: "96px" }}>ARQUIVO DO CLIENTE</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", width: "110px" }}>PRODUTO / SERVIÇO</th>
                  <th style={{ padding: "5px 8px", textAlign: "left", fontSize: "8px", fontWeight: 700, textTransform: "uppercase" }}>ESPECIFICAÇÕES</th>
                  <th style={{ padding: "5px 8px", textAlign: "center", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", width: "30px" }}>QTD</th>
                  <th style={{ padding: "5px 8px", textAlign: "right", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", width: "58px" }}>UNIT.</th>
                  <th style={{ padding: "5px 8px", textAlign: "right", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", width: "64px" }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => {
                  const itemFiles = filesByProduct[item.productName] || files.filter((_: any, fi: number) => fi === i) || [];
                  const firstFile = itemFiles[0] || (item.artFileUrl ? { artFileUrl: item.artFileUrl } : null);
                  const unitPrice = parseFloat(item.priceAtOrder?.toString() ?? "0");
                  const lineTotal = unitPrice * item.quantity;
                  const specs = parseSpecifications(item);
                  const dims = item.customDimensions || "";
                  const artFileName = firstFile ? fileNameFromUrl(firstFile.artFileUrl) : null;
                  const urgencyBreakdown = formatProductionDeadlineSurcharge({
                    rate: item.urgencyRate,
                    multiplier: item.urgencyMultiplier,
                    unit: item.urgencyUnit,
                    surcharge: item.urgencySurcharge,
                    quantity: item.quantity,
                  });

                  return (
                    <tr key={i} style={{
                      borderBottom: `1px solid ${border}`,
                      backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa",
                      pageBreakInside: "avoid",
                    }}>
                      {/* # */}
                      <td style={{ padding: "6px 8px", fontSize: "10px", fontWeight: 700, color: "#374151", verticalAlign: "middle", textAlign: "center" }}>
                        {i + 1}
                      </td>

                      {/* Arquivo do cliente */}
                      <td style={{ padding: "6px 8px", verticalAlign: "middle", textAlign: "center" }}>
                        {firstFile ? (
                          <div style={{ border: `1px solid ${border}`, borderRadius: "4px", overflow: "hidden", width: "80px", backgroundColor: "#f9fafb", margin: "0 auto" }}>
                            {isImageUrl(firstFile.artFileUrl) ? (
                              <img src={firstFile.artFileUrl} alt="Arte"
                                style={{ width: "80px", height: "50px", objectFit: "contain", display: "block", padding: "2px" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : isPdfUrl(firstFile.artFileUrl) ? (
                              <div style={{ width: "80px", height: "50px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#fef2f2" }}>
                                <FileText style={{ width: "16px", height: "16px", color: "#f87171" }} />
                                <span style={{ fontSize: "7px", color: "#dc2626", fontWeight: 700 }}>PDF</span>
                              </div>
                            ) : (
                              <div style={{ width: "80px", height: "50px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}>
                                <Download style={{ width: "16px", height: "16px", color: "#9ca3af" }} />
                                <span style={{ fontSize: "7px", color: "#6b7280" }}>
                                  {fileNameFromUrl(firstFile.artFileUrl).split(".").pop()?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div style={{ padding: "2px 4px", borderTop: `1px solid ${border}`, backgroundColor: "#f3f4f6", textAlign: "center" }}>
                              <span style={{ fontSize: "7px", color: "#6b7280", fontWeight: 600 }}>
                                {isImageUrl(firstFile.artFileUrl) ? "PREVIEW" : "ARQUIVO"}
                              </span>
                              <br />
                              <span style={{ fontSize: "6px", color: "#9ca3af" }}>Arquivo do cliente</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: "80px", height: "62px", border: `1px dashed ${border}`, borderRadius: "4px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", margin: "0 auto" }}>
                            <ImageIcon style={{ width: "14px", height: "14px", color: "#d1d5db" }} />
                            <span style={{ fontSize: "7px", color: "#9ca3af", marginTop: "2px" }}>Sem arquivo</span>
                          </div>
                        )}
                      </td>

                      {/* Produto */}
                      <td style={{ padding: "6px 8px", verticalAlign: "top", paddingTop: "8px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 700, color: "#111827" }}>{item.productName}</div>
                        {item.notes && (
                          <div style={{ fontSize: "8px", color: "#c2410c", backgroundColor: "#fff7ed", borderRadius: "3px", padding: "1px 4px", marginTop: "2px", display: "inline-block" }}>
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Especificações — dados reais do banco */}
                      <td style={{ padding: "6px 8px", verticalAlign: "top", paddingTop: "8px" }}>
                        <div style={{ fontSize: "9px", color: "#374151", lineHeight: 1.65 }}>
                          {/* Medidas */}
                          {dims && (
                            <div>
                              <span style={{ color: "#6b7280", fontSize: "9px" }}>Medidas:</span>{" "}
                              <strong style={{ fontSize: "9px" }}>{dims}</strong>
                            </div>
                          )}
                          {/* Variações (Tipo de Impressão, Material, Gramatura, Acabamento, etc.) */}
                          {specs.length > 0 ? (
                            specs.map((s, si) => (
                              <div key={si}>
                                <span style={{ color: "#6b7280", fontSize: "9px" }}>{s.name}:</span>{" "}
                                <strong style={{ fontSize: "9px" }}>{s.value}</strong>
                              </div>
                            ))
                          ) : (
                            /* Fallback: sem variationSnapshot, mostrar selectedAttributes bruto */
                            item.selectedAttributes ? (
                              <div style={{ fontSize: "9px", color: "#374151" }}>{item.selectedAttributes}</div>
                            ) : (
                              <span style={{ color: "#9ca3af", fontSize: "9px" }}>—</span>
                            )
                          )}
                          {/* Nome do arquivo de arte */}
                          {artFileName && (
                            <div style={{ marginTop: "2px" }}>
                              <span style={{ color: "#6b7280", fontSize: "9px" }}>Arte:</span>{" "}
                              <span style={{ fontSize: "8px", color: "#374151", wordBreak: "break-all" }}>{artFileName}</span>
                            </div>
                          )}
                          {urgencyBreakdown && (
                            <div style={{ marginTop: "2px" }}>
                              <span style={{ color: "#6b7280", fontSize: "9px" }}>Urgência:</span>{" "}
                              <strong style={{ fontSize: "8px", color: "#374151" }}>{urgencyBreakdown}</strong>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Qtd */}
                      <td style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "middle", fontSize: "10px", fontWeight: 700, color: "#1f2937" }}>
                        {item.quantity}
                      </td>

                      {/* Unit */}
                      <td style={{ padding: "6px 8px", textAlign: "right", verticalAlign: "middle", fontSize: "9px", color: "#374151" }}>
                        {fmt(unitPrice)}
                      </td>

                      {/* Total */}
                      <td style={{ padding: "6px 8px", textAlign: "right", verticalAlign: "middle", fontSize: "9px", fontWeight: 700, color: "#111827", display: "none" }}>
                        {fmt(lineTotal)}
                      </td>
                    </tr>
                  );
                })}

                {/* VALOR TOTAL DO PEDIDO removido - agora aparece apenas no Resumo Financeiro */}
              </tbody>
            </table>
          </div>

          {/* ══ 5. ENTREGA + RESUMO FINANCEIRO (base da tabela) ══════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `2px solid ${border}` }}>

            {/* Entrega */}
            <div style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
              <div style={{ fontSize: "9px", color: "#374151", lineHeight: 1.7 }}>

                {/* Tipo de entrega */}
                <div style={{ marginBottom: "4px" }}>
                  <strong style={{ fontSize: "9px", color: "#111827" }}>Tipo de entrega:</strong>{" "}
                  <span>{freteLabel || (isStorePickup ? "Retirar na Loja" : "Não informado")}</span>
                </div>

                {/* Endereço completo — apenas se não for retirada */}
                {!isStorePickup && s(o.deliveryStreet) && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "4px" }}>
                    <svg style={{ width: "9px", height: "9px", flexShrink: 0, marginTop: "1px" }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <div>
                      <div>
                        {o.deliveryStreet}{o.deliveryNumber ? `, ${o.deliveryNumber}` : ""}
                        {o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}
                      </div>
                      <div>
                        {o.deliveryNeighborhood ? `${o.deliveryNeighborhood} · ` : ""}
                        {o.deliveryCity ? `${o.deliveryCity}` : ""}
                        {o.deliveryState ? ` - ${o.deliveryState}` : ""}
                      </div>
                      {o.deliveryZipCode && <div>CEP: {o.deliveryZipCode}</div>}
                    </div>
                  </div>
                )}

                {/* Retirada na loja — sem endereço */}
                {isStorePickup && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#6b7280" }}>
                    <svg style={{ width: "9px", height: "9px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span>Retirar na Loja</span>
                  </div>
                )}

                {o.shippingEstimatedDays > 0 && !isStorePickup && (
                  <div style={{ color: "#6b7280", marginTop: "2px" }}>Prazo: {o.shippingEstimatedDays} dias úteis</div>
                )}
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div style={{ padding: "8px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                <svg style={{ width: "11px", height: "11px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><circle cx="12" cy="12" r="8" /><path d="M12 6v12M9 9h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-6a2 2 0 0 0-2-2v-2a2 2 0 0 0 2-2z" /></svg>
                <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  RESUMO FINANCEIRO
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#374151", marginBottom: "2px" }}>
                <span>Valor Total do Pedido</span><span>{fmt(subtotal)}</span>
              </div>
              {deliveryPrice > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#374151", marginBottom: "2px" }}>
                  <span>Frete{freteLabel ? ` — ${freteLabel}` : ""}</span><span>{fmt(deliveryPrice)}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#15803d", marginBottom: "2px" }}>
                  <span>Desconto</span><span>- {fmt(discount)}</span>
                </div>
              )}
              <div style={{
                display: "flex", justifyContent: "space-between",
                borderTop: `2px solid ${border}`, paddingTop: "4px", marginTop: "4px",
                fontSize: "13px", fontWeight: 900, color: "#111827",
              }}>
                <span>TOTAL</span>
                <span style={{ color: orange }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ══ 6. CONTROLE DE PRODUÇÃO ═══════════════════════════════════════ */}
          <div style={{ padding: "8px 12px", borderBottom: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "7px" }}>
              <svg style={{ width: "11px", height: "11px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><polyline points="9 11 12 14 22 4" /><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
              <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                CONTROLE DE PRODUÇÃO
              </span>
            </div>
            <div style={{
              display: "flex", alignItems: "stretch",
              border: `1px solid ${border}`, borderRadius: "6px", overflow: "hidden",
              backgroundColor: "#f9fafb",
            }}>
              {PRODUCTION_STEPS.map((step, idx) => (
                <div key={idx} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "flex-start", padding: "6px 3px 5px",
                  borderRight: idx < PRODUCTION_STEPS.length - 1 ? `1px solid ${border}` : "none",
                  gap: "3px",
                }}>
                  {/* Checkbox */}
                  <div style={{
                    width: "12px", height: "12px",
                    border: `1.5px solid ${border}`, borderRadius: "2px",
                    backgroundColor: "#fff", flexShrink: 0,
                  }} />
                  {/* Ícone */}
                  <div>{step.icon}</div>
                  {/* Label */}
                  <div style={{
                    fontSize: "6.5px", color: "#9ca3af", fontWeight: 400,
                    textAlign: "center", lineHeight: 1.3, whiteSpace: "pre-line",
                  }}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ 7. RECEBIDO POR | PRODUZIDO POR | ENTREGUE POR ═══════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${border}` }}>
            {[
              { label: "RECEBIDO POR", sub: "Conferência de entrada" },
              { label: "PRODUZIDO POR", sub: "Responsável pela arte/produção" },
              { label: "ENTREGUE POR", sub: "Conferência de saída" },
            ].map((field, idx, arr) => (
              <div key={field.label} style={{
                padding: "7px 10px",
                borderRight: idx < arr.length - 1 ? `1px dashed ${border}` : "none",
              }}>
                <div style={{ fontSize: "7px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "1px" }}>
                  {field.label}
                </div>
                <div style={{ fontSize: "7px", color: "#9ca3af", marginBottom: "4px" }}>{field.sub}</div>
                <div style={{ fontSize: "7px", color: "#9ca3af" }}>Assinatura: ________________________</div>
                <div style={{ fontSize: "7px", color: "#9ca3af", marginTop: "14px" }}>
                  Data: ____/____/________ &nbsp; Hora: ________
                </div>
              </div>
            ))}
          </div>

          {/* ══ 8. ASSINATURA DO CLIENTE | ASSINATURA DO TÉCNICO ════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${border}` }}>
            <div style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                <svg style={{ width: "10px", height: "10px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <span style={{ fontSize: "7px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ASSINATURA DO CLIENTE
                </span>
              </div>
              <div style={{ fontSize: "7px", color: "#9ca3af", marginBottom: "10px", lineHeight: 1.5 }}>
                Confirmo que recebi o serviço conforme solicitado e estou de acordo com as condições.
              </div>
              <div style={{ fontSize: "7px", color: "#9ca3af" }}>Nome: ________________________________________________</div>
              <div style={{ marginTop: "10px" }}>
                <div style={{ fontSize: "7px", color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
                  <span>Assinatura: ________________________________________________</span>
                  <span>Data: ____/____/________</span>
                </div>
                <div style={{ borderTop: `1px solid ${border}`, marginTop: "2px" }} />
              </div>
            </div>
            <div style={{ padding: "8px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                <svg style={{ width: "10px", height: "10px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                <span style={{ fontSize: "7px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ASSINATURA DO TÉCNICO / RESPONSÁVEL
                </span>
              </div>
              <div style={{ fontSize: "7px", color: "#9ca3af", marginBottom: "10px", lineHeight: 1.5 }}>
                Confirmo que o serviço foi executado conforme as especificações da ordem de serviço.
              </div>
              <div style={{ fontSize: "7px", color: "#9ca3af" }}>Nome: ________________________________________________</div>
              <div style={{ marginTop: "10px" }}>
                <div style={{ fontSize: "7px", color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
                  <span>Assinatura: ________________________________________________</span>
                  <span>Data: ____/____/________</span>
                </div>
                <div style={{ borderTop: `1px solid ${border}`, marginTop: "2px" }} />
              </div>
            </div>
          </div>

          {/* ══ 9. INFORMAÇÕES IMPORTANTES | NOTAS INTERNAS ═════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `2px solid ${border}` }}>
            <div style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                <svg style={{ width: "10px", height: "10px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                <span style={{ fontSize: "7px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  INFORMAÇÕES IMPORTANTES
                </span>
              </div>
              <div
                style={{ fontSize: "8px", color: "#374151", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: company.osTerms || "Confira todas as informações antes de iniciar a produção." }}
              />
            </div>
            <div style={{ padding: "8px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
                <svg style={{ width: "10px", height: "10px", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><line x1="7" y1="15" x2="17" y2="15" /><line x1="7" y1="11" x2="17" y2="11" /><line x1="10" y1="7" x2="14" y2="7" /></svg>
                <span style={{ fontSize: "7px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  NOTAS INTERNAS
                </span>
              </div>
              <div style={{ height: "58px", paddingTop: "5px", display: "flex", flexDirection: "column", justifyContent: "space-between" }} aria-label="Área para notas internas manuscritas">
                <div style={{ height: "1px", backgroundColor: border }} />
                <div style={{ height: "1px", backgroundColor: border }} />
                <div style={{ height: "1px", backgroundColor: border }} />
              </div>
            </div>
          </div>

          {/* ══ 10. RODAPÉ ════════════════════════════════════════════════════ */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 12px", backgroundColor: "#f9fafb",
          }}>
            <div style={{ fontSize: "7px", color: "#6b7280" }}>
              <strong>{company.tradeName}</strong> · OS #{o.orderNumber} · Gerado em {fmtDate(new Date())}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "7px", fontWeight: 700, color: "#374151" }}>{company.legalName}</div>
                <div style={{ fontSize: "6px", color: "#9ca3af" }}>CNPJ: {company.cnpj}</div>
              </div>
              <div style={{
                width: "24px", height: "24px", backgroundColor: orange,
                borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "7px", fontWeight: 900, color: "#fff" }}>PD</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ════ CSS DE IMPRESSÃO ════════════════════════════════════════════════ */}
      <style>{`
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        svg {
          overflow: visible !important;
        }
        @media print {
          .no-print { display: none !important; }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-wrapper {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #os-document {
            box-shadow: none !important;
            width: 210mm !important;
            margin: 0 !important;
          }
          svg {
            overflow: visible !important;
            shape-rendering: geometricPrecision !important;
          }
          svg:not(.os-qr-code-svg) path,
          svg:not(.os-qr-code-svg) circle,
          svg:not(.os-qr-code-svg) rect,
          svg:not(.os-qr-code-svg) polyline,
          svg:not(.os-qr-code-svg) line,
          svg:not(.os-qr-code-svg) polygon {
            stroke: inherit !important;
            fill: inherit !important;
          }
          tr { page-break-inside: avoid; }
          .page-break { page-break-before: always; }
          @page {
            size: A4;
            margin: 8mm;
          }
        }
      `}</style>
    </>
  );
}
