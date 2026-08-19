import { useState } from "react";
import { useLocation } from "wouter";
import { Mail, Printer, ReceiptText, Search, Send } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro", pix: "Pix", cartao_credito: "Cartão de crédito", cartao_debito: "Cartão de débito", transferencia: "Transferência", boleto: "Boleto", pagar_na_retirada: "Pagamento na retirada", outro: "Outro",
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
const formatDate = (value: number) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function FinanceiroRecibos() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [contactDialog, setContactDialog] = useState<{ open: boolean; channel: "whatsapp" | "email"; receipt: any | null }>({ open: false, channel: "whatsapp", receipt: null });
  const [contact, setContact] = useState("");
  const { data, isLoading, refetch } = trpc.financeiro.getRecibos.useQuery({ page, limit: 20, search: search || undefined });

  const prepareWhatsApp = trpc.financeiro.prepareReceiptWhatsApp.useMutation({
    onSuccess: (data, variables) => {
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
      toast.success("Recibo preparado no WhatsApp", { description: "Revise a mensagem e envie-a ao cliente.", position: "top-right", duration: 3500, id: `receipt-whatsapp-${variables.receiptId}` });
      setContactDialog({ open: false, channel: "whatsapp", receipt: null });
      setContact("");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const sendEmail = trpc.financeiro.sendReceiptEmail.useMutation({
    onSuccess: (data, variables) => {
      toast.success("Recibo enviado por e-mail", { description: `Enviado para ${data.recipientEmail}.`, position: "top-right", duration: 3500, id: `receipt-email-${variables.receiptId}` });
      setContactDialog({ open: false, channel: "email", receipt: null });
      setContact("");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const openContact = (receipt: any, channel: "whatsapp" | "email") => {
    const defaultContact = channel === "whatsapp" ? String(receipt.customerPhone || "").replace(/\D/g, "") : receipt.customerEmail || "";
    if (channel === "whatsapp" ? defaultContact.length >= 10 : Boolean(defaultContact)) {
      if (channel === "whatsapp") prepareWhatsApp.mutate({ receiptId: receipt.id, phone: defaultContact });
      else sendEmail.mutate({ receiptId: receipt.id, email: defaultContact });
      return;
    }
    setContact("");
    setContactDialog({ open: true, channel, receipt });
  };

  return <AdminLayout><div className="space-y-6 p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900"><ReceiptText className="h-6 w-6 text-pink-600" aria-hidden="true" />Recibos</h1><p className="mt-1 text-sm text-gray-500">Comprovantes gerados automaticamente após a confirmação de pagamentos.</p></div>
      <Button type="button" variant="outline" onClick={() => refetch()} className="border-pink-200 text-pink-700 hover:bg-pink-50">Atualizar</Button>
    </div>
    <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex gap-2"><Input aria-label="Buscar recibos" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (setSearch(searchInput), setPage(1))} placeholder="Buscar por recibo, pedido ou cliente..." /><Button type="button" onClick={() => { setSearch(searchInput); setPage(1); }} className="bg-pink-600 hover:bg-pink-700" aria-label="Aplicar busca de recibos"><Search className="h-4 w-4" aria-hidden="true" /></Button></div></CardContent></Card>
    <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">{data ? `${data.total} recibo(s) emitido(s)` : "Carregando recibos..."}</CardTitle></CardHeader><CardContent className="p-0">
      {isLoading ? <div className="p-8 text-center text-gray-400">Carregando recibos...</div> : !data?.data.length ? <div className="p-10 text-center text-gray-400"><ReceiptText className="mx-auto mb-2 h-12 w-12 opacity-30" aria-hidden="true" /><p>Nenhum recibo emitido ainda.</p><p className="mt-1 text-xs">Os recibos serão criados ao confirmar um pagamento em Contas a Receber.</p></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-gray-50"><tr><th className="p-3 text-left font-medium text-gray-600">Recibo</th><th className="p-3 text-left font-medium text-gray-600">Pedido</th><th className="p-3 text-left font-medium text-gray-600">Cliente</th><th className="p-3 text-left font-medium text-gray-600">Pagamento</th><th className="p-3 text-right font-medium text-gray-600">Valor</th><th className="p-3 text-left font-medium text-gray-600">Recebido em</th><th className="p-3 text-center font-medium text-gray-600">Ações</th></tr></thead><tbody className="divide-y divide-gray-100">{data.data.map((receipt: any) => <tr key={receipt.id} className="transition-colors hover:bg-gray-50"><td className="p-3 font-mono text-xs font-semibold text-pink-600">{receipt.receiptNumber}</td><td className="p-3 font-mono text-xs">#{receipt.orderNumber}</td><td className="p-3 font-medium">{receipt.customerName}</td><td className="p-3"><Badge variant="outline" className="text-xs">{paymentLabels[receipt.paymentMethod] || receipt.paymentMethod}</Badge></td><td className="p-3 text-right font-semibold text-green-700">{formatCurrency(receipt.amount)}</td><td className="whitespace-nowrap p-3 text-xs text-gray-500">{formatDate(receipt.paidAt)}</td><td className="p-3"><div className="flex justify-center gap-1"><Button type="button" size="sm" variant="outline" className="h-8 border-pink-200 px-2 text-pink-700 hover:bg-pink-50" onClick={() => setLocation(`/admin/financeiro/recibos/${receipt.id}/imprimir`)} aria-label={`Imprimir recibo ${receipt.receiptNumber}`}><Printer className="h-3.5 w-3.5" aria-hidden="true" /></Button><Button type="button" size="sm" variant="outline" className="h-8 border-green-200 px-2 text-green-700 hover:bg-green-50" onClick={() => openContact(receipt, "whatsapp")} aria-label={`Preparar recibo ${receipt.receiptNumber} no WhatsApp`}><Send className="h-3.5 w-3.5" aria-hidden="true" /></Button><Button type="button" size="sm" variant="outline" className="h-8 border-pink-200 px-2 text-pink-700 hover:bg-pink-50" onClick={() => openContact(receipt, "email")} aria-label={`Enviar recibo ${receipt.receiptNumber} por e-mail`}><Mail className="h-3.5 w-3.5" aria-hidden="true" /></Button></div></td></tr>)}</tbody></table></div>}
      {data && data.totalPages > 1 && <div className="flex items-center justify-between border-t p-4"><span className="text-sm text-gray-500">Página {page} de {data.totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button type="button" variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div></div>}
    </CardContent></Card>
    <Dialog open={contactDialog.open} onOpenChange={(open) => !open && setContactDialog({ open: false, channel: "whatsapp", receipt: null })}><DialogContent><DialogHeader><DialogTitle>{contactDialog.channel === "email" ? "Enviar recibo por e-mail" : "Preparar recibo no WhatsApp"}</DialogTitle></DialogHeader><div className="space-y-2"><label htmlFor="receipt-recipient" className="text-sm font-medium text-gray-700">{contactDialog.channel === "email" ? "E-mail do cliente" : "WhatsApp do cliente"}</label><Input id="receipt-recipient" type={contactDialog.channel === "email" ? "email" : "tel"} value={contact} onChange={(event) => setContact(contactDialog.channel === "whatsapp" ? event.target.value.replace(/\D/g, "") : event.target.value)} placeholder={contactDialog.channel === "email" ? "cliente@exemplo.com" : "Ex.: 11999999999"} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setContactDialog({ open: false, channel: "whatsapp", receipt: null })}>Cancelar</Button><Button type="button" disabled={!contact.trim() || prepareWhatsApp.isPending || sendEmail.isPending} className={contactDialog.channel === "email" ? "bg-pink-600 hover:bg-pink-700" : "bg-green-600 hover:bg-green-700"} onClick={() => { if (!contactDialog.receipt) return; if (contactDialog.channel === "email") sendEmail.mutate({ receiptId: contactDialog.receipt.id, email: contact.trim() }); else prepareWhatsApp.mutate({ receiptId: contactDialog.receipt.id, phone: contact }); }}>{contactDialog.channel === "email" ? "Enviar e-mail" : "Abrir WhatsApp"}</Button></DialogFooter></DialogContent></Dialog>
  </div></AdminLayout>;
}
