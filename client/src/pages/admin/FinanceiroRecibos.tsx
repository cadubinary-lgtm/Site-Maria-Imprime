import { useState } from "react";
import { useLocation } from "wouter";
import { Download, Mail, Plus, Printer, ReceiptText, Search, Trash2, RotateCcw } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { exportReceiptPDF } from "@/lib/export-receipt-pdf";

const paymentLabels: Record<string, string> = {
  dinheiro: "Dinheiro", pix: "Pix", cartao_credito: "Cartão de crédito", cartao_debito: "Cartão de débito", transferencia: "Transferência", boleto: "Boleto", pagar_na_retirada: "Pagamento na retirada", outro: "Outro",
};

const formatCurrency = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
const formatDate = (value?: number | null) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

type ContactDialogState = { open: boolean; channel: "whatsapp" | "email"; receipt: any | null };
type ReceiptTrashTarget = { id: number; type: "pedido" | "avulso"; number: string };

export default function FinanceiroRecibos() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [contactDialog, setContactDialog] = useState<ContactDialogState>({ open: false, channel: "whatsapp", receipt: null });
  const [standaloneContactDialog, setStandaloneContactDialog] = useState<ContactDialogState>({ open: false, channel: "whatsapp", receipt: null });
  const [contact, setContact] = useState("");
  const [standaloneContact, setStandaloneContact] = useState("");
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [receiptToTrash, setReceiptToTrash] = useState<ReceiptTrashTarget | null>(null);
  const [receiptToPermanentlyDelete, setReceiptToPermanentlyDelete] = useState<any | null>(null);
  const { company } = useCompanySettings();
  const { adminUser } = useAdminAuth();
  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.financeiro.getRecibos.useQuery({ page, limit: 20, search: search || undefined });
  const { data: standaloneData, isLoading: standaloneLoading, refetch: refetchStandalone } = trpc.financeiro.getRecibosAvulsos.useQuery({ page: 1, limit: 20, search: search || undefined });
  const { data: trashedReceipts = [], refetch: refetchTrash } = trpc.financeiro.getRecibosNaLixeira.useQuery(undefined, { enabled: showTrash });
  const canPermanentlyDelete = adminUser?.role === "superadmin";

  const refreshReceiptLists = async () => {
    await Promise.all([refetch(), refetchStandalone(), refetchTrash()]);
  };

  const prepareWhatsApp = trpc.financeiro.prepareReceiptWhatsApp.useMutation({
    onSuccess: (result, variables) => {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      toast.success("Recibo preparado no WhatsApp", { description: "Revise a mensagem e envie-a ao cliente.", position: "top-right", duration: 3500, id: `receipt-whatsapp-${variables.receiptId}` });
      setContactDialog({ open: false, channel: "whatsapp", receipt: null });
      setContact("");
      refetch();
    },
    onError: (error) => toast.error(error.message, { position: "top-right" }),
  });
  const sendEmail = trpc.financeiro.sendReceiptEmail.useMutation({
    onSuccess: (result, variables) => {
      toast.success("Recibo enviado por e-mail", { description: `Enviado para ${result.recipientEmail}.`, position: "top-right", duration: 3500, id: `receipt-email-${variables.receiptId}` });
      setContactDialog({ open: false, channel: "whatsapp", receipt: null });
      setContact("");
      refetch();
    },
    onError: (error) => toast.error(error.message, { position: "top-right" }),
  });
  const prepareStandaloneWhatsApp = trpc.financeiro.prepareReciboAvulsoWhatsApp.useMutation({
    onSuccess: (result, variables) => {
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      toast.success("Recibo preparado no WhatsApp", { description: "Revise a mensagem e envie-a ao cliente.", position: "top-right", duration: 3500, id: `standalone-receipt-whatsapp-${variables.receiptId}` });
      setStandaloneContactDialog({ open: false, channel: "whatsapp", receipt: null });
      setStandaloneContact("");
    },
    onError: (error) => toast.error(error.message, { position: "top-right" }),
  });
  const sendStandaloneEmail = trpc.financeiro.sendReciboAvulsoEmail.useMutation({
    onSuccess: (result, variables) => {
      toast.success("Recibo enviado por e-mail", { description: `Enviado para ${result.recipientEmail}.`, position: "top-right", duration: 3500, id: `standalone-receipt-email-${variables.receiptId}` });
      setStandaloneContactDialog({ open: false, channel: "whatsapp", receipt: null });
      setStandaloneContact("");
    },
    onError: (error) => toast.error(error.message, { position: "top-right" }),
  });
  const moveReceiptToTrash = trpc.financeiro.moverReciboParaLixeira.useMutation({
    onSuccess: async (result) => {
      setReceiptToTrash(null);
      setShowTrash(true);
      await refreshReceiptLists();
      toast.success("Recibo movido para a lixeira", { description: `${result.receiptNumber} poderá ser restaurado enquanto permanecer na lixeira.`, position: "top-right", duration: 3500, id: `receipt-trash-${result.receiptType}-${result.receiptNumber}` });
    },
    onError: (error) => toast.error(error.message, { position: "top-right" }),
  });
  const restoreReceipt = trpc.financeiro.restaurarReciboDaLixeira.useMutation({
    onSuccess: async (result) => {
      await refreshReceiptLists();
      toast.success("Recibo restaurado", { description: `${result.receiptNumber} voltou para a lista ativa.`, position: "top-right", duration: 3500, id: `receipt-restore-${result.receiptType}-${result.receiptNumber}` });
    },
    onError: (error) => toast.error(error.message, { position: "top-right" }),
  });
  const permanentlyDeleteReceipt = trpc.financeiro.excluirReciboPermanentemente.useMutation({
    onSuccess: async () => {
      const receiptNumber = receiptToPermanentlyDelete?.receiptNumber;
      setReceiptToPermanentlyDelete(null);
      await refreshReceiptLists();
      toast.success("Recibo excluído permanentemente", { description: receiptNumber ? `${receiptNumber} foi removido da lixeira.` : undefined, position: "top-right", duration: 3500, id: `receipt-permanent-delete-${receiptNumber}` });
    },
    onError: (error) => toast.error(error.message, { position: "top-right" }),
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

  const openStandaloneContact = (receipt: any, channel: "whatsapp" | "email") => {
    if (receipt.status === "cancelado") return;
    const defaultContact = channel === "whatsapp" ? String(receipt.customerPhone || "").replace(/\D/g, "") : receipt.customerEmail || "";
    if (channel === "whatsapp" ? defaultContact.length >= 10 : Boolean(defaultContact)) {
      if (channel === "whatsapp") prepareStandaloneWhatsApp.mutate({ receiptId: receipt.id, phone: defaultContact });
      else sendStandaloneEmail.mutate({ receiptId: receipt.id, email: defaultContact });
      return;
    }
    setStandaloneContact("");
    setStandaloneContactDialog({ open: true, channel, receipt });
  };

  const downloadReceiptPdf = async (receiptId: number, standalone = false) => {
    setDownloadingReceiptId(receiptId);
    try {
      const receiptData: any = standalone
        ? await utils.financeiro.getReciboAvulso.fetch({ receiptId })
        : await utils.financeiro.getRecibo.fetch({ receiptId });
      await exportReceiptPDF({
        ...receiptData.receipt,
        orderNumber: standalone ? null : receiptData.receipt.orderNumber,
        items: standalone
          ? receiptData.items.map((item: any) => ({ id: item.id, productName: item.description, quantity: item.quantity, priceAtOrder: item.unitPrice }))
          : receiptData.items,
        companyName: company.tradeName || "Maria Imprime",
        legalName: company.legalName,
        cnpj: company.cnpj || "34.528.399/0001-08",
        commercialPhone: company.commercialPhone,
        supportEmail: company.supportEmail,
      });
      toast.success("PDF do recibo baixado", { position: "top-right", duration: 3500, id: `receipt-list-pdf-${standalone ? "standalone-" : ""}${receiptId}` });
    } catch (error) {
      console.error("Erro ao gerar PDF do recibo", error);
      toast.error("Não foi possível gerar o PDF do recibo.", { position: "top-right", duration: 3500, id: `receipt-list-pdf-${standalone ? "standalone-" : ""}${receiptId}` });
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="financeiro-recibos space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900"><ReceiptText className="h-6 w-6 text-pink-600" aria-hidden="true" />Recibos</h1>
            <p className="mt-1 text-sm text-gray-500">Comprovantes gerados automaticamente após a confirmação de pagamentos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setShowTrash((current) => !current)} className="border-pink-200 text-pink-700 hover:bg-pink-50"><Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />{showTrash ? "Fechar lixeira" : "Lixeira"}</Button>
            <Button type="button" variant="outline" onClick={() => { refetch(); refetchStandalone(); if (showTrash) refetchTrash(); }} className="border-pink-200 text-pink-700 hover:bg-pink-50">Atualizar</Button>
            <Button type="button" onClick={() => setLocation("/admin/financeiro/recibos/avulso/novo")} className="bg-pink-600 hover:bg-pink-700"><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Criar recibo</Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex gap-2"><Input aria-label="Buscar recibos" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (setSearch(searchInput), setPage(1))} placeholder="Buscar por recibo, pedido ou cliente..." /><Button type="button" onClick={() => { setSearch(searchInput); setPage(1); }} className="bg-pink-600 hover:bg-pink-700" aria-label="Aplicar busca de recibos"><Search className="h-4 w-4" aria-hidden="true" /></Button></div></CardContent></Card>

        <ReceiptTableCard title={data ? `${data.total} recibo(s) emitido(s)` : "Carregando recibos..."} isLoading={isLoading} emptyText="Nenhum recibo emitido ainda." emptyDescription="Os recibos são criados ao confirmar um pagamento em Contas a Receber." rows={data?.data ?? []} receiptType="pedido" downloadingReceiptId={downloadingReceiptId} onPrint={(id: number) => setLocation(`/admin/financeiro/recibos/${id}/imprimir`)} onDownload={(id: number) => downloadReceiptPdf(id)} onWhatsApp={openContact} onEmail={openContact} onTrash={(receipt: any) => setReceiptToTrash({ id: receipt.id, type: "pedido", number: receipt.receiptNumber })} />

        {data && data.totalPages > 1 && <div className="flex items-center justify-between border-t p-4"><span className="text-sm text-gray-500">Página {page} de {data.totalPages}</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button type="button" variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</Button></div></div>}

        <ReceiptTableCard title={standaloneData ? `${standaloneData.total} recibo(s) avulso(s) emitido(s)` : "Carregando recibos avulsos..."} isLoading={standaloneLoading} emptyText="Nenhum recibo avulso emitido ainda." emptyDescription="Use Criar recibo para emitir um documento sem pedido vinculado." rows={standaloneData?.data ?? []} receiptType="avulso" downloadingReceiptId={downloadingReceiptId} onPrint={(id: number) => setLocation(`/admin/financeiro/recibos/avulso/${id}/imprimir`)} onDownload={(id: number) => downloadReceiptPdf(id, true)} onWhatsApp={openStandaloneContact} onEmail={openStandaloneContact} onTrash={(receipt: any) => setReceiptToTrash({ id: receipt.id, type: "avulso", number: receipt.receiptNumber })} />

        {showTrash && <TrashCard receipts={trashedReceipts} canPermanentlyDelete={canPermanentlyDelete} isRestoring={restoreReceipt.isPending} onRestore={(trashId: number) => restoreReceipt.mutate({ trashId })} onPermanentlyDelete={setReceiptToPermanentlyDelete} />}

        <AlertDialog open={Boolean(receiptToTrash)} onOpenChange={(open) => !open && setReceiptToTrash(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Mover recibo para a lixeira?</AlertDialogTitle><AlertDialogDescription>O recibo {receiptToTrash?.number} deixará a lista ativa, mas poderá ser restaurado depois. O pedido e os lançamentos financeiros não serão alterados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={moveReceiptToTrash.isPending} onClick={() => { if (receiptToTrash) moveReceiptToTrash.mutate({ receiptId: receiptToTrash.id, receiptType: receiptToTrash.type }); }}>{moveReceiptToTrash.isPending ? "Movendo..." : "Mover para lixeira"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        <AlertDialog open={Boolean(receiptToPermanentlyDelete)} onOpenChange={(open) => !open && setReceiptToPermanentlyDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir recibo permanentemente?</AlertDialogTitle><AlertDialogDescription>O recibo {receiptToPermanentlyDelete?.receiptNumber} será removido da lixeira e não poderá ser restaurado. O pedido e o lançamento financeiro permanecerão preservados.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={permanentlyDeleteReceipt.isPending} onClick={() => { if (receiptToPermanentlyDelete) permanentlyDeleteReceipt.mutate({ trashId: receiptToPermanentlyDelete.id, confirmation: true }); }}>{permanentlyDeleteReceipt.isPending ? "Excluindo..." : "Excluir permanentemente"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

        <ContactDialog state={contactDialog} value={contact} onValueChange={setContact} onClose={() => setContactDialog({ open: false, channel: "whatsapp", receipt: null })} onSubmit={() => { if (!contactDialog.receipt) return; if (contactDialog.channel === "email") sendEmail.mutate({ receiptId: contactDialog.receipt.id, email: contact.trim() }); else prepareWhatsApp.mutate({ receiptId: contactDialog.receipt.id, phone: contact }); }} isPending={prepareWhatsApp.isPending || sendEmail.isPending} />
        <ContactDialog state={standaloneContactDialog} value={standaloneContact} onValueChange={setStandaloneContact} onClose={() => setStandaloneContactDialog({ open: false, channel: "whatsapp", receipt: null })} onSubmit={() => { if (!standaloneContactDialog.receipt) return; if (standaloneContactDialog.channel === "email") sendStandaloneEmail.mutate({ receiptId: standaloneContactDialog.receipt.id, email: standaloneContact.trim() }); else prepareStandaloneWhatsApp.mutate({ receiptId: standaloneContactDialog.receipt.id, phone: standaloneContact }); }} isPending={prepareStandaloneWhatsApp.isPending || sendStandaloneEmail.isPending} />
      </div>
    </AdminLayout>
  );
}

function ReceiptTableCard({ title, isLoading, emptyText, emptyDescription, rows, receiptType, downloadingReceiptId, onPrint, onDownload, onWhatsApp, onEmail, onTrash }: any) {
  const isStandalone = receiptType === "avulso";
  return <Card className="border-0 shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="p-0">{isLoading ? <div className="p-8 text-center text-gray-400">Carregando recibos...</div> : rows.length === 0 ? <div className="p-8 text-center text-gray-400"><ReceiptText className="mx-auto mb-2 h-10 w-10 opacity-30" aria-hidden="true" /><p>{emptyText}</p><p className="mt-1 text-xs">{emptyDescription}</p></div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-b bg-gray-50"><tr><th className="p-3 text-left font-medium text-gray-600">Recibo</th>{!isStandalone && <th className="p-3 text-left font-medium text-gray-600">Pedido</th>}<th className="p-3 text-left font-medium text-gray-600">Cliente</th><th className="p-3 text-left font-medium text-gray-600">Pagamento</th><th className="p-3 text-right font-medium text-gray-600">Valor</th><th className="p-3 text-left font-medium text-gray-600">Recebido em</th><th className="p-3 text-center font-medium text-gray-600">Ações</th></tr></thead><tbody className="divide-y divide-gray-100">{rows.map((receipt: any) => { const isCancelled = receipt.status === "cancelado"; return <tr key={receipt.id} className="transition-colors hover:bg-gray-50"><td className="p-3 font-mono text-xs font-semibold text-pink-600">{receipt.receiptNumber}{isCancelled && <Badge variant="outline" className="ml-2 border-red-200 text-[10px] text-red-600">Cancelado</Badge>}</td>{!isStandalone && <td className="p-3 font-mono text-xs">#{receipt.orderNumber}</td>}<td className="p-3 font-medium">{receipt.customerName}</td><td className="p-3"><Badge variant="outline" className="text-xs">{paymentLabels[receipt.paymentMethod] || receipt.paymentMethod}</Badge></td><td className="p-3 text-right font-semibold text-green-700">{formatCurrency(receipt.amount)}</td><td className="whitespace-nowrap p-3 text-xs text-gray-500">{formatDate(receipt.paidAt)}</td><td className="p-3"><div className="flex justify-center gap-1"><Button type="button" size="sm" variant="outline" className="h-8 border-pink-200 px-2 text-pink-700 hover:bg-pink-50" disabled={isCancelled} onClick={() => onPrint(receipt.id)} aria-label={`Imprimir recibo ${receipt.receiptNumber}`}><Printer className="h-3.5 w-3.5" aria-hidden="true" /></Button><Button type="button" size="sm" variant="outline" className="h-8 border-pink-200 px-2 text-pink-700 hover:bg-pink-50" disabled={isCancelled || downloadingReceiptId === receipt.id} onClick={() => onDownload(receipt.id)} aria-label={`Baixar recibo ${receipt.receiptNumber} em PDF`}><Download className="h-3.5 w-3.5" aria-hidden="true" /></Button><Button type="button" size="sm" variant="outline" className="h-8 border-green-200 px-2 text-green-700 hover:bg-green-50" disabled={isCancelled} onClick={() => onWhatsApp(receipt, "whatsapp")} aria-label={`Preparar recibo ${receipt.receiptNumber} no WhatsApp`}><FaWhatsapp className="h-4 w-4" aria-hidden="true" /></Button><Button type="button" size="sm" variant="outline" className="h-8 border-pink-200 px-2 text-pink-700 hover:bg-pink-50" disabled={isCancelled} onClick={() => onEmail(receipt, "email")} aria-label={`Enviar recibo ${receipt.receiptNumber} por e-mail`}><Mail className="h-3.5 w-3.5" aria-hidden="true" /></Button><Button type="button" size="sm" variant="outline" className="h-8 border-red-200 px-2 text-red-600 hover:bg-red-50" onClick={() => onTrash(receipt)} aria-label={`Mover recibo ${receipt.receiptNumber} para a lixeira`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button></div></td></tr>; })}</tbody></table></div>}</CardContent></Card>;
}

function TrashCard({ receipts, canPermanentlyDelete, isRestoring, onRestore, onPermanentlyDelete }: any) {
  return <Card className="border border-red-100 shadow-sm"><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="flex items-center gap-2 text-base text-red-700"><Trash2 className="h-4 w-4" aria-hidden="true" />Lixeira de Recibos</CardTitle><span className="text-xs text-gray-500">{receipts.length} recibo(s)</span></CardHeader><CardContent className="p-0">{receipts.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">Nenhum recibo na lixeira.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-red-50/50"><tr><th className="p-3 text-left font-medium text-gray-600">Recibo</th><th className="p-3 text-left font-medium text-gray-600">Tipo</th><th className="p-3 text-left font-medium text-gray-600">Cliente</th><th className="p-3 text-right font-medium text-gray-600">Valor</th><th className="p-3 text-left font-medium text-gray-600">Excluído em</th><th className="p-3 text-center font-medium text-gray-600">Ações</th></tr></thead><tbody className="divide-y divide-gray-100">{receipts.map((receipt: any) => <tr key={receipt.id}><td className="p-3 font-mono text-xs font-semibold text-pink-600">{receipt.receiptNumber}</td><td className="p-3"><Badge variant="outline">{receipt.receiptType === "pedido" ? "Com pedido" : "Avulso"}</Badge></td><td className="p-3">{receipt.customerName}</td><td className="p-3 text-right font-semibold">{formatCurrency(receipt.amount)}</td><td className="p-3 text-xs text-gray-500">{formatDate(receipt.deletedAt)}</td><td className="p-3"><div className="flex justify-center gap-1"><Button type="button" size="sm" variant="outline" className="h-8 border-green-200 px-2 text-green-700 hover:bg-green-50" disabled={isRestoring} onClick={() => onRestore(receipt.id)} aria-label={`Restaurar recibo ${receipt.receiptNumber}`}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /></Button>{canPermanentlyDelete && <Button type="button" size="sm" variant="outline" className="h-8 border-red-200 px-2 text-red-600 hover:bg-red-50" onClick={() => onPermanentlyDelete(receipt)} aria-label={`Excluir permanentemente recibo ${receipt.receiptNumber}`}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button>}</div></td></tr>)}</tbody></table></div>}</CardContent></Card>;
}

function ContactDialog({ state, value, onValueChange, onClose, onSubmit, isPending }: { state: ContactDialogState; value: string; onValueChange: (value: string) => void; onClose: () => void; onSubmit: () => void; isPending: boolean }) {
  const isEmail = state.channel === "email";
  return <Dialog open={state.open} onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>{isEmail ? "Enviar recibo por e-mail" : "Preparar recibo no WhatsApp"}</DialogTitle></DialogHeader><div className="space-y-2"><label htmlFor={`${isEmail ? "email" : "whatsapp"}-receipt-recipient`} className="text-sm font-medium text-gray-700">{isEmail ? "E-mail do cliente" : "WhatsApp do cliente"}</label><Input id={`${isEmail ? "email" : "whatsapp"}-receipt-recipient`} type={isEmail ? "email" : "tel"} value={value} onChange={(event) => onValueChange(isEmail ? event.target.value : event.target.value.replace(/\D/g, ""))} placeholder={isEmail ? "cliente@exemplo.com" : "Ex.: 11999999999"} /></div><DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="button" disabled={!value.trim() || isPending} className={isEmail ? "bg-pink-600 hover:bg-pink-700" : "bg-green-600 hover:bg-green-700"} onClick={onSubmit}>{isEmail ? "Enviar e-mail" : "Abrir WhatsApp"}</Button></DialogFooter></DialogContent></Dialog>;
}
