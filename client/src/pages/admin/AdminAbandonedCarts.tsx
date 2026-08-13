import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Clock3, Eye, Loader2, Package, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatRemainingTime(expiresAt: Date | string) {
  const remainingMs = new Date(expiresAt).getTime() - Date.now();
  if (remainingMs <= 0) return "Aguardando limpeza automática";

  const totalHours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (totalHours < 24) return `Expira em ${totalHours}h`;
  return `Expira em ${Math.ceil(totalHours / 24)} dias`;
}

export default function AdminAbandonedCarts() {
  const [search, setSearch] = useState("");
  const [selectedCart, setSelectedCart] = useState<{ cartKey: string; userId: number | null; sessionId: string | null } | null>(null);
  const [cartToDelete, setCartToDelete] = useState<{ cartKey: string; userId: number | null; sessionId: string | null } | null>(null);
  const utils = trpc.useUtils();
  const { data: carts = [], isLoading } = trpc.abandonedCarts.list.useQuery();
  const detailsInput = selectedCart ?? { userId: null, sessionId: "__not-selected__" };
  const { data: cartDetails = [], isLoading: isLoadingDetails } = trpc.abandonedCarts.details.useQuery(detailsInput, {
    enabled: Boolean(selectedCart),
  });
  const cleanupMutation = trpc.abandonedCarts.cleanupExpired.useMutation({
    onSuccess: ({ deletedItems }) => {
      toast.success(
        deletedItems > 0
          ? `${deletedItems} item(ns) de carrinhos expirados foram removidos.`
          : "Nenhum carrinho com mais de 48 horas para remover."
      );
      utils.abandonedCarts.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível executar a limpeza."),
  });
  const deleteMutation = trpc.abandonedCarts.deleteOne.useMutation({
    onSuccess: ({ deletedItems }) => {
      toast.success(`${deletedItems} item(ns) removido(s) do carrinho.`);
      setCartToDelete(null);
      setSelectedCart(null);
      utils.abandonedCarts.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível excluir o carrinho."),
  });

  const filteredCarts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return carts;
    return carts.filter((cart) =>
      [cart.cartKey, cart.sessionId, cart.products]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("pt-BR").includes(term))
    );
  }, [carts, search]);

  const totalValue = carts.reduce((sum, cart) => sum + Number(cart.totalValue), 0);

  return (
    <AdminLayout>
      <div className="p-5">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
              <ShoppingCart className="h-8 w-8 text-pink-600" />
              Carrinho Abandonado
            </h1>
            <p className="mt-1 text-gray-500">
              Carrinhos sem conversão são excluídos automaticamente 48 horas após a última atividade.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">← Voltar ao Admin</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => cleanupMutation.mutate()}
              disabled={cleanupMutation.isPending}
              className="border-pink-200 text-pink-700 hover:bg-pink-50"
            >
              {cleanupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Limpar expirados
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Carrinhos em aberto</p><p className="mt-1 text-2xl font-bold text-gray-900">{carts.length}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Itens aguardando conversão</p><p className="mt-1 text-2xl font-bold text-gray-900">{carts.reduce((sum, cart) => sum + Number(cart.itemCount), 0)}</p></CardContent></Card>
          <Card><CardContent className="p-5"><p className="text-sm text-gray-500">Valor estimado em carrinhos</p><p className="mt-1 text-2xl font-bold text-pink-600">{currency.format(totalValue)}</p></CardContent></Card>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por sessão ou produto..."
                className="pl-9"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-pink-600" /></div>
            ) : filteredCarts.length === 0 ? (
              <div className="py-16 text-center">
                <ShoppingCart className="mx-auto mb-3 h-12 w-12 text-gray-200" />
                <p className="font-medium text-gray-600">Nenhum carrinho em aberto encontrado.</p>
                <p className="mt-1 text-sm text-gray-400">Os carrinhos com mais de 48 horas são excluídos automaticamente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr><th className="px-4 py-3 font-medium">Carrinho</th><th className="px-4 py-3 font-medium">Produtos</th><th className="px-4 py-3 font-medium">Itens</th><th className="px-4 py-3 font-medium">Valor</th><th className="px-4 py-3 font-medium">Última atividade</th><th className="px-4 py-3 font-medium">Retenção</th><th className="px-4 py-3 text-right font-medium">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCarts.map((cart) => (
                      <tr key={cart.cartKey} className="hover:bg-gray-50/70">
                        <td className="px-4 py-4 font-medium text-gray-900">{cart.userId ? `Cliente #${cart.userId}` : "Visitante"}<p className="mt-0.5 max-w-[160px] truncate text-xs font-normal text-gray-400">{cart.sessionId || cart.cartKey}</p></td>
                        <td className="max-w-[300px] px-4 py-4 text-gray-600"><span className="line-clamp-2">{cart.products}</span></td>
                        <td className="px-4 py-4 text-gray-700">{cart.itemCount}</td>
                        <td className="px-4 py-4 font-semibold text-gray-900">{currency.format(Number(cart.totalValue))}</td>
                        <td className="px-4 py-4 text-gray-600">{new Date(cart.lastActivityAt).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-4"><Badge variant="outline" className="gap-1 border-pink-200 bg-pink-50 text-pink-700"><Clock3 className="h-3 w-3" />{formatRemainingTime(cart.expiresAt)}</Badge></td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedCart(cart)}><Eye className="mr-1.5 h-4 w-4" />Detalhes</Button>
                            <Button size="icon" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" aria-label="Excluir carrinho" onClick={() => setCartToDelete(cart)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(selectedCart)} onOpenChange={(open) => !open && setSelectedCart(null)}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-pink-600" />Detalhes do carrinho</DialogTitle>
              <DialogDescription>{selectedCart?.userId ? `Cliente #${selectedCart.userId}` : "Visitante"}{selectedCart?.sessionId ? ` · Sessão ${selectedCart.sessionId}` : ""}</DialogDescription>
            </DialogHeader>
            {isLoadingDetails ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-pink-600" /></div>
            ) : cartDetails.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Nenhum item disponível neste carrinho.</p>
            ) : (
              <div className="space-y-3">
                {cartDetails.map((item) => {
                  let variations: Array<{ name?: string; value?: string }> = [];
                  try { variations = item.variationSnapshot ? JSON.parse(item.variationSnapshot) : []; } catch { variations = []; }
                  return (
                    <div key={item.id} className="flex gap-4 rounded-xl border border-gray-100 p-4">
                      {item.productImage ? <img src={item.productImage} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-gray-100 object-cover" /> : <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-xs font-bold text-pink-600">MI</div>}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-semibold text-gray-900">{item.productName}</p><p className="font-semibold text-pink-600">{currency.format(Number(item.totalPrice))}</p></div>
                        <p className="mt-0.5 text-sm text-gray-500">{item.quantity} × {currency.format(Number(item.unitPrice))}</p>
                        {item.customDimensions && <p className="mt-2 text-xs text-gray-500">Medidas: {item.customDimensions}</p>}
                        {variations.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{variations.map((variation, index) => <Badge key={`${variation.name}-${index}`} variant="secondary" className="font-normal">{variation.name}: {variation.value}</Badge>)}</div>}
                        {item.notes && <p className="mt-2 text-xs text-gray-500">Observação: {item.notes}</p>}
                        {item.artFileUrl && <a href={item.artFileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-pink-600 hover:underline">Ver arquivo de arte</a>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={Boolean(cartToDelete)} onOpenChange={(open) => !open && setCartToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Excluir este carrinho?</AlertDialogTitle><AlertDialogDescription>Esta ação remove imediatamente todos os itens do carrinho selecionado. Ela não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); if (cartToDelete) deleteMutation.mutate({ userId: cartToDelete.userId, sessionId: cartToDelete.sessionId }); }}>
                {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir carrinho
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
