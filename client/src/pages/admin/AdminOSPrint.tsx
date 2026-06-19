import { useParams, useLocation } from "wouter";
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer, ArrowLeft, Loader2, AlertCircle, FileText,
  Phone, MapPin, Package, DollarSign,
  Calendar, Truck, Image as ImageIcon, Download,
  FileDown, Info, ClipboardList,
  User, Settings, CheckSquare,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type PrintMode = "a4" | "thermal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d
    ? new Date(d).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
  } catch {
    return "arquivo";
  }
}

/** Parseia variationSnapshot ou selectedAttributes e retorna array [{name, value}] */
function parseSpecifications(item: any): Array<{ name: string; value: string }> {
  const raw = item.variationSnapshot || item.selectedAttributes;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((p: any) => ({ name: String(p.name ?? ""), value: String(p.value ?? "") }));
    }
    if (typeof parsed === "object" && parsed !== null) {
      return Object.entries(parsed).map(([k, v]) => ({ name: k, value: String(v) }));
    }
  } catch {
    // fallback: split por " | "
    return raw.split(" | ").map((attr: string) => {
      const idx = attr.indexOf(": ");
      if (idx > -1) return { name: attr.slice(0, idx), value: attr.slice(idx + 2) };
      return { name: attr, value: "" };
    });
  }
  return [];
}

/** Formata medidas do item */
function formatMedidas(item: any): string {
  const w = item.customWidth;
  const h = item.customHeight;
  if (w && h) return `${w}x${h}`;
  if (w) return `${w}`;
  return "";
}

