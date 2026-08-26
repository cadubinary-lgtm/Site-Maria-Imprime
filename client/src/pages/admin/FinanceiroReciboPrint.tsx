import { useCallback, useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Download, FileText, Loader2, Mail, Printer, ReceiptText } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { exportReceiptPDF } from "@/lib/export-receipt-pdf";
import { getAdminMenuParentTarget } from "@/lib/adminNavigation";
import { toast } from "sonner";

const paymentLabels: Record<string, string> = { dinheiro: "Dinheiro", pix: "Pix", cartao_credito: "Cartão de crédito", cartao_debito: "Cartão de débito", transferencia: "Transferência", boleto: "Boleto", pagar_na_retirada: "Pagamento na retirada", outro: "Outro" };
const formatCurrency = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

export default function FinanceiroReciboPrint() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const returnTarget = getAdminMenuParentTarget(location);
  const receiptId = Number(params.id);
  const { company } = useCompanySettings();
  const [contactDialog, setContactDialog] = useState<{ open: boolean; channel: "whatsapp" | "email" }>({ open: false, channel: "whatsapp" });
  const [contact, setContact] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const { data, isLoading, error } = trpc.financeiro.getRecibo.useQuery({ receiptId }, { enabled: Number.isInteger(receiptId) && receiptId > 0 });
  const handlePrint = useCallback(() => window.print(), []);

  const prepareWhatsApp = trpc.financeiro.prepareReceiptWhatsApp.useMutation({
    onSuccess: (result) => {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      toast.success("Recibo preparado no WhatsApp", { description: "Revise a mensagem antes de enviar ao cliente.", position: "top-right" });
      setContactDialog({ open: false, channel: "whatsapp" });
      setContact("");
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const sendEmail = trpc.financeiro.sendReceiptEmail.useMutation({
    onSuccess: (result) => {
      toast.success("Recibo enviado por e-mail", { description: `Enviado para ${result.recipientEmail}.`, position: "top-right" });
      setContactDialog({ open: false, channel: "email" });
      setContact("");
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-pink-600" aria-label="Carregando recibo" /></div>;
  if (error || !data) return <div className="flex min-h-screen flex-col items-center justify-center gap-4"><p className="text-gray-600">Recibo não encontrado.</p><Button type="button" className="bg-pink-600 hover:bg-pink-700" onClick={() => setLocation(returnTarget.path)}>{returnTarget.label}</Button></div>;

  const { receipt, items } = data;
  const paidAt = new Date(receipt.paidAt).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
  const isSending = prepareWhatsApp.isPending || sendEmail.isPending;

  const openContact = (channel: "whatsapp" | "email") => {
    const defaultContact = channel === "whatsapp" ? String(receipt.customerPhone || "").replace(/\D/g, "") : receipt.customerEmail || "";
    if (channel === "whatsapp" ? defaultContact.length >= 10 : Boolean(defaultContact)) {
      if (channel === "whatsapp") prepareWhatsApp.mutate({ receiptId: receipt.id, phone: defaultContact });
      else sendEmail.mutate({ receiptId: receipt.id, email: defaultContact });
      return;
    }
    setContact("");
    setContactDialog({ open: true, channel });
  };

  const downloadReceiptPdf = async () => {
    setIsDownloading(true);
    try {
      await exportReceiptPDF({
        ...receipt,
        items,
        companyName: company.tradeName || "Maria Imprime",
        legalName: company.legalName,
        cnpj: company.cnpj || "34.528.399/0001-08",
        commercialPhone: company.commercialPhone,
        supportEmail: company.supportEmail,
      });
      toast.success("PDF do recibo baixado", { position: "top-right" });
    } catch (downloadError) {
      console.error("Erro ao gerar PDF do recibo", downloadError);
      toast.error("Não foi possível gerar o PDF do recibo.", { position: "top-right" });
    } finally {
      setIsDownloading(false);
    }
  };

  const actionButtonClass = "h-9 w-9 border-pink-200 p-0 text-pink-700 hover:bg-pink-50";
  return (
    <>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-4 py-3 shadow-sm">
        <Button type="button" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={() => setLocation(returnTarget.path)}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />{returnTarget.label}
        </Button>
        <div className="flex items-center gap-1" aria-label="Ações do recibo">
          <Button type="button" variant="outline" className={actionButtonClass} onClick={handlePrint} aria-label="Imprimir recibo" title="Imprimir recibo">
            <Printer className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" className={actionButtonClass} onClick={downloadReceiptPdf} disabled={isDownloading} aria-label="Baixar recibo em PDF" title="Baixar PDF">
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          </Button>
          <Button type="button" variant="outline" className="h-9 w-9 border-green-200 p-0 text-green-700 hover:bg-green-50" onClick={() => openContact("whatsapp")} disabled={isSending} aria-label="Preparar recibo no WhatsApp" title="WhatsApp">
            <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" className={actionButtonClass} onClick={() => openContact("email")} disabled={isSending} aria-label="Enviar recibo por e-mail" title="E-mail">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <main className="bg-gray-100 px-4 py-8 print:bg-white print:p-0">
        <article id="receipt-document" className="mx-auto w-full max-w-[794px] bg-white p-10 text-slate-800 shadow-xl print:max-w-none print:shadow-none">
          <header className="flex items-start justify-between border-b-2 border-pink-600 pb-6">
            <div>
              {company.printLogoUrl ? <img src={company.printLogoUrl} alt={`Logotipo ${company.tradeName}`} className="h-16 w-36 object-contain object-left" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-pink-600"><FileText className="h-7 w-7 text-white" aria-hidden="true" /></div>}
              <p className="mt-2 text-xs font-semibold text-slate-600">CNPJ: 34.528.399/0001-08</p>
            </div>
            <div className="text-right"><div className="flex items-center justify-end gap-2 text-pink-600"><ReceiptText className="h-5 w-5" aria-hidden="true" /><span className="text-sm font-bold tracking-[0.18em]">RECIBO</span></div><h1 className="mt-1 text-xl font-black text-slate-900">{receipt.receiptNumber}</h1><p className="mt-1 text-xs text-slate-500">Emitido em {new Date(receipt.issuedAt).toLocaleString("pt-BR")}</p></div>
          </header>
          <section className="mt-8 rounded-xl border border-pink-100 bg-pink-50/60 p-6"><p className="text-sm leading-7 text-slate-700">Recebemos de <strong className="text-slate-900">{receipt.customerName}</strong> a quantia de <strong className="text-lg text-pink-700">{formatCurrency(receipt.amount)}</strong>, referente ao pagamento do pedido <strong>#{receipt.orderNumber}</strong>.</p><dl className="mt-5 grid grid-cols-1 gap-4 border-t border-pink-100 pt-5 text-sm sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Forma de pagamento</dt><dd className="mt-1 font-semibold text-slate-800">{paymentLabels[receipt.paymentMethod] || receipt.paymentMethod}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Data do recebimento</dt><dd className="mt-1 font-semibold text-slate-800">{paidAt}</dd></div></dl></section>
          <section className="mt-8"><h2 className="border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-wide text-slate-700">Itens do pedido</h2><table className="mt-3 w-full text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="pb-2">Produto / serviço</th><th className="pb-2 text-center">Qtd.</th><th className="pb-2 text-right">Valor</th></tr></thead><tbody>{items.map((item: any) => <tr key={item.id} className="border-b border-slate-100"><td className="py-3 font-medium text-slate-800">{item.productName || "Produto personalizado"}</td><td className="py-3 text-center">{item.quantity}</td><td className="py-3 text-right">{formatCurrency(Number(item.priceAtOrder) * item.quantity)}</td></tr>)}</tbody><tfoot><tr><td colSpan={2} className="pt-4 text-right font-bold text-slate-700">Total recebido</td><td className="pt-4 text-right text-lg font-black text-pink-700">{formatCurrency(receipt.amount)}</td></tr></tfoot></table></section>
          <section className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-700">Observações da empresa</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-600"><li>Este recibo comprova o recebimento do valor informado.</li><li>Este documento não substitui a nota fiscal quando sua emissão for aplicável.</li><li>Em caso de divergência, entre em contato com {company.commercialPhone || company.supportEmail}.</li></ul></section>
          <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-500"><p className="font-semibold text-slate-700">{company.legalName || company.tradeName}</p><p className="mt-1">Documento emitido digitalmente pela Maria Imprime.</p><div className="mx-auto mt-14 max-w-xs border-t border-slate-400 pt-2 text-xs text-slate-500">Assinatura do responsável</div></footer>
        </article>
      </main>

      <Dialog open={contactDialog.open} onOpenChange={(open) => !open && setContactDialog({ open: false, channel: "whatsapp" })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{contactDialog.channel === "email" ? "Enviar recibo por e-mail" : "Preparar recibo no WhatsApp"}</DialogTitle></DialogHeader>
          <div className="space-y-2"><label htmlFor="receipt-contact" className="text-sm font-medium text-gray-700">{contactDialog.channel === "email" ? "E-mail do cliente" : "WhatsApp do cliente"}</label><Input id="receipt-contact" type={contactDialog.channel === "email" ? "email" : "tel"} value={contact} onChange={(event) => setContact(contactDialog.channel === "whatsapp" ? event.target.value.replace(/\D/g, "") : event.target.value)} placeholder={contactDialog.channel === "email" ? "cliente@exemplo.com" : "Ex.: 11999999999"} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setContactDialog({ open: false, channel: "whatsapp" })}>Cancelar</Button><Button type="button" disabled={!contact.trim() || isSending} className={contactDialog.channel === "email" ? "bg-pink-600 hover:bg-pink-700" : "bg-green-600 hover:bg-green-700"} onClick={() => { if (contactDialog.channel === "email") sendEmail.mutate({ receiptId: receipt.id, email: contact.trim() }); else prepareWhatsApp.mutate({ receiptId: receipt.id, phone: contact }); }}>{contactDialog.channel === "email" ? "Enviar e-mail" : "Abrir WhatsApp"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } #receipt-document { width: 210mm !important; min-height: 297mm; padding: 18mm !important; } @page { size: A4; margin: 0; } }`}</style>
    </>
  );
}
