import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Clock3, Loader2, RefreshCw, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const utils = trpc.useUtils();
  const { data: carts = [], isLoading } = trpc.abandonedCarts.list.useQuery();
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
                    <tr><th className="px-4 py-3 font-medium">Carrinho</th><th className="px-4 py-3 font-medium">Produtos</th><th className="px-4 py-3 font-medium">Itens</th><th className="px-4 py-3 font-medium">Valor</th><th className="px-4 py-3 font-medium">Última atividade</th><th className="px-4 py-3 font-medium">Retenção</th></tr>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