// ─── Ícones SVG inline para o Controle de Produção ────────────────────────────
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconCircleCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
  </svg>
);
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconPrinter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="14" width="12" height="8" />
  </svg>
);
const IconTruck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);
const IconPackage = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);
const IconCheckGreen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Componente Principal ─────────────────────────────────────────────────────
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

  const trackingUrl = `${window.location.origin}/acompanhar`;
  const handlePrint = useCallback(() => window.print(), []);

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
        <Button onClick={() => setLocation("/admin/os")}>← Voltar</Button>
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

  const subtotal = items.reduce(
    (acc: number, item: any) =>
      acc + parseFloat(item.priceAtOrder?.toString() ?? "0") * item.quantity,
    0
  );
  const deliveryPrice = parseFloat(o.deliveryPrice?.toString() ?? "0");
  const discount = parseFloat(o.discountAmount?.toString() ?? "0");
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
    o.paymentMethod === "cartao" || o.paymentMethod === "cartao_credito" ? "Cartão de Crédito" :
    o.paymentMethod === "dinheiro" ? "Dinheiro" :
    o.paymentMethod === "boleto" ? "Boleto" :
    o.paymentMethod === "pagar_na_retirada" ? "Pagamento na Retirada" :
    o.paymentMethod || "—";

  const freteLabel = isStorePickup
    ? "Retirada na Loja"
    : (o.shippingLabel || o.deliveryMethod || "—");

  // ─── Estilos base para o documento ─────────────────────────────────────────
  const docStyle: React.CSSProperties = {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "10px",
    color: "#1f2937",
    backgroundColor: "#ffffff",
    width: printMode === "thermal" ? "80mm" : "210mm",
    margin: "0 auto",
    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  };

  const borderColor = "#d1d5db";
  const orange = "#f97316";
  const darkHeader = "#1f2937";

  return (
    <>
      {/* ════ BARRA DE AÇÕES (não imprime) ════════════════════════════════ */}
      <div
        className="no-print"
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/os")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> OS
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/pedidos/${orderId}`)}>
            Ver Pedido
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#f3f4f6", borderRadius: "8px", padding: "4px", marginLeft: "8px" }}>
            {(["a4", "thermal"] as PrintMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setPrintMode(m)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: printMode === m ? "#fff" : "transparent",
                  color: printMode === m ? "#111827" : "#6b7280",
                  boxShadow: printMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {m === "a4" ? "A4" : "Térmica 80mm"}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>OS #{o.orderNumber}</span>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <FileDown className="w-4 h-4 mr-1" /> Exportar PDF
          </Button>
          <Button
            onClick={handlePrint}
            size="sm"
            style={{ backgroundColor: orange, color: "#fff" }}
          >
            <Printer className="w-4 h-4 mr-1" /> Imprimir
          </Button>
        </div>
      </div>

      {/* ════ ÁREA DE IMPRESSÃO ════════════════════════════════════════════ */}
      <div
        style={{
          backgroundColor: "#e5e7eb",
          minHeight: "100vh",
          padding: "24px 0",
        }}
        className={`print-wrapper ${printMode === "thermal" ? "os-thermal" : "os-a4"}`}
      >
        <div id="os-document" style={docStyle}>

          {/* ══ CABEÇALHO: Logo/Empresa (esq) | ORDEM DE SERVIÇO (centro) | QR Code (dir) ══ */}
          <div style={{ display: "flex", borderBottom: `2px solid ${borderColor}` }}>

            {/* Coluna esquerda: Logo + dados da empresa */}
            <div style={{ width: "200px", flexShrink: 0, padding: "12px 14px", borderRight: `1px solid ${borderColor}` }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  width: "38px", height: "38px", backgroundColor: orange,
                  borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <FileText style={{ width: "20px", height: "20px", color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 900, color: "#111827", lineHeight: 1.1 }}>Gráfica</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280" }}>Ponto Digital</div>
                </div>
              </div>
              {/* Contatos */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: "#374151" }}>
                  <Phone style={{ width: "10px", height: "10px", color: orange, flexShrink: 0 }} />
                  (22) 99945-9596
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "9px", color: "#374151" }}>
                  <svg style={{ width: "10px", height: "10px", color: orange, flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  contato@graficapontodigital.com.br
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "5px", fontSize: "9px", color: "#374151" }}>
                  <MapPin style={{ width: "10px", height: "10px", color: orange, flexShrink: 0, marginTop: "1px" }} />
                  <span>Rua das Impressões, 123<br />Campos dos Goytacazes - RJ</span>
                </div>
              </div>
            </div>

            {/* Coluna central: ORDEM DE SERVIÇO + número + data */}
            <div style={{ flex: 1, padding: "12px 16px", borderRight: `1px solid ${borderColor}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{
                  width: "36px", height: "36px", backgroundColor: orange,
                  borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <FileText style={{ width: "18px", height: "18px", color: "#fff" }} />
                </div>
                <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#111827", margin: 0, letterSpacing: "0.5px" }}>
                  ORDEM DE SERVIÇO
                </h1>
              </div>
              {/* Número do pedido em destaque laranja */}
              <div style={{
                display: "inline-flex", alignItems: "center",
                border: `2px solid ${orange}`, borderRadius: "6px",
                padding: "4px 12px", marginBottom: "6px", alignSelf: "flex-start",
              }}>
                <span style={{ fontSize: "12px", fontWeight: 900, color: orange, letterSpacing: "0.5px" }}>
                  {o.orderNumber}
                </span>
              </div>
              {/* Emissão */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar style={{ width: "11px", height: "11px", color: "#6b7280" }} />
                <span style={{ fontSize: "9px", color: "#6b7280" }}>
                  EMISSÃO {fmtDate(o.createdAt)}
                </span>
              </div>
            </div>

            {/* Coluna direita: QR Code + Rastreamento */}
            <div style={{ width: "130px", flexShrink: 0, padding: "12px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              <div style={{ border: `2px solid ${borderColor}`, borderRadius: "6px", padding: "4px" }}>
                <QRCodeSVG
                  value={trackingUrl}
                  size={64}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "8px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
                  RASTREAMENTO
                </div>
                <div style={{ fontSize: "8px", color: "#374151", lineHeight: 1.4 }}>
                  Escaneie o QR Code<br />para acompanhar<br />este pedido
                </div>
              </div>
            </div>
          </div>

          {/* ══ DADOS DO CLIENTE ══════════════════════════════════════════════ */}
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${borderColor}`, backgroundColor: "#fafafa" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <svg style={{ width: "11px", height: "11px", color: orange }} viewBox="0 0 24 24" fill="none" stroke={orange} strokeWidth="2">
                <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
              <span style={{ fontSize: "8px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                DADOS DO CLIENTE
              </span>
            </div>
            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>{clientName}</div>
                {clientPhone && (
                  <div style={{ fontSize: "10px", color: "#374151", marginTop: "2px" }}>
                    <Phone style={{ width: "10px", height: "10px", display: "inline", marginRight: "4px", color: orange }} />
                    {clientPhone}
                  </div>
                )}
                {clientEmail && (
                  <div style={{ fontSize: "10px", color: "#374151", marginTop: "2px" }}>{clientEmail}</div>
                )}
              </div>
              {!isStorePickup && o.deliveryStreet && (
                <div style={{ fontSize: "10px", color: "#374151", lineHeight: 1.5 }}>
                  <MapPin style={{ width: "10px", height: "10px", display: "inline", marginRight: "4px", color: orange }} />
                  {o.deliveryStreet}, {o.deliveryNumber}
                  {o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}
                  {o.deliveryNeighborhood ? ` · ${o.deliveryNeighborhood}` : ""}
                  {o.deliveryCity ? ` · ${o.deliveryCity} - ${o.deliveryState}` : ""}
                  {o.deliveryZipCode ? ` · CEP: ${o.deliveryZipCode}` : ""}
                </div>
              )}
            </div>
          </div>

          {/* ══ NÚMERO DO PEDIDO (bloco secundário) ══════════════════════════ */}
          <div style={{
            padding: "8px 14px", borderBottom: `2px solid ${borderColor}`,
            backgroundColor: "#fff8f3",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: "8px", fontWeight: 700, color: orange, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                NÚMERO DO PEDIDO
              </div>
              <div style={{ fontSize: "14px", fontWeight: 900, color: orange }}>{o.orderNumber}</div>
              <div style={{ fontSize: "9px", color: "#6b7280" }}>Emitida em: {fmtDate(o.createdAt)}</div>
            </div>
            {/* Código de barras decorativo */}
            <div style={{ display: "flex", gap: "1px", height: "28px", alignItems: "flex-end" }}>
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} style={{
                  width: i % 3 === 0 ? "2px" : "1px",
                  height: i % 5 === 0 ? "28px" : i % 3 === 0 ? "20px" : "14px",
                  backgroundColor: "#374151",
                }} />
              ))}
            </div>
          </div>

          {/* ══ TABELA DE PRODUTOS / SERVIÇOS ════════════════════════════════ */}
          <div style={{ borderBottom: `2px solid ${borderColor}` }}>
            {/* Título da seção */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "7px 14px", backgroundColor: "#f9fafb", borderBottom: `1px solid ${borderColor}`,
            }}>
              <Package style={{ width: "13px", height: "13px", color: orange }} />
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                PRODUTOS / SERVIÇOS
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: darkHeader, color: "#ffffff" }}>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "28px" }}>
                    ITEM
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "100px" }}>
                    ARQUIVO DO CLIENTE
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "120px" }}>
                    PRODUTO / SERVIÇO
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "left", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ESPECIFICAÇÕES
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "center", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "32px" }}>
                    QTD
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "right", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "60px" }}>
                    UNIT.
                  </th>
                  <th style={{ padding: "6px 8px", textAlign: "right", fontSize: "8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "68px" }}>
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => {
                  const itemFiles = filesByProduct[item.productName] || files.filter((_: any, fi: number) => fi === i) || [];
                  const firstFile = itemFiles[0];
                  const unitPrice = parseFloat(item.priceAtOrder?.toString() ?? "0");
                  const lineTotal = unitPrice * item.quantity;
                  const specs = parseSpecifications(item);
                  const medidas = formatMedidas(item);
                  const artFileName = firstFile ? fileNameFromUrl(firstFile.artFileUrl) : null;

                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: `1px solid ${borderColor}`,
                        backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa",
                        pageBreakInside: "avoid",
                      }}
                    >
                      {/* Nº */}
                      <td style={{ padding: "6px 8px", fontSize: "10px", fontWeight: 700, color: "#374151", verticalAlign: "middle", textAlign: "center" }}>
                        {i + 1}
                      </td>

                      {/* Arquivo do cliente */}
                      <td style={{ padding: "6px 8px", verticalAlign: "middle", textAlign: "center" }}>
                        {firstFile ? (
                          <div style={{
                            border: `1px solid ${borderColor}`, borderRadius: "5px", overflow: "hidden",
                            width: "84px", backgroundColor: "#f9fafb", margin: "0 auto",
                          }}>
                            {isImageUrl(firstFile.artFileUrl) ? (
                              <img
                                src={firstFile.artFileUrl}
                                alt="Arte"
                                style={{ width: "84px", height: "52px", objectFit: "contain", display: "block", padding: "2px" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : isPdfUrl(firstFile.artFileUrl) ? (
                              <div style={{ width: "84px", height: "52px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#fef2f2" }}>
                                <FileText style={{ width: "18px", height: "18px", color: "#f87171" }} />
                                <span style={{ fontSize: "7px", color: "#dc2626", fontWeight: 700 }}>PDF</span>
                              </div>
                            ) : (
                              <div style={{ width: "84px", height: "52px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}>
                                <Download style={{ width: "18px", height: "18px", color: "#9ca3af" }} />
                                <span style={{ fontSize: "7px", color: "#6b7280" }}>
                                  {fileNameFromUrl(firstFile.artFileUrl).split(".").pop()?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div style={{ padding: "2px 4px", borderTop: `1px solid ${borderColor}`, backgroundColor: "#f3f4f6", textAlign: "center" }}>
                              <span style={{ fontSize: "7px", color: "#6b7280", fontWeight: 600 }}>
                                {isImageUrl(firstFile.artFileUrl) ? "PREVIEW" : "ARQUIVO"}
                              </span>
                              <br />
                              <span style={{ fontSize: "6px", color: "#9ca3af" }}>Arquivo do cliente</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            width: "84px", height: "66px", border: `1px dashed ${borderColor}`, borderRadius: "5px",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            backgroundColor: "#f9fafb", margin: "0 auto",
                          }}>
                            <ImageIcon style={{ width: "16px", height: "16px", color: "#d1d5db" }} />
                            <span style={{ fontSize: "7px", color: "#9ca3af", marginTop: "2px" }}>Sem arquivo</span>
                          </div>
                        )}
                      </td>

                      {/* Produto */}
                      <td style={{ padding: "6px 8px", verticalAlign: "top", paddingTop: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827" }}>{item.productName}</div>
                        {item.notes && (
                          <div style={{ fontSize: "8px", color: "#c2410c", backgroundColor: "#fff7ed", borderRadius: "3px", padding: "1px 4px", marginTop: "2px", display: "inline-block" }}>
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Especificações */}
                      <td style={{ padding: "6px 8px", verticalAlign: "top", paddingTop: "8px" }}>
                        <div style={{ fontSize: "9px", color: "#374151", lineHeight: 1.6 }}>
                          {medidas && (
                            <div>
                              <span style={{ color: "#6b7280" }}>Medidas:</span> <strong>{medidas}</strong>
                            </div>
                          )}
                          {specs.map((s, si) => (
                            <div key={si}>
                              <span style={{ color: "#6b7280" }}>{s.name}:</span> <strong>{s.value}</strong>
                            </div>
                          ))}
                          {artFileName && (
                            <div style={{ marginTop: "2px" }}>
                              <span style={{ color: "#6b7280" }}>Arte:</span>{" "}
                              <span style={{ fontSize: "8px", color: "#374151", wordBreak: "break-all" }}>{artFileName}</span>
                            </div>
                          )}
                          {!medidas && specs.length === 0 && !artFileName && (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Qtd */}
                      <td style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "middle", fontSize: "11px", fontWeight: 700, color: "#1f2937" }}>
                        {item.quantity}
                      </td>

                      {/* Unit */}
                      <td style={{ padding: "6px 8px", textAlign: "right", verticalAlign: "middle", fontSize: "10px", color: "#374151" }}>
                        {fmt(unitPrice)}
                      </td>

                      {/* Total */}
                      <td style={{ padding: "6px 8px", textAlign: "right", verticalAlign: "middle", fontSize: "10px", fontWeight: 700, color: "#111827" }}>
                        {fmt(lineTotal)}
                      </td>
                    </tr>
                  );
                })}

                {/* Linha TOTAL GERAL */}
                <tr style={{ borderTop: `2px solid ${borderColor}`, backgroundColor: "#f9fafb" }}>
                  <td colSpan={6} style={{ padding: "7px 8px", textAlign: "right", fontSize: "10px", fontWeight: 700, color: "#374151" }}>
                    TOTAL GERAL
                  </td>
                  <td style={{ padding: "7px 8px", textAlign: "right", fontSize: "13px", fontWeight: 900, color: orange }}>
                    {fmt(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ══ ENTREGA + RESUMO FINANCEIRO ═══════════════════════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `2px solid ${borderColor}` }}>
            {/* Entrega */}
            <div style={{ padding: "10px 14px", borderRight: `1px solid ${borderColor}` }}>
              <div style={{ fontSize: "10px", color: "#374151", lineHeight: 1.6 }}>
                <strong>ENTREGA:</strong>{" "}
                {freteLabel}
                {deliveryPrice > 0 ? ` (${fmt(deliveryPrice)})` : ""}
                {o.paymentMethod ? ` | Pagamento: ${paymentLabel}` : ""}
              </div>
              {!isStorePickup && o.deliveryStreet && (
                <div style={{ marginTop: "4px", fontSize: "10px", color: "#374151", lineHeight: 1.6 }}>
                  <MapPin style={{ width: "10px", height: "10px", display: "inline", marginRight: "4px", color: orange }} />
                  <strong>Endereço:</strong> {o.deliveryStreet}, {o.deliveryNumber}
                  {o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}
                  <br />
                  {o.deliveryNeighborhood && `${o.deliveryNeighborhood} · `}
                  {o.deliveryCity} - {o.deliveryState}
                  <br />
                  CEP: {o.deliveryZipCode}
                </div>
              )}
              {o.shippingEstimatedDays && !isStorePickup && (
                <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "2px" }}>
                  Prazo: {o.shippingEstimatedDays} dias úteis
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <DollarSign style={{ width: "12px", height: "12px", color: orange }} />
                <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  RESUMO FINANCEIRO
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#374151", marginBottom: "3px" }}>
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {deliveryPrice > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#374151", marginBottom: "3px" }}>
                  <span>Frete — {freteLabel}</span>
                  <span>{fmt(deliveryPrice)}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#15803d", marginBottom: "3px" }}>
                  <span>Desconto</span>
                  <span>- {fmt(discount)}</span>
                </div>
              )}
              <div style={{
                display: "flex", justifyContent: "space-between",
                borderTop: `2px solid ${borderColor}`, paddingTop: "5px", marginTop: "4px",
                fontSize: "13px", fontWeight: 900, color: "#111827",
              }}>
                <span>TOTAL</span>
                <span style={{ color: orange }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ══ CONTROLE DE PRODUÇÃO ══════════════════════════════════════════ */}
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${borderColor}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <CheckSquare style={{ width: "12px", height: "12px", color: orange }} />
              <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                CONTROLE DE PRODUÇÃO
              </span>
            </div>

            {/* Barra horizontal de status com ícones e checkboxes */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0",
              border: `1px solid ${borderColor}`, borderRadius: "8px", overflow: "hidden",
              backgroundColor: "#f9fafb",
            }}>
              {[
                { icon: <IconX />, label: "Pagamento\nAprovado", active: true, activeColor: "#ef4444" },
                { icon: <IconCircleCheck />, label: "Analisando", active: true, activeColor: orange },
                { icon: <IconSearch />, label: "Com\nProblemas", active: false, activeColor: "#6b7280" },
                { icon: <IconAlertTriangle />, label: "Em Produção", active: false, activeColor: "#6b7280" },
                { icon: <IconPrinter />, label: "Pronto para\nEntrega", active: false, activeColor: "#6b7280" },
                { icon: <IconTruck />, label: "Em Transporte", active: false, activeColor: "#6b7280" },
                { icon: <IconPackage />, label: "Entregue", active: false, activeColor: "#6b7280" },
                { icon: <IconCheckGreen />, label: "Concluído", active: false, activeColor: "#22c55e" },
              ].map((step, idx, arr) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 4px 6px",
                    borderRight: idx < arr.length - 1 ? `1px solid ${borderColor}` : "none",
                    backgroundColor: step.active ? "#fff" : "transparent",
                    gap: "3px",
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: "14px", height: "14px",
                    border: `1.5px solid ${step.active ? step.activeColor : "#d1d5db"}`,
                    borderRadius: "3px",
                    backgroundColor: step.active ? step.activeColor : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {step.active && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  {/* Ícone */}
                  <div style={{ opacity: step.active ? 1 : 0.45 }}>
                    {step.icon}
                  </div>
                  {/* Label */}
                  <div style={{
                    fontSize: "7px", color: step.active ? "#111827" : "#9ca3af",
                    fontWeight: step.active ? 700 : 400,
                    textAlign: "center", lineHeight: 1.3,
                    whiteSpace: "pre-line",
                  }}>
                    {step.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ RECEBIDO POR | PRODUZIDO POR | ENTREGUE POR ══════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${borderColor}`, gap: "0" }}>
            {[
              { label: "RECEBIDO POR", sub: "Conferência de entrada" },
              { label: "PRODUZIDO POR", sub: "Responsável pela arte/produção" },
              { label: "ENTREGUE POR", sub: "Conferência de saída" },
            ].map((field, idx, arr) => (
              <div
                key={field.label}
                style={{
                  padding: "8px 12px",
                  borderRight: idx < arr.length - 1 ? `1px dashed ${borderColor}` : "none",
                  borderTop: `1px dashed ${borderColor}`,
                }}
              >
                <div style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "1px" }}>
                  {field.label}
                </div>
                <div style={{ fontSize: "8px", color: "#9ca3af", marginBottom: "10px" }}>{field.sub}</div>
                <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: "5px" }}>
                  <div style={{ fontSize: "8px", color: "#9ca3af" }}>
                    Assinatura: ________________________
                  </div>
                  <div style={{ fontSize: "8px", color: "#9ca3af", marginTop: "4px" }}>
                    Data: ____/____/________ &nbsp; Hora: ________
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ══ ASSINATURA DO CLIENTE | ASSINATURA DO TÉCNICO ════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid ${borderColor}`, gap: "0" }}>
            {/* Assinatura do Cliente */}
            <div style={{ padding: "10px 14px", borderRight: `1px solid ${borderColor}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <User style={{ width: "11px", height: "11px", color: orange }} />
                <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ASSINATURA DO CLIENTE
                </span>
              </div>
              <div style={{ fontSize: "8px", color: "#9ca3af", marginBottom: "14px", lineHeight: 1.5 }}>
                Confirmo que recebi o serviço conforme solicitado e estou de acordo com as condições.
              </div>
              <div style={{ fontSize: "8px", color: "#9ca3af" }}>
                Nome: ________________________________________________
              </div>
              <div style={{ marginTop: "12px", borderTop: `1px solid #374151`, paddingTop: "4px" }}>
                <div style={{ fontSize: "8px", color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
                  <span>Assinatura</span>
                  <span>Data: ____/____/________</span>
                </div>
              </div>
            </div>

            {/* Assinatura do Técnico */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Settings style={{ width: "11px", height: "11px", color: orange }} />
                <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ASSINATURA DO TÉCNICO / RESPONSÁVEL
                </span>
              </div>
              <div style={{ fontSize: "8px", color: "#9ca3af", marginBottom: "14px", lineHeight: 1.5 }}>
                Confirmo que o serviço foi executado conforme as especificações da ordem de serviço.
              </div>
              <div style={{ fontSize: "8px", color: "#9ca3af" }}>
                Nome: ________________________________________________
              </div>
              <div style={{ marginTop: "12px", borderTop: `1px solid #374151`, paddingTop: "4px" }}>
                <div style={{ fontSize: "8px", color: "#9ca3af", display: "flex", justifyContent: "space-between" }}>
                  <span>Assinatura</span>
                  <span>Data: ____/____/________</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ INFORMAÇÕES IMPORTANTES | NOTAS INTERNAS ════════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `2px solid ${borderColor}` }}>
            {/* Informações Importantes */}
            <div style={{ padding: "10px 14px", borderRight: `1px solid ${borderColor}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                <Info style={{ width: "11px", height: "11px", color: orange }} />
                <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  INFORMAÇÕES IMPORTANTES
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "12px", fontSize: "9px", color: "#374151", lineHeight: 1.7 }}>
                <li>Confira todas as informações antes de iniciar a produção.</li>
                <li>Qualquer alteração após a produção iniciada será cobrada.</li>
                <li>Prazos começam a contar após aprovação da arte.</li>
                <li>Dúvidas? Entre em contato com nosso atendimento.</li>
              </ul>
            </div>

            {/* Notas Internas */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                <ClipboardList style={{ width: "11px", height: "11px", color: orange }} />
                <span style={{ fontSize: "8px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  NOTAS INTERNAS
                </span>
              </div>
              <div style={{ height: "48px", borderBottom: `1px solid ${borderColor}`, marginBottom: "5px" }} />
              <div style={{ height: "1px", backgroundColor: borderColor, marginBottom: "5px" }} />
              <div style={{ height: "1px", backgroundColor: borderColor }} />
            </div>
          </div>

          {/* ══ RODAPÉ ════════════════════════════════════════════════════════ */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "7px 14px", backgroundColor: "#f9fafb",
          }}>
            <div style={{ fontSize: "8px", color: "#6b7280" }}>
              <strong>Gráfica Ponto Digital</strong> · OS #{o.orderNumber} · Gerado em {fmtDate(new Date())}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "8px", fontWeight: 700, color: "#374151" }}>Sistema de Gestão · Ponto Digital ERP</div>
                <div style={{ fontSize: "7px", color: "#9ca3af" }}>Muito mais controle para sua produção</div>
              </div>
              <div style={{
                width: "28px", height: "28px", backgroundColor: orange,
                borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "8px", fontWeight: 900, color: "#fff" }}>PD</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ════ CSS DE IMPRESSÃO ════════════════════════════════════════════════ */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
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
