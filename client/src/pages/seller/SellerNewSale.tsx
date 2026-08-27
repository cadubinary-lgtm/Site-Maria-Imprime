import SellerLayout from "@/components/seller/SellerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type SaleItem = { productId: number | null; productName: string; quantity: number; unitPrice: number; totalPrice: number; specifications: string };
const currency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const initialItem = (): SaleItem => ({ productId: null, productName: "", quantity: 1, unitPrice: 0, totalPrice: 0, specifications: "{}" });

export default function SellerNewSale() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: clients } = trpc.sellers.seller.clients.useQuery();
  const { data: products } = trpc.products.getAll.useQuery();
  const createOrder = trpc.sellers.seller.createOrder.useMutation();
  const createQuotation = trpc.sellers.seller.createQuotation.useMutation();
  const [kind, setKind] = useState<"pedido" | "orcamento">("pedido");
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<SaleItem[]>([initialItem()]);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [notes, setNotes] = useState("");
  const subtotal = useMemo(() => items.reduce((total, item) => total + item.totalPrice, 0), [items]);
  const validDiscount = Math.max(0, Math.min(subtotal, discount));
  const total = Math.max(0, subtotal - validDiscount + Math.max(0, shipping));
  const updateItem = (index: number, patch: Partial<SaleItem>) => setItems(current => current.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    const next = { ...item, ...patch };
    if (patch.quantity !== undefined || patch.unitPrice !== undefined) next.totalPrice = Number(next.quantity) * Number(next.unitPrice);
    return next;
  }));
  const selectProduct = (index: number, productId: string) => {
    const product = products?.find((item: any) => String(item.id) === productId);
    if (!product) return;
    updateItem(index, { productId: Number(product.id), productName: product.name, unitPrice: Number(product.pixPrice ?? product.price ?? 0), quantity: items[index].quantity });
  };
  const submit = async () => {
    if (!clientId) { toast.error("Selecione o cliente antes de continuar."); return; }
    if (items.some(item => !item.productName.trim() || item.quantity <= 0)) { toast.error("Complete os itens da venda antes de salvar."); return; }
    const payloadItems = items.map(item => ({ ...item, totalPrice: Number(item.totalPrice), unitPrice: Number(item.unitPrice), productImage: undefined, artFileUrl: undefined, artFileKey: undefined }));
    try {
      if (kind === "pedido") {
        const result = await createOrder.mutateAsync({ clientId: Number(clientId), items: payloadItems, discountAmount: validDiscount, shippingPrice: Math.max(0, shipping), paymentMethod, notes: notes || undefined });
        await Promise.all([utils.sellers.seller.orders.invalidate(), utils.sellers.seller.summary.invalidate(), utils.sellers.seller.commissions.invalidate()]);
        toast.success("Pedido registrado", { description: `${result.orderNumber} foi incluído na sua carteira.`, position: "top-right", duration: 3500, id: `seller-order-${result.orderId}` });
        navigate("/vendedor/pedidos");
      } else {
        const result = await createQuotation.mutateAsync({ clientId: Number(clientId), items: payloadItems, discountType: "fixo", discountValue: validDiscount, shippingPrice: Math.max(0, shipping), paymentMethod, commercialNotes: notes || undefined, saveAsDraft: false });
        await utils.sellers.seller.quotations.invalidate();
        toast.success("Orçamento emitido", { description: `${result.quotationNumber} foi incluído na sua carteira.`, position: "top-right", duration: 3500, id: `seller-quotation-${result.quotationId}` });
        navigate("/vendedor/orcamentos");
      }
    } catch (error: any) { toast.error("Não foi possível registrar a venda", { description: error?.message || "Tente novamente." }); }
  };
  const isSaving = createOrder.isPending || createQuotation.isPending;
  return <SellerLayout title="Nova venda" description="Crie um pedido ou orçamento vinculado automaticamente à sua carteira.">
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-6"><Card><CardHeader><CardTitle>Dados comerciais</CardTitle><CardDescription>O pedido será associado ao seu perfil. A comissão considera produtos menos descontos e não inclui frete.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Tipo de registro</Label><Select value={kind} onValueChange={(value: "pedido" | "orcamento") => setKind(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pedido">Pedido</SelectItem><SelectItem value="orcamento">Orçamento</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Cliente</Label><Select value={clientId} onValueChange={setClientId}><SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger><SelectContent>{clients?.map((client: any) => <SelectItem key={client.id} value={String(client.id)}>{client.name}{client.email ? ` · ${client.email}` : ""}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Pagamento previsto</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="cartao_credito">Cartão de crédito</SelectItem><SelectItem value="cartao_debito">Cartão de débito</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="transferencia">Transferência</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="shipping">Frete</Label><Input id="shipping" type="number" min="0" step="0.01" value={shipping} onChange={event => setShipping(Number(event.target.value))} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Observações</Label><Textarea id="notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Informações comerciais para o pedido ou orçamento" /></div></CardContent></Card>
      <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Itens</CardTitle><CardDescription>Selecione produtos cadastrados ou informe um item personalizado.</CardDescription></div><Button type="button" variant="outline" onClick={() => setItems(current => [...current, initialItem()])}><Plus className="mr-2 h-4 w-4" />Adicionar</Button></CardHeader><CardContent className="space-y-4">{items.map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-4"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_96px_130px_40px]"><div className="space-y-2"><Label>Produto</Label><Select value={item.productId ? String(item.productId) : "custom"} onValueChange={value => value === "custom" ? updateItem(index, { productId: null, productName: "", unitPrice: 0, quantity: 1 }) : selectProduct(index, value)}><SelectTrigger><SelectValue placeholder="Produto ou item personalizado" /></SelectTrigger><SelectContent><SelectItem value="custom">Item personalizado</SelectItem>{products?.filter((product: any) => product.isActive !== false).map((product: any) => <SelectItem key={product.id} value={String(product.id)}>{product.name}</SelectItem>)}</SelectContent></Select>{!item.productId && <Input value={item.productName} onChange={event => updateItem(index, { productName: event.target.value })} placeholder="Nome do item personalizado" />}</div><div className="space-y-2"><Label>Qtd.</Label><Input type="number" min="1" value={item.quantity} onChange={event => updateItem(index, { quantity: Math.max(1, Number(event.target.value)) })} /></div><div className="space-y-2"><Label>Valor unit.</Label><Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={event => updateItem(index, { unitPrice: Math.max(0, Number(event.target.value)) })} /></div><div className="flex items-end"><Button variant="ghost" size="icon" type="button" disabled={items.length === 1} onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remover item"><Trash2 className="h-4 w-4 text-red-600" /></Button></div></div><p className="mt-3 text-right text-sm font-medium text-slate-700">Total do item: {currency(item.totalPrice)}</p></div>)}</CardContent></Card></section>
      <aside><Card className="sticky top-24 border-slate-200 shadow-sm"><CardHeader><CardTitle>Resumo</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal de produtos</span><span>{currency(subtotal)}</span></div><div className="space-y-2"><Label htmlFor="discount">Desconto comercial</Label><Input id="discount" type="number" min="0" max={subtotal} step="0.01" value={discount} onChange={event => setDiscount(Math.max(0, Number(event.target.value)))} /></div><div className="flex justify-between text-sm"><span className="text-slate-500">Frete</span><span>{currency(Math.max(0, shipping))}</span></div><div className="border-t pt-4"><div className="flex justify-between text-base font-bold"><span>Total</span><span>{currency(total)}</span></div><p className="mt-2 text-xs text-slate-500">A comissão será congelada sobre {currency(Math.max(0, subtotal - validDiscount))}, sem o frete.</p></div><Button className="w-full bg-pink-600 hover:bg-pink-700" disabled={isSaving} onClick={submit}>{isSaving ? "Salvando..." : kind === "pedido" ? "Registrar pedido" : "Emitir orçamento"}</Button></CardContent></Card></aside>
    </div>
  </SellerLayout>;
}
