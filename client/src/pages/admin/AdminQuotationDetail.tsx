import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  ArrowRight,
  Printer,
  FileText,
  User,
  Package,
  Truck,
  CreditCard,
  Clock,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  rascunho:      { label: "Rascunho",       cls: "bg-gray-100 text-gray-700" },
  enviado:       { label: "Enviado",         cls: "bg-blue-100 text-blue-700" },
  em_negociacao: { label: "Em Negociação",   cls: "bg-amber-100 text-amber-700" },
  aprovado:      { label: "Aprovado",        cls: "bg-green-100 text-green-700" },
  recusado:      { label: "Recusado",        cls: "bg-red-100 text-red-700" },
  expirado:      { label: "Expirado",        cls: "bg-orange-100 text-orange-700" },
  cancelado:     { label: "Cancelado",       cls: "bg-slate-100 text-slate-500" },
};

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  boleto: "Boleto",
  transferencia: "Transferência",
};

// ─── Mapa de tradução de chaves de especificação ─────────────────────────────
const SPEC_LABELS: Record<string, string> = {
  width: "Largura (m)",
  height: "Altura (m)",
  largura: "Largura (m)",
  altura: "Altura (m)",
  tipo_de_impressao: "Tipo de Impressão",
  tipo_de_material: "Tipo de Material",
  tipo_de_espessura: "Tipo de Espessura",
  tipo_de_acabamento: "Tipo de Acabamento",
  tipo_de_bastao: "Tipo de Bastão",
  tipo_de_qualidade: "Tipo de Qualidade",
  tipo_de_formato: "Tipo de Formato",
  tipo_de_papel: "Tipo de Papel",
  gramatura: "Gramatura",
  acabamento: "Acabamento",
  impressao: "Impressão",
  material: "Material",
  quantidade: "Quantidade",
  arte: "Arte",
};
const SPEC_FIRST = ["width", "height", "largura", "altura"];

