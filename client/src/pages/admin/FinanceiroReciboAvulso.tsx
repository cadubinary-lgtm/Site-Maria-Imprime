import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, ReceiptText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const PAYMENT_OPTIONS = [
  ["dinheiro", "Dinheiro"], ["pix", "Pix"], ["cartao_credito", "Cartão de crédito"],
  ["cartao_debito", "Cartão de débito"], ["transferencia", "Transferência"], ["boleto", "Boleto"],
  ["pagar_na_retirada", "Pagamento na retirada"], ["outro", "Outro"],
] as const;

type DraftItem = { id: number; description: string; quantity: number; unitPrice: number };
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const today = () => new Date().toISOString().slice(0, 10);

export default function FinanceiroReciboAvulso() {
  const [, setLocation] = useLocation();
  const [customerName, setCustomerName] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_OPTIONS)[number][0]>("pix");
  const [paidDate, setPaidDate] = useState(today);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ id: 1, description: "", quantity: 1, unitPrice: 0 }]);

  const subtotal = useMemo(() => items.reduce((total, item) => total + item.quantity * item.unitPrice, 0), [items]);
  const total = Math.max(0, subtotal - discount);
  const createReceipt = trpc.financeiro.criarReciboAvulso.useMutation({
    onSuccess: (data) => {
      toast.success("Recibo avulso emitido", { description: `${data.receiptNumber} foi criado com sucesso.`, position: "top-right" });
      setLocation(`/admin/financeiro/recibos/avulso/${data.receiptId}/imprimir`);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateItem = (id: number, patch: Partial<DraftItem>) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  const addItem = () => setItems((current) => [...current, { id: Date.now(), description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (id: number) => setItems((current) => current.length === 1 ? current : current.filter((item) => item.id !== id));

  const submit = () => {
    if (!customerName.trim()) return toast.error("Informe o nome do cliente.");
    if (items.some((item) => !item.description.trim() || item.quantity <= 0)) return toast.error("Preencha a descrição e a quantidade de todos os itens.");
    if (subtotal <= 0) return toast.error("Informe ao menos um valor de item maior que zero.");
    if (discount > subtotal) return toast.error("O desconto não pode ser maior que o subtotal.");
    createReceipt.mutate({
      customerName: customerName.trim(), customerDocument: customerDocument.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined, customerPhone: customerPhone.trim() || undefined,
      paymentMethod, paidAt: new Date(`${paidDate}T12:00:00`).getTime(), discount,
      notes: notes.trim() || undefined,
      items: items.map(({ description, quantity, unitPrice }) => ({ description: description.trim(), quantity, unitPrice })),
    });
  };

  return <AdminLayout><div className="mx-auto max-w-6xl space-y-6 p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900"><ReceiptText className="h-6 w-6 text-pink-600" aria-hidden="true" />Criar recibo avulso</h1><p className="mt-1 text-sm text-gray-500">Emita um recibo independente, sem pedido ou ordem de serviço vinculados.</p></div>
      <Button type="button" variant="outline" onClick={() => setLocation("/admin/financeiro/recibos")} className="border-pink-200 text-pink-700 hover:bg-pink-50"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Voltar aos recibos</Button>
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="border-0 shadow-sm"><CardHeader className="border-b pb-4"><CardTitle className="text-base">Dados do cliente</CardTitle></CardHeader><CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-gray-700">Nome ou razão social *</span><Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Nome completo do cliente" autoFocus /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-gray-700">CPF ou CNPJ</span><Input value={customerDocument} onChange={(event) => setCustomerDocument(event.target.value)} placeholder="Opcional" /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-gray-700">WhatsApp / telefone</span><Input value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="(00) 00000-0000" /></label>
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-gray-700">E-mail</span><Input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="cliente@exemplo.com" /></label>
        </CardContent></Card>

        <Card className="border-0 shadow-sm"><CardHeader className="flex flex-row items-center justify-between border-b pb-4"><div><CardTitle className="text-base">Itens do recibo</CardTitle><p className="mt-1 text-xs text-gray-500">Descreva os produtos ou serviços recebidos.</p></div><Button type="button" variant="outline" size="sm" onClick={addItem} className="border-pink-200 text-pink-700 hover:bg-pink-50"><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Novo item</Button></CardHeader><CardContent className="space-y-4 pt-5">
          {items.map((item, index) => <div key={item.id} className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 md:grid-cols-[minmax(0,1fr)_110px_140px_42px] md:items-end">
            <label className="space-y-1.5"><span className="text-xs font-medium uppercase tracking-wide text-gray-500">Item {index + 1}</span><Input value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} placeholder="Ex.: Serviço de impressão digital" /></label>
            <label className="space-y-1.5"><span className="text-xs font-medium uppercase tracking-wide text-gray-500">Quantidade</span><Input type="number" min="1" step="1" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Math.max(1, Number(event.target.value) || 1) })} /></label>
            <label className="space-y-1.5"><span className="text-xs font-medium uppercase tracking-wide text-gray-500">Valor unitário</span><Input type="number" min="0" step="0.01" value={item.unitPrice || ""} onChange={(event) => updateItem(item.id, { unitPrice: Math.max(0, Number(event.target.value) || 0) })} placeholder="0,00" /></label>
            <Button type="button" variant="outline" size="icon" disabled={items.length === 1} onClick={() => removeItem(item.id)} className="border-red-200 text-red-600 hover:bg-red-50" aria-label={`Remover item ${index + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
            <div className="md:col-span-4 text-right text-xs text-gray-500">Subtotal do item: <strong className="text-gray-800">{formatCurrency(item.quantity * item.unitPrice)}</strong></div>
          </div>)}
        </CardContent></Card>

        <Card className="border-0 shadow-sm"><CardHeader className="border-b pb-4"><CardTitle className="text-base">Pagamento e observações</CardTitle></CardHeader><CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <label className="space-y-1.5"><span className="text-sm font-medium text-gray-700">Forma de pagamento *</span><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50">{PAYMENT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-gray-700">Data do recebimento *</span><Input type="date" value={paidDate} onChange={(event) => setPaidDate(event.target.value)} /></label>
          <label className="space-y-1.5"><span className="text-sm font-medium text-gray-700">Desconto (R$)</span><Input type="number" min="0" max={subtotal} step="0.01" value={discount || ""} onChange={(event) => setDiscount(Math.max(0, Number(event.target.value) || 0))} placeholder="0,00" /></label>
          <label className="space-y-1.5 sm:col-span-2"><span className="text-sm font-medium text-gray-700">Observações</span><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Informações complementares que devem constar no recibo." rows={4} /></label>
        </CardContent></Card>
      </div>

      <aside className="h-fit rounded-2xl border border-pink-100 bg-pink-50/70 p-5 shadow-sm lg:sticky lg:top-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-700">Resumo do recibo</p><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-gray-600">Subtotal</dt><dd className="font-medium text-gray-900">{formatCurrency(subtotal)}</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-600">Desconto</dt><dd className="font-medium text-gray-900">− {formatCurrency(discount)}</dd></div><div className="border-t border-pink-200 pt-3"><div className="flex justify-between gap-3"><dt className="font-bold text-gray-900">Total recebido</dt><dd className="text-xl font-black text-pink-700">{formatCurrency(total)}</dd></div></div></dl><Button type="button" className="mt-6 w-full bg-pink-600 hover:bg-pink-700" disabled={createReceipt.isPending || total <= 0} onClick={submit}>{createReceipt.isPending ? "Emitindo recibo..." : "Emitir recibo avulso"}</Button><p className="mt-3 text-center text-xs leading-5 text-gray-500">O recibo será salvo como documento independente e não altera pedidos, ordens de serviço ou contas existentes.</p></aside>
    </div>
  </div></AdminLayout>;
}
