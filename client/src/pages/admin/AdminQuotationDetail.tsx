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
  MessageCircle,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { createAdminDetailLocation, getAdminReturnTarget } from "@/lib/adminNavigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/AdminLayout";
import { formatCompanyAddress, formatCompanyContact } from "@/lib/companyQuotationDetails";
import { getSelectedQuotationSpecifications } from "@/lib/quotationSpecifications";
import { buildQuotationWhatsappUrl } from "@/lib/quotationWhatsappShare";

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
  cartao_credito: "Cartão de débito/crédito",
  cartao_debito: "Cartão de débito/crédito",
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
  printingType: "Tipo de Impressão",
  finish: "Tipo de Acabamento",
  thickness: "Tipo de Espessura",
  quantidade: "Quantidade",
  arte: "Arte",
};
// Função que retorna linhas estruturadas para exibição em JSX
function buildSpecLines(s: string): { line1: string | null; rest: string[] } {
  try {
    const o: Record<string, string> = JSON.parse(s);
    const w = parseFloat((o.width ?? o.largura ?? "").replace(",", ".")) || 0;
    const h = parseFloat((o.height ?? o.altura ?? "").replace(",", ".")) || 0;
    const line1 = (w > 0 && h > 0)
      ? `Largura (m): ${w.toFixed(2).replace(".", ",")} x Altura (m): ${h.toFixed(2).replace(".", ",")} = ${(w * h).toFixed(2).replace(".", ",")} m²`
      : (w > 0 ? `Largura (m): ${w.toFixed(2).replace(".", ",")}` : null);
    const skip = new Set(["width", "height", "largura", "altura"]);
    const rest = Object.entries(o)
      .filter(([k, v]) => !skip.has(k) && !TECHNICAL_SPEC_KEYS.has(k) && v && String(v).trim())
      .map(([k, v]) => {
        if (k === "description") return String(v);
        const label = SPEC_LABELS[k] ?? k.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
        return `${label}: ${v}`;
      });
    return { line1, rest };
  } catch { return { line1: null, rest: [] }; }
}

// Retorna linhas no formato { label, value } para exibição com label e valor em linhas separadas
function buildSpecPairs(s: string): { label: string; value: string }[] {
  try {
    const o: Record<string, string> = JSON.parse(s);
    const w = parseFloat((o.width ?? o.largura ?? "").replace(",", ".")) || 0;
    const h = parseFloat((o.height ?? o.altura ?? "").replace(",", ".")) || 0;
    const pairs: { label: string; value: string }[] = [];
    if (w > 0 || h > 0) {
      const dim = w > 0 && h > 0
        ? `Largura(m): ${w.toFixed(2).replace(".", ",")} x Altura(m): ${h.toFixed(2).replace(".", ",")}`
        : w > 0 ? `Largura(m): ${w.toFixed(2).replace(".", ",")}` : `Altura(m): ${h.toFixed(2).replace(".", ",")}`;
      const area = w > 0 && h > 0 ? `Total = ${(w * h).toFixed(2).replace(".", ",")} m²` : "";
      pairs.push({ label: dim, value: area });
    }
    const skip = new Set(["width", "height", "largura", "altura"]);
    getSelectedQuotationSpecifications(s)
      .filter(({ key }) => !skip.has(key) && !TECHNICAL_SPEC_KEYS.has(key))
      .forEach(({ key, value }) => {
        const k = key;
        const v = value;
        if (k === "description") {
          pairs.push({ label: "", value: String(v) });
          return;
        }
        const label = SPEC_LABELS[k] ?? k.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
        pairs.push({ label: `${label}:`, value: String(v) });
      });
    return pairs;
  } catch { return []; }
}
// Retorna o label sem os dois pontos para uso no JSX (adicionamos os dois pontos no render)

const SPEC_FIRST = ["width", "height", "largura", "altura"];
const TECHNICAL_SPEC_KEYS = new Set(["itemType", "item_type"]);

