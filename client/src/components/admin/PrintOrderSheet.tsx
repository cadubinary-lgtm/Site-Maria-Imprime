import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

// ─── Mapa de status ───────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  pedido_recebido: "Pedido Recebido",
  pagamento_aprovado: "Pagamento Aprovado",
  arte_em_analise: "Arte em Análise",
  aguardando_aprovacao: "Aguardando Aprovação",
  em_producao: "Em Produção",
  impressao: "Impressão",
  acabamento: "Acabamento",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para Entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

interface OrderItem {
  productName?: string;
  quantity: number;
  priceAtOrder: string | number;
  selectedAttributes?: string;
  artFileUrl?: string;
  notes?: string;
}

interface PrintOrderSheetProps {
  order: {
    id: number;
    orderNumber: string;
    status: string;
    totalPrice: string | number;
    paymentStatus?: string;
    paymentMethod?: string;
    notes?: string;
    createdAt: string | Date;
    deliveryFullName?: string;
    deliveryPhone?: string;
    deliveryStreet?: string;
    deliveryNumber?: string;
    deliveryComplement?: string;
    deliveryNeighborhood?: string;
    deliveryCity?: string;
    deliveryState?: string;
    deliveryZipCode?: string;
    guestName?: string;
    guestEmail?: string;
    items?: OrderItem[];
  };
  /** URL base para o QR Code (ex: window.location.origin) */
  baseUrl?: string;
}

function fmt(v: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    typeof v === "string" ? parseFloat(v) : v
  );
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url);
}

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

