import { useParams, useLocation } from "wouter";
import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  Printer, ArrowLeft, Loader2, AlertCircle, FileText,
  Phone, MapPin, Package, DollarSign,
  Calendar, Truck, Image as ImageIcon, Download,
  FileDown, CheckSquare, Info, ClipboardList,
  User, Settings,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type PrintMode = "a4" | "thermal";

// ─── Status ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; hex: string; bg: string }> = {
  pagamento_aprovado: { label: "Pagamento Aprovado",    hex: "#166534", bg: "#dcfce7" },
  pagamento_retirada: { label: "Pagamento na Retirada", hex: "#1e40af", bg: "#dbeafe" },
  analisando:         { label: "ANALISANDO",            hex: "#f97316", bg: "#fff7ed" },
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

// ─── Componente ───────────────────────────────────────────────────────────────
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
    { orderId: orderId!, },
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
  const sc = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.analisando;
  const isStorePickup = o.freteId === "retirada" || (!o.deliveryStreet && !o.deliveryCity);
  const clientName = o.deliveryFullName || o.guestName || `Cliente #${o.clientId}`;
  const clientPhone = o.deliveryPhone || o.guestPhone || "";

  const subtotal = items.reduce(
    (acc: number, item: any) => acc + parseFloat(item.priceAtOrder?.toString() ?? "0") * item.quantity,
    0
  );
  const deliveryPrice = parseFloat(o.deliveryPrice?.toString() ?? "0");
  const discount = parseFloat(o.discountAmount?.toString() ?? "0");
  const total = parseFloat(o.totalPrice?.toString() ?? "0");

  // Mapa de arquivos por item (por productName)
  const filesByProduct: Record<string, any[]> = {};
  files.forEach((f: any) => {
    const key = f.productName || "geral";
    if (!filesByProduct[key]) filesByProduct[key] = [];
    filesByProduct[key].push(f);
  });

  return (
    <>
      {/* ════ BARRA DE AÇÕES (não imprime) ════════════════════════════════ */}
      <div className="no-print bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/os")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> OS
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setLocation(`/admin/pedidos/${orderId}`)}>
            Ver Pedido
          </Button>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-2">
            {(["a4", "thermal"] as PrintMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setPrintMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  printMode === m ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "a4" ? "A4" : "Térmica 80mm"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:block">OS #{o.orderNumber}</span>
          <Button variant="outline" size="sm" onClick={handlePrint} className="border-gray-300 text-gray-700">
            <FileDown className="w-4 h-4 mr-1" /> Exportar PDF
          </Button>
          <Button onClick={handlePrint} size="sm" style={{ backgroundColor: "#f97316" }} className="text-white hover:opacity-90">
            <Printer className="w-4 h-4 mr-1" /> Imprimir
          </Button>
        </div>
      </div>

      {/* ════ ÁREA DE IMPRESSÃO ════════════════════════════════════════════ */}
      <div className={`bg-gray-200 min-h-screen py-6 print-wrapper ${printMode === "thermal" ? "os-thermal" : "os-a4"}`}>
        <div
          id="os-document"
          className="mx-auto bg-white shadow-xl os-doc"
          style={{
            width: printMode === "thermal" ? "80mm" : "210mm",
            minHeight: printMode === "a4" ? "297mm" : undefined,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "11px",
            color: "#1f2937",
          }}
        >

          {/* ══ 1. CABEÇALHO PRINCIPAL ══════════════════════════════════════ */}
          <div style={{ display: "flex", borderBottom: "2px solid #e5e7eb" }}>
            {/* Lado esquerdo: título */}
            <div style={{ flex: 1, padding: "16px 20px", borderRight: "2px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{
                  width: "40px", height: "40px", backgroundColor: "#f97316",
                  borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <FileText style={{ width: "20px", height: "20px", color: "#fff" }} />
                </div>
                <div>
                  <h1 style={{ fontSize: "20px", fontWeight: 900, color: "#111827", margin: 0, letterSpacing: "0.5px" }}>
                    ORDEM DE SERVIÇO
                  </h1>
                </div>
              </div>
              <div style={{
                display: "inline-block", backgroundColor: "#f97316", color: "#fff",
                borderRadius: "6px", padding: "3px 10px", fontSize: "11px", fontWeight: 700,
              }}>
                OS: {o.orderNumber}
              </div>
            </div>

            {/* Lado direito: logo + contato */}
            <div style={{ width: "260px", padding: "16px 20px" }}>
              {/* Logo */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{
                  width: "36px", height: "36px", backgroundColor: "#f97316",
                  borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <FileText style={{ width: "18px", height: "18px", color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#111827", lineHeight: 1 }}>Gráfica</div>
                  <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Ponto Digital</div>
                </div>
              </div>
              {/* Contato */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#374151" }}>
                  <Phone style={{ width: "11px", height: "11px", color: "#f97316", flexShrink: 0 }} />
                  (22) 99945-9596
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#374151" }}>
                  <svg style={{ width: "11px", height: "11px", color: "#f97316", flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  contato@graficapontodigital.com.br
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "10px", color: "#374151" }}>
                  <MapPin style={{ width: "11px", height: "11px", color: "#f97316", flexShrink: 0, marginTop: "1px" }} />
                  <span>Rua das Impressões, 123<br />Campos dos Goytacazes - RJ</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ 2. FAIXA DE METADADOS (Emissão | Entrega | Status) ══════════ */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "2px solid #e5e7eb", backgroundColor: "#fafafa",
          }}>
            {/* Emissão */}
            <div style={{ padding: "10px 16px", borderRight: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar style={{ width: "20px", height: "20px", color: "#9ca3af", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  EMISSÃO
                </div>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#111827" }}>{fmtDate(o.createdAt)}</div>
              </div>
            </div>
            {/* Entrega */}
            <div style={{ padding: "10px 16px", borderRight: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: "8px" }}>
              <Truck style={{ width: "20px", height: "20px", color: "#9ca3af", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ENTREGA / RETIRADA
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827" }}>
                  {isStorePickup ? "Retirada na Loja" : (o.shippingLabel ?? o.deliveryMethod ?? "A definir")}
                </div>
                {o.shippingEstimatedDays && !isStorePickup && (
                  <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "2px" }}>
                    Prazo: {o.shippingEstimatedDays} dias úteis
                  </div>
                )}
              </div>
            </div>
            {/* Status */}
            <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${sc.hex}`,
                flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  STATUS
                </div>
                <div style={{ fontSize: "12px", fontWeight: 900, color: sc.hex }}>{sc.label}</div>
              </div>
            </div>
          </div>

          {/* ══ 3. DADOS DO CLIENTE | NÚMERO DO PEDIDO | RASTREAMENTO ═══════ */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "2px solid #e5e7eb",
          }}>
            {/* Dados do Cliente */}
            <div style={{ padding: "12px 16px", borderRight: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <svg style={{ width: "13px", height: "13px", color: "#f97316" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  DADOS DO CLIENTE
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>{clientName}</div>
              {clientPhone && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#374151" }}>
                  <Phone style={{ width: "11px", height: "11px", color: "#9ca3af" }} />
                  {clientPhone}
                </div>
              )}
              {(o.guestEmail || o.clientEmail) && (
                <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
                  {o.guestEmail || o.clientEmail}
                </div>
              )}
            </div>

            {/* Número do Pedido + Código de Barras */}
            <div style={{ padding: "12px 16px", borderRight: "1px solid #e5e7eb", textAlign: "center" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#f97316", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                NÚMERO DO PEDIDO
              </div>
              <div style={{
                border: "2px solid #f97316", borderRadius: "6px", padding: "6px 10px",
                fontSize: "12px", fontWeight: 900, color: "#f97316", letterSpacing: "0.5px", marginBottom: "6px",
              }}>
                {o.orderNumber}
              </div>
              {/* Código de barras simulado com linhas */}
              <div style={{ display: "flex", justifyContent: "center", gap: "1px", marginBottom: "4px", height: "24px", alignItems: "flex-end" }}>
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i % 3 === 0 ? "2px" : "1px",
                      height: i % 5 === 0 ? "24px" : i % 3 === 0 ? "18px" : "14px",
                      backgroundColor: "#111827",
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: "9px", color: "#6b7280" }}>Emitida em: {fmtDate(o.createdAt)}</div>
            </div>

            {/* QR Code / Rastreamento */}
            <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ border: "2px solid #e5e7eb", borderRadius: "8px", padding: "4px", flexShrink: 0 }}>
                <QRCodeSVG
                  value={trackingUrl}
                  size={64}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                  RASTREAMENTO
                </div>
                <div style={{ fontSize: "10px", color: "#374151", lineHeight: 1.4 }}>
                  Escaneie o QR Code<br />para acompanhar<br />este pedido
                </div>
              </div>
            </div>
          </div>

          {/* ══ 4. OBSERVAÇÕES ══════════════════════════════════════════════ */}
          {(o.notes || o.paymentMethod) && (
            <div style={{
              margin: "12px 16px",
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "8px",
              padding: "10px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <Calendar style={{ width: "13px", height: "13px", color: "#f97316" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  OBSERVAÇÕES
                </span>
              </div>
              {o.paymentMethod && (
                <div style={{ fontSize: "11px", color: "#78350f" }}>
                  <strong>Pagamento:</strong> {
                    o.paymentMethod === "pix" ? "PIX" :
                    o.paymentMethod === "cartao" ? "Cartão de Crédito" :
                    o.paymentMethod === "cartao_credito" ? "Cartão de Crédito" :
                    o.paymentMethod === "dinheiro" ? "Dinheiro" :
                    o.paymentMethod === "boleto" ? "Boleto" :
                    o.paymentMethod === "pagar_na_retirada" ? "Pagamento na Retirada da Loja" :
                    o.paymentMethod
                  }
                </div>
              )}
              {o.notes && (
                <div style={{ fontSize: "11px", color: "#78350f", marginTop: o.paymentMethod ? "6px" : "0" }}>
                  <strong>Observações:</strong> {o.notes}
                </div>
              )}
            </div>
          )}

          {/* ══ 5. TABELA DE PRODUTOS ═══════════════════════════════════════ */}
          <div style={{ margin: "0 0 0 0", borderTop: "2px solid #e5e7eb" }}>
            {/* Título da seção */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb",
            }}>
              <Package style={{ width: "14px", height: "14px", color: "#f97316" }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                PRODUTOS / SERVIÇOS
              </span>
            </div>

            {/* Cabeçalho da tabela */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
                  <th style={{ padding: "7px 10px", textAlign: "left", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "32px" }}>ITEM</th>
                  <th style={{ padding: "7px 10px", textAlign: "left", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "110px" }}>ARQUIVO DO CLIENTE</th>
                  <th style={{ padding: "7px 10px", textAlign: "left", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>PRODUTO / SERVIÇO</th>
                  <th style={{ padding: "7px 10px", textAlign: "left", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "120px" }}>ESPECIFICAÇÕES</th>
                  <th style={{ padding: "7px 10px", textAlign: "center", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "36px" }}>QTD</th>
                  <th style={{ padding: "7px 10px", textAlign: "right", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "64px" }}>UNIT.</th>
                  <th style={{ padding: "7px 10px", textAlign: "right", fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", width: "72px" }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, i: number) => {
                  // Arquivos deste item
                  const itemFiles = filesByProduct[item.productName] || files.filter((_: any, fi: number) => fi === i) || [];
                  const firstFile = itemFiles[0];
                  const unitPrice = parseFloat(item.priceAtOrder?.toString() ?? "0");
                  const lineTotal = unitPrice * item.quantity;

                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        backgroundColor: i % 2 === 0 ? "#ffffff" : "#fafafa",
                      }}
                    >
                      {/* Nº */}
                      <td style={{ padding: "8px 10px", fontSize: "11px", fontWeight: 700, color: "#374151", verticalAlign: "middle", textAlign: "center" }}>
                        {i + 1}
                      </td>

                      {/* Arquivo do cliente */}
                      <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                        {firstFile ? (
                          <div style={{
                            border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden",
                            width: "90px", backgroundColor: "#f9fafb",
                          }}>
                            {isImageUrl(firstFile.artFileUrl) ? (
                              <img
                                src={firstFile.artFileUrl}
                                alt="Arte"
                                style={{ width: "90px", height: "56px", objectFit: "contain", display: "block", padding: "2px" }}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : isPdfUrl(firstFile.artFileUrl) ? (
                              <div style={{ width: "90px", height: "56px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#fef2f2" }}>
                                <FileText style={{ width: "20px", height: "20px", color: "#f87171" }} />
                                <span style={{ fontSize: "8px", color: "#dc2626", fontWeight: 700 }}>PDF</span>
                              </div>
                            ) : (
                              <div style={{ width: "90px", height: "56px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}>
                                <Download style={{ width: "20px", height: "20px", color: "#9ca3af" }} />
                                <span style={{ fontSize: "8px", color: "#6b7280" }}>
                                  {fileNameFromUrl(firstFile.artFileUrl).split(".").pop()?.toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div style={{ padding: "2px 4px", borderTop: "1px solid #e5e7eb", backgroundColor: "#f3f4f6", textAlign: "center" }}>
                              <span style={{ fontSize: "8px", color: "#6b7280", fontWeight: 600 }}>
                                {isImageUrl(firstFile.artFileUrl) ? "PREVIEW" : "ARQUIVO"}
                              </span>
                              <br />
                              <span style={{ fontSize: "7px", color: "#9ca3af" }}>Arquivo do cliente</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            width: "90px", height: "72px", border: "1px dashed #d1d5db", borderRadius: "6px",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            backgroundColor: "#f9fafb",
                          }}>
                            <ImageIcon style={{ width: "18px", height: "18px", color: "#d1d5db" }} />
                            <span style={{ fontSize: "8px", color: "#9ca3af", marginTop: "2px" }}>Sem arquivo</span>
                          </div>
                        )}
                      </td>

                      {/* Produto */}
                      <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#111827" }}>{item.productName}</div>
                        {item.notes && (
                          <div style={{ fontSize: "9px", color: "#c2410c", backgroundColor: "#fff7ed", borderRadius: "4px", padding: "1px 4px", marginTop: "2px", display: "inline-block" }}>
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Especificações */}
                      <td style={{ padding: "8px 10px", verticalAlign: "middle" }}>
                        <div style={{ fontSize: "10px", color: "#374151" }}>
                          {item.selectedAttributes || "-"}
                        </div>
                      </td>

                      {/* Qtd */}
                      <td style={{ padding: "8px 10px", textAlign: "center", verticalAlign: "middle", fontSize: "11px", fontWeight: 700, color: "#1f2937" }}>
                        {item.quantity}
                      </td>

                      {/* Unit */}
                      <td style={{ padding: "8px 10px", textAlign: "right", verticalAlign: "middle", fontSize: "11px", color: "#374151" }}>
                        {fmt(unitPrice)}
                      </td>

                      {/* Total */}
                      <td style={{ padding: "8px 10px", textAlign: "right", verticalAlign: "middle", fontSize: "11px", fontWeight: 700, color: "#111827" }}>
                        {fmt(lineTotal)}
                      </td>
                    </tr>
                  );
                })}

                {/* Linha de TOTAL GERAL */}
                <tr style={{ borderTop: "2px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                  <td colSpan={6} style={{ padding: "8px 10px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#374151" }}>
                    TOTAL GERAL
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontSize: "13px", fontWeight: 900, color: "#f97316" }}>
                    {fmt(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ══ 6. ENTREGA/RETIRADA + RESUMO FINANCEIRO ═════════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2px solid #e5e7eb" }}>
            {/* Entrega */}
            <div style={{ padding: "12px 16px", borderRight: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <MapPin style={{ width: "13px", height: "13px", color: "#f97316" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ENTREGA / RETIRADA
                </span>
              </div>
              {isStorePickup ? (
                <div style={{
                  backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px",
                  padding: "8px 12px",
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#15803d" }}>RETIRADA NA LOJA</div>
                  <div style={{ fontSize: "10px", color: "#16a34a", marginTop: "2px" }}>Cliente retira no estabelecimento</div>
                </div>
              ) : (
                <div style={{ fontSize: "11px", color: "#374151", lineHeight: 1.6 }}>
                  {o.deliveryStreet && <div><strong>Endereço:</strong> {o.deliveryStreet}, {o.deliveryNumber}{o.deliveryComplement ? ` - ${o.deliveryComplement}` : ""}</div>}
                  {o.deliveryNeighborhood && <div>{o.deliveryNeighborhood} · {o.deliveryCity} - {o.deliveryState}</div>}
                  {o.deliveryZipCode && <div style={{ color: "#6b7280" }}>CEP: {o.deliveryZipCode}</div>}
                  {(o.shippingLabel || o.deliveryMethod) && <div style={{ color: "#c2410c", fontWeight: 600, marginTop: "4px" }}><strong>Transportadora:</strong> {o.shippingLabel || o.deliveryMethod}</div>}
                  {o.shippingEstimatedDays && <div style={{ color: "#6b7280", marginTop: "2px" }}><strong>Prazo:</strong> {o.shippingEstimatedDays} dias úteis</div>}
                </div>
              )}
            </div>

            {/* Resumo Financeiro */}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <DollarSign style={{ width: "13px", height: "13px", color: "#f97316" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  RESUMO FINANCEIRO
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#374151", marginBottom: "4px" }}>
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {deliveryPrice > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#374151", marginBottom: "4px" }}>
                  <span>Frete</span>
                  <span>{fmt(deliveryPrice)}</span>
                </div>
              )}
              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#15803d", marginBottom: "4px" }}>
                  <span>Desconto</span>
                  <span>- {fmt(discount)}</span>
                </div>
              )}
              <div style={{
                display: "flex", justifyContent: "space-between",
                borderTop: "2px solid #e5e7eb", paddingTop: "6px", marginTop: "4px",
                fontSize: "14px", fontWeight: 900, color: "#111827",
              }}>
                <span>TOTAL</span>
                <span style={{ color: "#f97316" }}>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* ══ 7. CONTROLE DE PRODUÇÃO ══════════════════════════════════════ */}
          <div style={{ padding: "12px 16px", borderTop: "2px solid #e5e7eb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
              <CheckSquare style={{ width: "13px", height: "13px", color: "#f97316" }} />
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                CONTROLE DE PRODUÇÃO
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {[
                { label: "RECEBIDO POR", sub: "Conferência de entrada" },
                { label: "PRODUZIDO POR", sub: "Responsável pela arte/produção" },
                { label: "ENTREGUE POR", sub: "Conferência de saída" },
              ].map((field) => (
                <div
                  key={field.label}
                  style={{ border: "1px dashed #d1d5db", borderRadius: "6px", padding: "8px 10px" }}
                >
                  <div style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", marginBottom: "2px" }}>
                    {field.label}
                  </div>
                  <div style={{ fontSize: "9px", color: "#9ca3af", marginBottom: "12px" }}>{field.sub}</div>
                  <div style={{ borderTop: "1px solid #d1d5db", paddingTop: "6px" }}>
                    <div style={{ fontSize: "9px", color: "#9ca3af" }}>
                      Assinatura: ________________________
                    </div>
                    <div style={{ fontSize: "9px", color: "#9ca3af", marginTop: "4px" }}>
                      Data: ____/____/________ &nbsp; Hora: ________
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ══ 7b. ASSINATURAS DO CLIENTE E TÉCNICO ════════════════════ */}
          <div style={{ padding: "12px 16px", borderTop: "2px solid #e5e7eb", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Assinatura do Cliente */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <User style={{ width: "13px", height: "13px", color: "#f97316" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ASSINATURA DO CLIENTE
                </span>
              </div>
              <div style={{ fontSize: "9px", color: "#9ca3af", marginBottom: "20px" }}>
                Confirmo que recebi o serviço conforme solicitado e estou de acordo com as condições.
              </div>
              <div style={{ borderTop: "1px solid #374151", paddingTop: "4px", marginTop: "8px" }}>
                <div style={{ fontSize: "9px", color: "#9ca3af" }}>Nome: ________________________________________________</div>
                <div style={{ fontSize: "9px", color: "#9ca3af", marginTop: "16px", borderTop: "1px solid #374151", paddingTop: "4px" }}>
                  Assinatura &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Data: ____/____/________
                </div>
              </div>
            </div>

            {/* Assinatura do Técnico/Responsável */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <Settings style={{ width: "13px", height: "13px", color: "#f97316" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ASSINATURA DO TÉCNICO / RESPONSÁVEL
                </span>
              </div>
              <div style={{ fontSize: "9px", color: "#9ca3af", marginBottom: "20px" }}>
                Confirmo que o serviço foi executado conforme as especificações da ordem de serviço.
              </div>
              <div style={{ borderTop: "1px solid #374151", paddingTop: "4px", marginTop: "8px" }}>
                <div style={{ fontSize: "9px", color: "#9ca3af" }}>Nome: ________________________________________________</div>
                <div style={{ fontSize: "9px", color: "#9ca3af", marginTop: "16px", borderTop: "1px solid #374151", paddingTop: "4px" }}>
                  Assinatura &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Data: ____/____/________
                </div>
              </div>
            </div>
          </div>

          {/* ══ 8. INFORMAÇÕES IMPORTANTES + NOTAS INTERNAS ═════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "2px solid #e5e7eb" }}>
            {/* Informações Importantes */}
            <div style={{ padding: "12px 16px", borderRight: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <Info style={{ width: "13px", height: "13px", color: "#f97316" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  INFORMAÇÕES IMPORTANTES
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "10px", color: "#374151", lineHeight: 1.7 }}>
                <li>Confira todas as informações antes de iniciar a produção.</li>
                <li>Qualquer alteração após a produção iniciada será cobrada.</li>
                <li>Prazos começam a contar após aprovação da arte.</li>
                <li>Dúvidas? Entre em contato com nosso atendimento.</li>
              </ul>
            </div>

            {/* Notas Internas */}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <ClipboardList style={{ width: "13px", height: "13px", color: "#f97316" }} />
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  NOTAS INTERNAS
                </span>
              </div>
              <div style={{ height: "60px", borderBottom: "1px solid #d1d5db", marginBottom: "6px" }} />
              <div style={{ height: "1px", backgroundColor: "#d1d5db", marginBottom: "6px" }} />
              <div style={{ height: "1px", backgroundColor: "#d1d5db" }} />
            </div>
          </div>

          {/* ══ 9. RODAPÉ ════════════════════════════════════════════════════ */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 16px", borderTop: "2px solid #e5e7eb", backgroundColor: "#f9fafb",
          }}>
            <div style={{ fontSize: "9px", color: "#6b7280" }}>
              <strong style={{ color: "#374151" }}>Gráfica Ponto Digital</strong>
              {" · "}OS #{o.orderNumber}
              {" · "}Gerado em {new Date().toLocaleDateString("pt-BR", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", color: "#374151", fontWeight: 600 }}>Sistema de Gestão · Ponto Digital ERP</div>
                <div style={{ fontSize: "8px", color: "#9ca3af" }}>Muito mais controle para sua produção</div>
              </div>
              <div style={{
                width: "28px", height: "28px", backgroundColor: "#f97316",
                borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: "8px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>PD<br/>ERP</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ════ ESTILOS DE IMPRESSÃO ═════════════════════════════════════════ */}
      <style>{`
        @media print {
          /* Oculta cabeçalho do site, barra de ações e qualquer elemento no-print */
          .no-print,
          header.no-print,
          header,
          nav {
            display: none !important;
          }

          /* Remove margens e padding do body/html */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Remove fundo cinza do wrapper */
          .print-wrapper {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            min-height: unset !important;
          }

          /* Documento ocupa toda a largura da folha A4 */
          .os-doc {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            margin: 0 !important;
            transform-origin: top left;
          }

          /* Página A4 com margem pequena para caber tudo */
          @page {
            size: A4 portrait;
            margin: 6mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }

        /* Modo térmica na tela */
        .os-thermal .os-doc {
          font-size: 9px !important;
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