function formatSpecs(s: string): string {
  try {
    const o: Record<string, string> = JSON.parse(s);
    const w = parseFloat((o.width ?? o.largura ?? "").replace(",", ".")) || 0;
    const h = parseFloat((o.height ?? o.altura ?? "").replace(",", ".")) || 0;
    const parts: string[] = [];
    if (w > 0 && h > 0) {
      parts.push(`Largura (m): ${w.toFixed(2).replace(".", ",")} ❯ Altura (m): ${h.toFixed(2).replace(".", ",")} ❯ Total = ${(w * h).toFixed(2).replace(".", ",")} m²`);
    } else if (w > 0) {
      parts.push(`Largura (m): ${w.toFixed(2).replace(".", ",")}`);
    } else if (h > 0) {
      parts.push(`Altura (m): ${h.toFixed(2).replace(".", ",")}`);
    }
    const skip = new Set(["width", "height", "largura", "altura"]);
    Object.entries(o)
      .filter(([k, v]) => !skip.has(k) && !TECHNICAL_SPEC_KEYS.has(k) && v && String(v).trim())
      .forEach(([k, v]) => {
        if (k === "description") {
          parts.push(String(v));
          return;
        }
        const label = SPEC_LABELS[k] ?? k.replace(/_/g, " ").replace(/^\w/, c => c.toUpperCase());
        parts.push(`${label}: ${v}`);
      });
    return parts.join(" ❯ ");
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
function printQuotationPDF(q: any, company?: any, responsible?: string) {
  const items = q.items ?? [];
  const hasDiscount = Number(q.discountAmount ?? 0) > 0;
  const companyLine = [company?.tradeName ?? "Maria Imprime", company?.cnpj ? `CNPJ: ${company.cnpj}` : "", company?.commercialPhone ?? "", company?.supportEmail ?? ""].filter(Boolean).join(" · ");
  const specs = (s: string) => buildSpecPairs(s)
    .map(({ label, value }) => `<div>${label ? `<span style="color:#777">${label}</span> ` : ""}<span>${value}</span></div>`)
    .join("");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Orçamento ${q.quotationNumber}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: #fff; }
  @page { size: A4; margin: 8mm; }
  .page { width: 190mm; min-height: 277mm; margin: 0 auto; padding: 0; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; border-bottom:3px solid #e91e8c; padding-bottom:8px; }
  .brand { max-width:50%; }
  .brand h1 { font-size:24px; font-weight:800; color:#e91e8c; }
  .brand img { height:52px; object-fit:contain; display:block; }
  .doc-info { text-align:right; width:48%; max-width:none; }
  .doc-info .num { font-size:18px; font-weight:700; color:#1a1a1a; }
  .doc-info .date { font-size:11px; color:#666; margin-top:2px; }
  .status-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:9px; font-weight:600; background:#e91e8c; color:#fff; margin-left:6px; vertical-align:middle; }
  .section { margin-bottom:12px; }
  .section-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#e91e8c; margin-bottom:5px; padding-bottom:3px; border-bottom:1px solid #f0f0f0; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 10px; }
  .info-item label { font-size:9px; color:#888; display:block; margin-bottom:1px; }
  .info-item span { font-size:11px; font-weight:500; color:#1a1a1a; }
  table { width:100%; border-collapse:collapse; table-layout:fixed; }
  th { font-size:9px; font-weight:700; text-transform:uppercase; color:#888; padding:5px 6px; background:#f8f8f8; text-align:left; border-bottom:2px solid #e0e0e0; }
  td { font-size:11px; padding:6px; border-bottom:1px solid #f0f0f0; vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .col-image { width:8%; } .col-product { width:19%; } .col-specs { width:36%; } .col-art { width:11%; } .col-qty { width:7%; } .col-unit { width:10%; } .col-total { width:11%; }
  .td-image, .td-art { text-align:center; }
  .product-image { width:36px; height:36px; object-fit:contain; border:1px solid #eee; border-radius:4px; }
  .art-image { width:48px; height:48px; object-fit:contain; border:1px solid #eee; border-radius:4px; }
  .empty-image { width:36px; height:36px; display:inline-block; border-radius:4px; background:#f5f5f5; }
  .td-specs { color:#666; font-size:10px; line-height:1.3; overflow-wrap:anywhere; }
  .td-specs div { display:block; margin-bottom:2px; }
  .td-right { text-align:right; }
  .totals { margin-top:8px; border-top:2px solid #e0e0e0; padding-top:8px; }
  .total-row { display:flex; justify-content:space-between; font-size:11px; padding:2px 0; }
  .total-row.grand { background:#e91e8c; color:#fff; padding:2px 10px; min-height:24px; border-radius:7px; margin-top:4px; font-size:13px; line-height:1.05; font-weight:700; }
  .company-meta { font-size:9px; color:#555; line-height:1.25; margin-top:4px; max-width:360px; }
  .commerce-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:6px; margin-bottom:10px; }
  .commerce-grid .section { border:1px solid #e5e7eb; border-radius:8px; padding-top:8px !important; padding-bottom:8px !important; padding-left:8px; padding-right:8px; margin:0; }
  .client-summary { margin-top:6px; padding-top:4px; border-top:1px dashed #ddd; text-align:right; color:#333; }
  .client-summary p { margin:2px 0; font-size:10px; line-height:1.2; }
  .client-summary .client-contact { white-space:nowrap; }
  .legal-notes { margin-top:14px; padding-top:7px; border-top:1px solid #eee; font-size:9px; line-height:1.35; color:#555; }
  .custom-notes { margin-top:7px; padding:7px 8px; border:1px solid #f1d8e7; border-radius:6px; background:#fff9fc; font-size:9px; line-height:1.35; color:#555; white-space:pre-line; }
  .footer { margin-top:12px; padding-top:7px; border-top:1px solid #e0e0e0; font-size:9px; color:#aaa; text-align:center; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      <img src="https://graficaapp-uwgro8uv.manus.space/manus-storage/logo-maria-imprime_acc5585b.webp" alt="Maria Imprime" />
      <div class="company-meta">${companyLine}</div>
    </div>
	    <div class="doc-info">
	      <div class="num">${q.quotationNumber}<span class="status-badge">${STATUS_CONFIG[q.status]?.label ?? q.status}</span></div>
	      <div class="date">Emitido em ${fmtDate(q.createdAt)} | Válido até ${fmtDate(q.expiresAt)}</div>
	      ${(q.clientName || q.clientEmail || q.clientPhone || q.clientWhatsapp) ? `<div class="client-summary">
	        ${q.clientName ? `<p><strong>Cliente:</strong> ${q.clientName}</p>` : ""}
	        ${q.clientEmail || q.clientPhone || q.clientWhatsapp ? `<p class="client-contact">${[q.clientEmail, q.clientPhone ?? q.clientWhatsapp].filter(Boolean).join(" | ")}</p>` : ""}
	      </div>` : ""}
	    </div>
	  </div>
		
	  <div class="section">
    <div class="section-title">Produtos / Serviços</div>
    <table>
      <thead>
        <tr>
          <th class="col-image"></th>
          <th class="col-product">Produto</th>
          <th class="col-specs">Especificações</th>
          <th class="col-art">Arte</th>
          <th class="col-qty" style="text-align:right">Qtd</th>
          <th class="col-unit" style="text-align:right">Unit.</th>
          <th class="col-total" style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((i: any) => `
        <tr>
          <td class="td-image">${i.productImage ? `<img class="product-image" src="${i.productImage}" alt="" />` : `<span class="empty-image"></span>`}</td>
          <td><strong>${i.productName}</strong></td>
          <td class="td-specs">${specs(i.specifications) || "—"}</td>
          <td class="td-art">${i.artFileUrl ? `<img class="art-image" src="${i.artFileUrl}" alt="Arte" />` : "—"}</td>
          <td class="td-right">${i.quantity}</td>
          <td class="td-right">${fmt(i.unitPrice)}</td>
          <td class="td-right"><strong>${fmt(i.totalPrice)}</strong></td>
        </tr>`).join("")}
      </tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${fmt(Number(q.total ?? 0) - Number(q.shippingPrice ?? 0) + Number(q.discountAmount ?? 0))}</span></div>
      ${hasDiscount ? `<div class="total-row" style="color:#16a34a"><span>Desconto</span><span>- ${fmt(q.discountAmount)}</span></div>` : ""}
      <div class="total-row"><span>Frete / Entrega</span><span>${fmt(q.shippingPrice)}</span></div>
      <div class="total-row grand"><span>TOTAL</span><span>${fmt(q.total)}</span></div>
    </div>
  </div>

	  <div class="commerce-grid">
	    <div class="section">
	      <div class="section-title">Entrega</div>
	      <div class="info-grid">
	        <div class="info-item"><label>Método</label><span>${q.shippingLabel ?? q.shippingMethod ?? "Retirada na loja"}</span></div>
	        <div class="info-item"><label>Valor do frete</label><span>${fmt(q.shippingPrice)}</span></div>
	        ${q.shippingEstimatedDays ? `<div class="info-item"><label>Prazo estimado</label><span>${q.shippingEstimatedDays} dias</span></div>` : ""}
	        ${q.deliveryAddress ? `<div class="info-item"><label>Endereço</label><span>${q.deliveryAddress}</span></div>` : ""}
	      </div>
	    </div>
	    <div class="section">
	      <div class="section-title">Condições Comerciais</div>
	      <div class="info-grid">
	        ${q.paymentMethod ? `<div class="info-item"><label>Forma de pagamento</label><span>${PAYMENT_LABELS[q.paymentMethod] ?? q.paymentMethod}</span></div>` : ""}
	        ${q.productionDeadline ? `<div class="info-item"><label>Prazo de produção</label><span>${q.productionDeadline} dias úteis</span></div>` : ""}
	        ${q.quotationValidity ? `<div class="info-item"><label>Validade</label><span>${q.quotationValidity} dias</span></div>` : ""}
	        <div class="info-item"><label>Expira em</label><span>${fmtDate(q.expiresAt)}</span></div>
	      </div>
	    </div>
	  </div>
	  <div class="legal-notes">
	    <p><strong>Início da produção:</strong> após aprovação da arte, confirmação do pagamento e disponibilidade dos materiais.</p>
	    <p><strong>Arte e aprovação:</strong> o cliente é responsável pela conferência de textos, imagens, medidas, cores e demais informações presentes na arte. Alterações após aprovação podem gerar novo prazo e/ou custos adicionais.</p>
	    <p><strong>Variação de cores:</strong> as cores visualizadas em tela podem variar em relação ao resultado final impresso devido às diferenças entre monitores, arquivos e processos de impressão.</p>
	    <p><strong>Aceite do orçamento:</strong> ao aprovar este orçamento, o cliente declara concordar com produtos, quantidades, especificações, valores, prazos e condições comerciais apresentados.</p>
	  </div>
	  ${q.commercialNotes ? `<div class="custom-notes"><strong>Observações / Termos personalizados:</strong><br>${q.commercialNotes}</div>` : ""}

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
  const returnTarget = getAdminReturnTarget("/admin/orcamentos");
  const params = useParams<{ id: string }>();
  const quotationId = parseInt(params.id);

  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const { data: quotation, isLoading, refetch } = trpc.quotations.getById.useQuery(
    { id: quotationId },
    { enabled: !!quotationId }
  );
  const { data: company } = trpc.companySettings.getPublic.useQuery();
  const { adminUser } = useAdminAuth();

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
      navigate(createAdminDetailLocation(`/admin/pedidos/${res.orderId}`, returnTarget.path));
    },
    onError: (e) => toast.error(e.message),
  });

  const sendEmail = trpc.quotations.sendEmail.useMutation({
    onSuccess: (result) => {
      setShowEmailConfirm(false);
      toast.success(`Orçamento enviado para ${result.recipientEmail}.`);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return <AdminLayout><div className="p-8 text-center text-gray-400" role="status">Carregando orçamento...</div></AdminLayout>;
  }
  if (!quotation) {
    return <AdminLayout><div className="p-8 text-center text-gray-400" role="status">Orçamento não encontrado.</div></AdminLayout>;
  }

  const q = quotation;
  const sc = STATUS_CONFIG[q.status] ?? STATUS_CONFIG.rascunho;
  const isApproved = q.status === "aprovado";
  const isDraft = q.status === "rascunho";
  const isEditable = ["rascunho", "em_negociacao"].includes(q.status);
  const alreadyConverted = !!q.convertedOrderId;
  const shareQuotationOnWhatsapp = () => {
    const phone = q.clientWhatsapp || q.clientPhone;
    const message = [
      `Olá${q.clientName ? `, ${q.clientName}` : ""}!`,
      `Segue o orçamento ${q.quotationNumber} da Maria Imprime.`,
      `Total: ${fmt(q.total)}.`,
      `Validade: ${fmtDate(q.expiresAt)}.`,
      "Ficamos à disposição para esclarecer qualquer dúvida.",
    ].join("\n");
    const url = buildQuotationWhatsappUrl(phone, message);
    if (!url) {
      toast.error("Cadastre um telefone ou WhatsApp válido para este cliente antes de compartilhar.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AdminLayout>
    <div className="admin-visual-system p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(returnTarget.path)} className="gap-1">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {returnTarget.label}
          </Button>
          <div>
            <img src="/manus-storage/logo-maria-imprime_acc5585b.webp" alt="Maria Imprime" className="h-8 object-contain mb-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{q.quotationNumber}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.cls}`} aria-live="polite">
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
          <Button variant="outline" size="sm" className="gap-1" onClick={() => printQuotationPDF(q, company, adminUser?.name)}>
            <Printer className="w-3.5 h-3.5" aria-hidden="true" /> Imprimir PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-green-700 border-green-200 hover:bg-green-50" onClick={shareQuotationOnWhatsapp}>
            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-pink-700 border-pink-200 hover:bg-pink-50"
            onClick={() => {
              if (!q.clientEmail) {
                toast.error("Cadastre um e-mail para este cliente antes de enviar o orçamento.");
                return;
              }
              setShowEmailConfirm(true);
            }}
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" /> E-mail
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => duplicate.mutate({ id: q.id })} aria-busy={duplicate.isPending}>
            <Copy className="w-3.5 h-3.5" aria-hidden="true" /> Duplicar
          </Button>
          {isEditable && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/admin/orcamentos/${q.id}/editar`)}>
              <Edit className="w-3.5 h-3.5" aria-hidden="true" /> Editar
            </Button>
          )}
          {isDraft && (
            <Button
              size="sm"
              className="gap-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => updateStatus.mutate({ id: q.id, status: "enviado" })}
              aria-busy={updateStatus.isPending}
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" /> Enviar ao Cliente
            </Button>
          )}
          {q.status === "enviado" && (
            <>
              <Button
                size="sm"
                className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => updateStatus.mutate({ id: q.id, status: "aprovado" })}
                aria-busy={updateStatus.isPending}
              >
                <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" /> Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => updateStatus.mutate({ id: q.id, status: "recusado" })}
                aria-busy={updateStatus.isPending}
              >
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Recusar
              </Button>
            </>
          )}
          {isApproved && !alreadyConverted && (
            <Button
              size="sm"
              className="gap-1 bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setShowConvertConfirm(true)}
            >
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" /> Converter em Pedido
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <h2 className="font-semibold text-gray-800 mb-2">Dados da Empresa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><span className="text-gray-400 text-xs block">Empresa</span><span className="font-medium">{company?.tradeName ?? "Maria Imprime"}</span>{company?.legalName && <span className="block text-xs text-gray-500">{company.legalName}</span>}</div>
            {company?.cnpj && <div><span className="text-gray-400 text-xs block">CNPJ / Inscrição Estadual</span><span>{company.cnpj}</span>{company.stateRegistration && <span className="block text-xs text-gray-500">IE: {company.stateRegistration}</span>}</div>}
            {company?.commercialPhone && <div><span className="text-gray-400 text-xs block">Telefone comercial</span><span>{company.commercialPhone}</span></div>}
            {company?.whatsappNumber && <div><span className="text-gray-400 text-xs block">WhatsApp</span><span>{company.whatsappNumber}</span></div>}
            {company?.supportEmail && <div className="sm:col-span-2"><span className="text-gray-400 text-xs block">E-mail de atendimento</span><span>{company.supportEmail}</span></div>}
            {formatCompanyAddress(company) && <div className="sm:col-span-2"><span className="text-gray-400 text-xs block">Endereço completo</span><span className="text-xs text-gray-600 leading-relaxed">{formatCompanyAddress(company)}</span></div>}
          </div>
          {adminUser?.name && <p className="mt-2 pt-2 border-t text-xs text-gray-500">Responsável pela emissão: <span className="font-medium text-gray-700">{adminUser.name}</span></p>}
        </section>

        <section className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-pink-600" /><h2 className="font-semibold text-gray-800">Cliente</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {q.clientName && <div><span className="text-gray-400 text-xs block">Nome / Razão Social</span><span className="font-medium">{q.clientName}</span></div>}
            {q.clientEmail && <div><span className="text-gray-400 text-xs block">E-mail</span><span>{q.clientEmail}</span></div>}
            {q.clientCpfCnpj && <div><span className="text-gray-400 text-xs block">CPF / CNPJ</span><span>{q.clientCpfCnpj}</span></div>}
            {q.clientPhone && <div><span className="text-gray-400 text-xs block">Telefone</span><span>{q.clientPhone}</span></div>}
            {q.clientWhatsapp && <div><span className="text-gray-400 text-xs block">WhatsApp</span><span>{q.clientWhatsapp}</span></div>}
            {(q.clientStreet || q.clientCity || q.clientZipCode) && <div className="md:col-span-2"><span className="text-gray-400 text-xs block">Endereço</span><span>{[q.clientStreet, q.clientNumber, q.clientComplement, q.clientNeighborhood, [q.clientCity, q.clientState].filter(Boolean).join("/"), q.clientZipCode ? `CEP ${q.clientZipCode}` : ""].filter(Boolean).join(", ")}</span></div>}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2"><Package className="w-4 h-4 text-pink-600" /><h2 className="font-semibold text-gray-800">Produtos / Serviços</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-y border-gray-100">{["Imagem", "Produto", "Especificações", "Arte", "Qtd", "Unit.", "Total"].map((h) => <th scope="col" key={h} className="text-left py-1.5 px-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h === "Imagem" ? <span className="sr-only">Imagem</span> : h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100">
              {(q.items ?? []).map((item: any) => {
                const specPairs = buildSpecPairs(item.specifications);
                return <tr key={item.id}>
                  <td className="py-1.5 px-2">{item.productImage ? <button type="button" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300" onClick={() => setLightboxImg(item.productImage)} aria-label={`Ampliar imagem de ${item.productName}`}><img src={item.productImage} alt="" className="w-8 h-8 object-contain rounded border border-gray-100" /></button> : <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-300" aria-hidden="true" /></div>}</td>
                  <td className="py-1.5 px-2 font-semibold text-gray-800 align-top">{item.productName}</td>
                  <td className="py-1.5 px-2 text-[11px] text-gray-600 max-w-72 leading-4 align-top">{specPairs.length > 0 && <div className="space-y-0.5">{specPairs.map((pair, index) => <p key={index} className="block">{pair.label && <span className="text-gray-500">{pair.label} </span>}<span className={pair.label ? "text-gray-700" : "text-gray-600"}>{pair.value}</span></p>)}</div>}</td>
                  <td className="py-1.5 px-2 align-top">{item.artFileUrl && <button type="button" className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300" onClick={() => setLightboxImg(item.artFileUrl)} aria-label={`Ampliar arte de ${item.productName}`}><img src={item.artFileUrl} alt="" className="w-10 h-10 object-contain rounded border border-gray-100" /></button>}</td>
                  <td className="py-1.5 px-2 text-center align-top">{item.quantity}</td><td className="py-1.5 px-2 text-right align-top">{fmt(item.unitPrice)}</td><td className="py-1.5 px-2 font-semibold text-right align-top">{fmt(item.totalPrice)}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="space-y-1 text-sm"><div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{fmt(Number(q.total ?? 0) - Number(q.shippingPrice ?? 0) + Number(q.discountAmount ?? 0))}</span></div>{Number(q.discountAmount ?? 0) > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span className="font-medium">- {fmt(q.discountAmount)}</span></div>}<div className="flex justify-between"><span className="text-gray-600">Frete / Entrega</span><span className="font-medium">{fmt(q.shippingPrice)}</span></div><div className="flex justify-between items-center bg-pink-600 text-white rounded-lg px-3 py-1 min-h-7 mt-2" aria-live="polite"><span className="font-semibold">TOTAL</span><span className="text-sm font-bold">{fmt(q.total)}</span></div></div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-lg border border-gray-200 p-3"><div className="flex items-center gap-2 mb-2"><Truck className="w-4 h-4 text-pink-600" /><h2 className="font-semibold text-gray-800">Entrega</h2></div><div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-gray-400 text-xs block">Método</span><span>{q.shippingLabel ?? q.shippingMethod ?? "Retirada na loja"}</span></div><div><span className="text-gray-400 text-xs block">Valor do frete</span><span>{fmt(q.shippingPrice)}</span></div>{q.shippingEstimatedDays && <div><span className="text-gray-400 text-xs block">Prazo estimado</span><span>{q.shippingEstimatedDays} dias</span></div>}{q.deliveryAddress && <div className="col-span-2"><span className="text-gray-400 text-xs block">Endereço</span><span>{q.deliveryAddress}</span></div>}</div></section>
        <section className="bg-white rounded-lg border border-gray-200 p-3"><div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-pink-600" /><h2 className="font-semibold text-gray-800">Condições Comerciais</h2></div><div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-gray-400 text-xs block">Forma de pagamento</span><span>{PAYMENT_LABELS[q.paymentMethod ?? ""] ?? q.paymentMethod ?? ""}</span></div>{q.productionDeadline && <div><span className="text-gray-400 text-xs block">Prazo de produção</span><span>{q.productionDeadline} dias úteis</span></div>}{q.quotationValidity && <div><span className="text-gray-400 text-xs block">Validade</span><span>{q.quotationValidity} dias</span></div>}<div><span className="text-gray-400 text-xs block">Expira em</span><span>{fmtDate(q.expiresAt)}</span></div></div></section>
      </div>

      <section className="pt-2 text-[11px] text-gray-600 leading-snug space-y-0.5"><p><strong>Início da produção:</strong> após aprovação da arte, confirmação do pagamento e disponibilidade dos materiais.</p><p><strong>Arte e aprovação:</strong> o cliente é responsável pela conferência de textos, imagens, medidas, cores e demais informações presentes na arte. Alterações após a aprovação podem gerar novo prazo e/ou custos adicionais.</p><p><strong>Variação de cores:</strong> as cores visualizadas em tela podem variar em relação ao resultado final impresso devido às diferenças entre monitores, arquivos e processos de impressão.</p><p><strong>Aceite do orçamento:</strong> ao aprovar este orçamento, o cliente declara concordar com produtos, quantidades, especificações, valores, prazos e condições comerciais apresentados.</p>{q.commercialNotes && <div className="mt-2 rounded border border-pink-100 bg-pink-50/40 px-3 py-2 whitespace-pre-line text-gray-700"><strong>Observações / Termos personalizados:</strong><br />{q.commercialNotes}</div>}</section>

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
              aria-busy={convertToOrder.isPending}
            >
              Confirmar Conversão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEmailConfirm} onOpenChange={setShowEmailConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar orçamento por e-mail?</AlertDialogTitle>
            <AlertDialogDescription>
              O orçamento {q.quotationNumber} será enviado para {q.clientEmail}. O e-mail incluirá itens, total, validade e condições comerciais.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendEmail.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-pink-600 hover:bg-pink-700"
              disabled={sendEmail.isPending}
              onClick={() => sendEmail.mutate({ id: q.id })}
              aria-busy={sendEmail.isPending}
            >
              {sendEmail.isPending ? "Enviando..." : "Confirmar envio"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-pointer"
          onClick={() => setLightboxImg(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Prévia ampliada da imagem"
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-slate-700 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300" onClick={() => setLightboxImg(null)} aria-label="Fechar prévia da imagem">×</button>
            <img src={lightboxImg} alt="Arte" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}