export function PrintOrderSheet({ order, baseUrl }: PrintOrderSheetProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const qrUrl = `${baseUrl ?? window.location.origin}/admin/pedidos/${order.id}`;
  const clientName =
    order.deliveryFullName || order.guestName || "—";
  const clientPhone = order.deliveryPhone || "—";
  const clientEmail = order.guestEmail || "—";

  const hasAddress =
    order.deliveryStreet ||
    order.deliveryCity;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>OS - ${order.orderNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 12px;
            color: #1a1a1a;
            background: white;
          }
          @page { size: A4; margin: 15mm; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
          .os-page { max-width: 210mm; margin: 0 auto; padding: 8mm; }
          .os-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #f97316; padding-bottom: 10px; margin-bottom: 14px; }
          .os-logo-area { display: flex; flex-direction: column; gap: 2px; }
          .os-logo-title { font-size: 20px; font-weight: 800; color: #f97316; letter-spacing: -0.5px; }
          .os-logo-sub { font-size: 11px; color: #666; }
          .os-header-right { text-align: right; }
          .os-order-number { font-size: 18px; font-weight: 800; color: #1e293b; }
          .os-order-date { font-size: 10px; color: #666; margin-top: 2px; }
          .os-status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; background: #fef3c7; color: #92400e; margin-top: 5px; border: 1px solid #fbbf24; }
          .os-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
          .os-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
          .os-card-title { font-size: 10px; font-weight: 700; color: #f97316; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px; border-bottom: 1px solid #fed7aa; padding-bottom: 4px; }
          .os-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .os-label { font-size: 10px; color: #64748b; }
          .os-value { font-size: 11px; font-weight: 600; color: #1e293b; text-align: right; max-width: 60%; }
          .os-items { margin-bottom: 12px; }
          .os-items-title { font-size: 11px; font-weight: 700; color: #f97316; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 2px solid #fed7aa; padding-bottom: 4px; }
          .os-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; margin-bottom: 6px; display: flex; gap: 10px; }
          .os-item-info { flex: 1; }
          .os-item-name { font-size: 12px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
          .os-item-detail { font-size: 10px; color: #64748b; margin-bottom: 2px; }
          .os-item-price { font-size: 12px; font-weight: 700; color: #f97316; text-align: right; white-space: nowrap; }
          .os-item-img { width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #e2e8f0; flex-shrink: 0; }
          .os-item-img-placeholder { width: 60px; height: 60px; background: #f1f5f9; border-radius: 4px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94a3b8; text-align: center; flex-shrink: 0; }
          .os-footer { display: flex; justify-content: space-between; align-items: flex-end; border-top: 2px solid #e2e8f0; padding-top: 10px; margin-top: 10px; }
          .os-total { font-size: 16px; font-weight: 800; color: #1e293b; }
          .os-total-label { font-size: 10px; color: #64748b; }
          .os-obs { border: 1px dashed #cbd5e1; border-radius: 6px; padding: 8px; margin-bottom: 10px; }
          .os-obs-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .os-obs-text { font-size: 11px; color: #1e293b; }
          .os-sign { border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; }
          .os-sign-line { width: 45%; border-top: 1px solid #94a3b8; padding-top: 4px; text-align: center; font-size: 9px; color: #94a3b8; }
          .os-qr { display: flex; flex-direction: column; align-items: center; gap: 3px; }
          .os-qr-label { font-size: 9px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div>
      {/* Botão de impressão */}
      <Button
        onClick={handlePrint}
        className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
      >
        <Printer className="w-4 h-4" />
        Imprimir OS
      </Button>

      {/* Conteúdo da OS (oculto, usado apenas para impressão) */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="os-page">
            {/* Cabeçalho */}
            <div className="os-header">
              <div className="os-logo-area">
                <div className="os-logo-title">● Gráfica Ponto Digital</div>
                <div className="os-logo-sub">Comunicação Visual &amp; Impressão Digital</div>
                <div className="os-logo-sub">ORDEM DE SERVIÇO</div>
              </div>
              <div className="os-header-right">
                <div className="os-order-number">#{order.orderNumber}</div>
                <div className="os-order-date">{fmtDate(order.createdAt)}</div>
                <div className="os-status-badge">{STATUS_LABELS[order.status] ?? order.status}</div>
              </div>
            </div>

            {/* Grid: Cliente + Pedido */}
            <div className="os-grid">
              {/* Dados do Cliente */}
              <div className="os-card">
                <div className="os-card-title">Dados do Cliente</div>
                <div className="os-row">
                  <span className="os-label">Nome</span>
                  <span className="os-value">{clientName}</span>
                </div>
                <div className="os-row">
                  <span className="os-label">Telefone</span>
                  <span className="os-value">{clientPhone}</span>
                </div>
                <div className="os-row">
                  <span className="os-label">E-mail</span>
                  <span className="os-value" style={{ fontSize: "10px" }}>{clientEmail}</span>
                </div>
                {hasAddress && (
                  <div className="os-row" style={{ flexDirection: "column", gap: "2px" }}>
                    <span className="os-label">Endereço de Entrega</span>
                    <span className="os-value" style={{ textAlign: "left", maxWidth: "100%", fontSize: "10px" }}>
                      {order.deliveryStreet}{order.deliveryNumber ? `, ${order.deliveryNumber}` : ""}
                      {order.deliveryComplement ? ` - ${order.deliveryComplement}` : ""}
                      {order.deliveryNeighborhood ? ` · ${order.deliveryNeighborhood}` : ""}
                      {order.deliveryCity ? ` · ${order.deliveryCity}` : ""}
                      {order.deliveryState ? ` - ${order.deliveryState}` : ""}
                      {order.deliveryZipCode ? ` · CEP ${order.deliveryZipCode}` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Dados do Pedido */}
              <div className="os-card">
                <div className="os-card-title">Dados do Pedido</div>
                <div className="os-row">
                  <span className="os-label">Número</span>
                  <span className="os-value">{order.orderNumber}</span>
                </div>
                <div className="os-row">
                  <span className="os-label">Status</span>
                  <span className="os-value">{STATUS_LABELS[order.status] ?? order.status}</span>
                </div>
                <div className="os-row">
                  <span className="os-label">Pagamento</span>
                  <span className="os-value">{order.paymentStatus ?? "—"}</span>
                </div>
                {order.paymentMethod && (
                  <div className="os-row">
                    <span className="os-label">Forma</span>
                    <span className="os-value">{order.paymentMethod}</span>
                  </div>
                )}
                <div className="os-row">
                  <span className="os-label">Total</span>
                  <span className="os-value" style={{ color: "#f97316", fontSize: "13px" }}>
                    {fmt(order.totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Itens do Pedido */}
            {order.items && order.items.length > 0 && (
              <div className="os-items">
                <div className="os-items-title">Itens do Pedido</div>
                {order.items.map((item, i) => {
                  let attributes: any[] = [];
                  try {
                    if (item.selectedAttributes) {
                      const parsed = JSON.parse(item.selectedAttributes);
                      if (Array.isArray(parsed)) attributes = parsed;
                    }
                  } catch {}

                  const hasImage = item.artFileUrl && isImageUrl(item.artFileUrl);

                  return (
                    <div key={i} className="os-item">
                      {/* Imagem ou placeholder */}
                      {hasImage ? (
                        <img
                          src={item.artFileUrl}
                          alt="arte"
                          className="os-item-img"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="os-item-img-placeholder">
                          {item.artFileUrl ? "PDF/\nVetor" : "Sem\narquivo"}
                        </div>
                      )}

                      {/* Informações */}
                      <div className="os-item-info">
                        <div className="os-item-name">{item.productName ?? `Item ${i + 1}`}</div>
                        <div className="os-item-detail">Quantidade: {item.quantity}</div>
                        {attributes.length > 0 && (
                          <div className="os-item-detail">
                            Variações: {attributes.map((a: any) => `${a.typeName}: ${a.optionName}`).join(" · ")}
                          </div>
                        )}
                        {item.notes && (
                          <div className="os-item-detail" style={{ color: "#92400e" }}>
                            Obs: {item.notes}
                          </div>
                        )}
                        {item.artFileUrl && !hasImage && (
                          <div className="os-item-detail">
                            Arquivo: {fileNameFromUrl(item.artFileUrl)}
                          </div>
                        )}
                      </div>

                      {/* Preço */}
                      <div className="os-item-price">{fmt(item.priceAtOrder)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Observações */}
            {order.notes && (
              <div className="os-obs">
                <div className="os-obs-title">Observações do Pedido</div>
                <div className="os-obs-text">{order.notes}</div>
              </div>
            )}

            {/* Rodapé: Total + QR Code */}
            <div className="os-footer">
              <div>
                <div className="os-total-label">TOTAL DO PEDIDO</div>
                <div className="os-total">{fmt(order.totalPrice)}</div>
              </div>
              <div className="os-qr">
                <QRCodeSVG value={qrUrl} size={70} level="M" />
                <div className="os-qr-label">Escanear para<br />acompanhar pedido</div>
              </div>
            </div>

            {/* Assinaturas */}
            <div className="os-sign" style={{ marginTop: "16px" }}>
              <div className="os-sign-line">Responsável pela Produção</div>
              <div className="os-sign-line">Conferência / Expedição</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