function formatSpecs(s: string, separator = " · "): string {
  try {
    const o: Record<string, string> = JSON.parse(s);
    const entries = Object.entries(o).filter(([, v]) => v && String(v).trim());
    const ordered = [
      ...SPEC_FIRST.filter(k => o[k]).map(k => [k, o[k]] as [string, string]),
      ...entries.filter(([k]) => !SPEC_FIRST.includes(k)),
    ];
    return ordered.map(([k, v]) => {
      const label = SPEC_LABELS[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      return `${label}: ${v}`;
    }).join(separator);
  } catch { return ""; }
}

function fmt(v: number | string | null | undefined) {
  return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

// ─── PDF Print ───────────────────────────────────────────────────────────────
function printQuotationPDF(q: any) {
  const items = q.items ?? [];
  const specs = (s: string) => {
    return formatSpecs(s, " · ");
  };

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Orçamento ${q.quotationNumber}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; border-bottom:3px solid #e91e8c; padding-bottom:24px; }
  .brand h1 { font-size:24px; font-weight:800; color:#e91e8c; }
  .brand p { font-size:12px; color:#666; margin-top:2px; }
  .doc-info { text-align:right; }
  .doc-info .num { font-size:18px; font-weight:700; color:#1a1a1a; }
  .doc-info .date { font-size:12px; color:#666; margin-top:4px; }
  .status-badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; background:#e91e8c; color:#fff; margin-top:8px; }
  .section { margin-bottom:24px; }
  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#e91e8c; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #f0f0f0; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .info-item label { font-size:10px; color:#888; display:block; margin-bottom:2px; }
  .info-item span { font-size:13px; font-weight:500; color:#1a1a1a; }
  table { width:100%; border-collapse:collapse; }
  th { font-size:10px; font-weight:700; text-transform:uppercase; color:#888; padding:8px 10px; background:#f8f8f8; text-align:left; border-bottom:2px solid #e0e0e0; }
  td { font-size:12px; padding:10px; border-bottom:1px solid #f0f0f0; vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .td-right { text-align:right; }
  .totals { margin-top:16px; border-top:2px solid #e0e0e0; padding-top:16px; }
  .total-row { display:flex; justify-content:space-between; font-size:13px; padding:4px 0; }
  .total-row.grand { background:#e91e8c; color:#fff; padding:10px 16px; border-radius:8px; margin-top:8px; font-size:16px; font-weight:700; }
  .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e0e0e0; font-size:10px; color:#aaa; text-align:center; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <h1>Maria Imprime</h1>
      <p>Sua Gráfica Online</p>
    </div>
    <div class="doc-info">
      <div class="num">${q.quotationNumber}</div>
      <div class="date">Emitido em ${fmtDate(q.createdAt)}</div>
      <div class="date">Válido até ${fmtDate(q.expiresAt)}</div>
      <div class="status-badge">${STATUS_CONFIG[q.status]?.label ?? q.status}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Cliente</div>
    <div class="info-grid">
      <div class="info-item"><label>Nome</label><span>${q.clientName ?? "—"}</span></div>
      <div class="info-item"><label>E-mail</label><span>${q.clientEmail ?? "—"}</span></div>
      <div class="info-item"><label>Telefone</label><span>${q.clientPhone ?? q.clientWhatsapp ?? "—"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Produtos / Serviços</div>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Especificações</th>
          <th style="text-align:right">Qtd</th>
          <th style="text-align:right">Unit.</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((i: any) => `
        <tr>
          <td><strong>${i.productName}</strong></td>
          <td style="color:#666;font-size:11px">${specs(i.specifications)}</td>
          <td class="td-right">${i.quantity}</td>
          <td class="td-right">${fmt(i.unitPrice)}</td>
          <td class="td-right"><strong>${fmt(i.totalPrice)}</strong></td>
        </tr>`).join("")}
      </tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${fmt(q.subtotal)}</span></div>
      ${Number(q.discountAmount) > 0 ? `<div class="total-row" style="color:#16a34a"><span>Desconto</span><span>- ${fmt(q.discountAmount)}</span></div>` : ""}
      ${Number(q.shippingPrice) > 0 ? `<div class="total-row"><span>Frete (${q.shippingLabel ?? ""})</span><span>${fmt(q.shippingPrice)}</span></div>` : ""}
      <div class="total-row grand"><span>TOTAL</span><span>${fmt(q.total)}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Condições Comerciais</div>
    <div class="info-grid">
      <div class="info-item"><label>Forma de pagamento</label><span>${PAYMENT_LABELS[q.paymentMethod ?? ""] ?? q.paymentMethod ?? "—"}</span></div>
      <div class="info-item"><label>Prazo de produção</label><span>${q.productionDeadline ? `${q.productionDeadline} dias úteis` : "—"}</span></div>
      <div class="info-item"><label>Entrega</label><span>${q.shippingLabel ?? "Retirada na loja"}</span></div>
      <div class="info-item"><label>Validade do orçamento</label><span>${fmtDate(q.expiresAt)}</span></div>
    </div>
    ${q.commercialNotes ? `<div style="margin-top:12px;padding:12px;background:#f8f8f8;border-radius:6px;font-size:12px;color:#555">${q.commercialNotes}</div>` : ""}
  </div>

  <div class="footer">
    Maria Imprime — mariaimprime.com.br · Este orçamento é válido até ${fmtDate(q.expiresAt)} · Sujeito a confirmação de disponibilidade de material.
  </div>
</div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminQuotationDetail() {
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const quotationId = parseInt(params.id);

  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const { data: quotation, isLoading, refetch } = trpc.quotations.getById.useQuery(
    { id: quotationId },
    { enabled: !!quotationId }
  );

  const updateStatus = trpc.quotations.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const duplicate = trpc.quotations.duplicate.useMutation({
    onSuccess: (res) => {
      toast.success(`Duplicado: ${res.newNumber}`);
      navigate(`/admin/orcamentos/${res.newId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const convertToOrder = trpc.quotations.convertToOrder.useMutation({
    onSuccess: (res) => {
      toast.success(`Pedido ${res.orderNumber} criado com sucesso!`);
      navigate(`/admin/pedidos/${res.orderId}`);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Carregando orçamento...</div>;
  }
  if (!quotation) {
    return <div className="p-8 text-center text-gray-400">Orçamento não encontrado.</div>;
  }

  const q = quotation;
  const sc = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.rascunho;
  const isApproved = q.status === "aprovado";
  const isDraft = q.status === "rascunho";
  const isEditable = ["rascunho", "em_negociacao"].includes(q.status);
  const alreadyConverted = !!q.convertedOrderId;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/orcamentos")} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{q.quotationNumber}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
                {sc.label}
              </span>
              {alreadyConverted && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                  Convertido em Pedido
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Criado em {fmtDate(q.createdAt)} · Válido até {fmtDate(q.expiresAt)}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => printQuotationPDF(q)}>
            <Printer className="w-3.5 h-3.5" /> Imprimir PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => duplicate.mutate({ id: q.id })}>
            <Copy className="w-3.5 h-3.5" /> Duplicar
          </Button>
          {isEditable && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/admin/orcamentos/${q.id}/editar`)}>
              <Edit className="w-3.5 h-3.5" /> Editar
            </Button>
          )}
          {isDraft && (
            <Button
              size="sm"
              className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => updateStatus.mutate({ id: q.id, status: "enviado" })}
            >
              <Send className="w-3.5 h-3.5" /> Enviar ao Cliente
            </Button>
          )}
          {q.status === "enviado" && (
            <>
              <Button
                size="sm"
                className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => updateStatus.mutate({ id: q.id, status: "aprovado" })}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => updateStatus.mutate({ id: q.id, status: "recusado" })}
              >
                <XCircle className="w-3.5 h-3.5" /> Recusar
              </Button>
            </>
          )}
          {isApproved && !alreadyConverted && (
            <Button
              size="sm"
              className="gap-1 bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setShowConvertConfirm(true)}
            >
              <ArrowRight className="w-3.5 h-3.5" /> Converter em Pedido
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">

          {/* Cliente */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-pink-600" />
              <h2 className="font-semibold text-gray-800">Cliente</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400 text-xs block">Nome</span><span className="font-medium">{q.clientName ?? "—"}</span></div>
              <div><span className="text-gray-400 text-xs block">E-mail</span><span>{q.clientEmail ?? "—"}</span></div>
              <div><span className="text-gray-400 text-xs block">Telefone</span><span>{q.clientPhone ?? "—"}</span></div>
              <div><span className="text-gray-400 text-xs block">WhatsApp</span><span>{q.clientWhatsapp ?? "—"}</span></div>
            </div>
          </div>

          {/* Produtos */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-pink-600" />
              <h2 className="font-semibold text-gray-800">Produtos / Serviços</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["", "Produto", "Especificações", "Qtd", "Unit.", "Total"].map((h) => (
                      <th key={h} className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(q.items ?? []).map((item: any) => {
                    let specs: Record<string, string> = {};
                    try { specs = JSON.parse(item.specifications); } catch {}
                    const specText = formatSpecs(item.specifications);
                    return (
                      <tr key={item.id}>
                        <td className="py-2.5 pr-2">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-10 h-10 object-contain rounded border border-gray-100 cursor-pointer"
                              onClick={() => setLightboxImg(item.productImage)}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 font-medium text-gray-800">{item.productName}</td>
                        <td className="py-2.5 pr-3 text-gray-500 text-xs max-w-48">{specText || "—"}</td>
                        <td className="py-2.5 pr-3 text-center">{item.quantity}</td>
                        <td className="py-2.5 pr-3 text-right">{fmt(item.unitPrice)}</td>
                        <td className="py-2.5 font-semibold text-right">{fmt(item.totalPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Entrega */}
          {q.shippingMethod && (
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-pink-600" />
                <h2 className="font-semibold text-gray-800">Entrega</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400 text-xs block">Método</span><span>{q.shippingLabel ?? q.shippingMethod}</span></div>
                <div><span className="text-gray-400 text-xs block">Valor do frete</span><span>{fmt(q.shippingPrice)}</span></div>
                <div><span className="text-gray-400 text-xs block">Prazo estimado</span><span>{q.shippingEstimatedDays ? `${q.shippingEstimatedDays} dias` : "—"}</span></div>
                {q.deliveryAddress && <div className="col-span-2"><span className="text-gray-400 text-xs block">Endereço</span><span>{q.deliveryAddress}</span></div>}
              </div>
            </div>
          )}

          {/* Condições */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-pink-600" />
              <h2 className="font-semibold text-gray-800">Condições Comerciais</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-400 text-xs block">Forma de pagamento</span><span>{PAYMENT_LABELS[q.paymentMethod ?? ""] ?? q.paymentMethod ?? "—"}</span></div>
              <div><span className="text-gray-400 text-xs block">Prazo de produção</span><span>{q.productionDeadline ? `${q.productionDeadline} dias` : "—"}</span></div>
              <div><span className="text-gray-400 text-xs block">Validade</span><span>{q.quotationValidity ? `${q.quotationValidity} dias` : "—"}</span></div>
              <div><span className="text-gray-400 text-xs block">Expira em</span><span>{fmtDate(q.expiresAt)}</span></div>
            </div>
            {q.commercialNotes && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600">
                <span className="text-xs text-gray-400 block mb-1">Observações</span>
                {q.commercialNotes}
              </div>
            )}
          </div>
        </div>

        {/* Resumo financeiro */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 sticky top-4">
            <h2 className="font-semibold text-gray-800 mb-4">Resumo Financeiro</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{fmt(q.subtotal)}</span>
              </div>
              {Number(q.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span className="font-medium">- {fmt(q.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Frete</span>
                <span className="font-medium">{fmt(q.shippingPrice)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 mt-1">
                <div className="flex justify-between items-center bg-pink-600 text-white rounded-lg px-4 py-3">
                  <span className="font-semibold">TOTAL</span>
                  <span className="text-xl font-bold">{fmt(q.total)}</span>
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /><span>Criado em {fmtDate(q.createdAt)}</span></div>
              {q.sentAt && <div className="flex items-center gap-2"><Send className="w-3.5 h-3.5" /><span>Enviado em {fmtDate(q.sentAt)}</span></div>}
              {q.approvedAt && <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /><span>Aprovado em {fmtDate(q.approvedAt)}</span></div>}
              <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /><span>Válido até {fmtDate(q.expiresAt)}</span></div>
            </div>

            {/* Botão de impressão */}
            <Button
              variant="outline"
              className="w-full mt-4 gap-2 text-sm"
              onClick={() => printQuotationPDF(q)}
            >
              <FileText className="w-4 h-4" /> Gerar PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de conversão */}
      <AlertDialog open={showConvertConfirm} onOpenChange={setShowConvertConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter em Pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os dados deste orçamento (cliente, produtos, preços, frete e condições) serão clonados para um novo pedido. O orçamento permanecerá vinculado ao pedido para rastreabilidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-pink-600 hover:bg-pink-700"
              onClick={() => convertToOrder.mutate({ id: q.id })}
            >
              Confirmar Conversão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="Arte" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </div>
  );
}
