import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TrendingUp, RefreshCw, CheckCircle, Trash2, RotateCcw, Search, ReceiptText } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function formatDate(ts: any) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("pt-BR");
}

function formatDateTime(ts: any) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).format(new Date(ts));
}

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", pix: "Pix", cartao_credito: "Cartão de débito/crédito",
  cartao_debito: "Cartão de débito/crédito", boleto: "Boleto", transferencia: "Transferência",
  pagar_na_retirada: "Pagar na Retirada", outro: "Outro",
};

type Periodo = "dia" | "semana" | "mes" | "ano";

export default function FinanceiroContasRecebidas() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<any | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [receiptToRestore, setReceiptToRestore] = useState<any | null>(null);
  const [receiptToPermanentlyDelete, setReceiptToPermanentlyDelete] = useState<any | null>(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const { adminUser } = useAdminAuth();
  const utils = trpc.useUtils();
  const canManageReceivedAccountsTrash = Boolean(adminUser);
  const canPermanentlyDeleteReceivedAccounts = adminUser?.role === "superadmin";

  const queryInput = useMemo(() => ({
    page,
    limit: 20,
    periodo,
    search: search.trim() || undefined,
    startDate: startDate ? new Date(`${startDate}T00:00:00`).getTime() : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : undefined,
  }), [page, periodo, search, startDate, endDate]);

  const { data, isLoading, refetch } = trpc.financeiro.getContasRecebidas.useQuery(queryInput);
  const { data: deletedReceipts = [], isLoading: isLoadingTrash } = trpc.financeiro.listDeletedContasRecebidas.useQuery(undefined, {
    enabled: canManageReceivedAccountsTrash && showTrash,
  });

  const moveReceiptToTrashMutation = trpc.financeiro.moveContaRecebidaToTrash.useMutation({
    onSuccess: async () => {
      toast.success("Conta recebida movida para a lixeira.");
      setReceiptToDelete(null);
      setDeletionReason("");
      await utils.financeiro.getContasRecebidas.invalidate();
      await utils.financeiro.listDeletedContasRecebidas.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível mover a conta recebida para a lixeira."),
  });

  const restoreReceiptMutation = trpc.financeiro.restoreContaRecebida.useMutation({
    onSuccess: async () => {
      toast.success("Conta recebida restaurada com sucesso.");
      setReceiptToRestore(null);
      await utils.financeiro.getContasRecebidas.invalidate();
      await utils.financeiro.listDeletedContasRecebidas.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível restaurar a conta recebida."),
  });

  const emptyTrashMutation = trpc.financeiro.emptyDeletedContasRecebidas.useMutation({
    onSuccess: async (result) => {
      toast.success(`${result.deletedCount} item(ns) removido(s) permanentemente.`);
      setConfirmEmptyTrash(false);
      await utils.financeiro.getContasRecebidas.invalidate();
      await utils.financeiro.listDeletedContasRecebidas.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível esvaziar a lixeira."),
  });

  const permanentlyDeleteReceiptMutation = trpc.financeiro.permanentlyDeleteContaRecebida.useMutation({
    onSuccess: async () => {
      toast.success("Item removido permanentemente da lixeira.");
      setReceiptToPermanentlyDelete(null);
      await utils.financeiro.getContasRecebidas.invalidate();
      await utils.financeiro.listDeletedContasRecebidas.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível excluir o item permanentemente."),
  });

  const clearFilters = () => {
    setSearch("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contas Recebidas</h1>
            <p className="mt-1 text-sm text-gray-500">Histórico de pagamentos confirmados</p>
          </div>
          <div className="flex items-center gap-2">
            {canManageReceivedAccountsTrash && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowTrash((current) => !current)} aria-pressed={showTrash} className={showTrash ? "border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100" : "border-pink-200 text-pink-700 hover:bg-pink-50"}>
                <Trash2 className="mr-1 h-4 w-4" aria-hidden="true" />{showTrash ? "Fechar lixeira" : "Lixeira"}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()} className="border-pink-200 text-pink-700 hover:bg-pink-50">
              <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" />Atualizar
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          {(["dia", "semana", "mes", "ano"] as Periodo[]).map((p) => (
            <Button
              key={p}
              variant={periodo === p ? "default" : "outline"}
              size="sm"
              type="button"
              onClick={() => { setPeriodo(p); setPage(1); }}
              className={periodo === p ? "bg-pink-600 text-white hover:bg-pink-700" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
              aria-pressed={periodo === p}
            >
              {p === "dia" ? "Hoje" : p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Ano"}
            </Button>
          ))}
        </div>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="flex flex-wrap items-end gap-3 p-4">
            <div className="relative min-w-[230px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <Input aria-label="Buscar contas recebidas" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por pedido, cliente ou e-mail..." className="h-9 pl-9" />
            </div>
            <label className="grid gap-1 text-xs font-medium text-gray-600">
              Data inicial
              <Input id="received-start-date" type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); setPage(1); }} className="h-9" />
            </label>
            <label className="grid gap-1 text-xs font-medium text-gray-600">
              Data final
              <Input id="received-end-date" type="date" value={endDate} onChange={(event) => { setEndDate(event.target.value); setPage(1); }} className="h-9" />
            </label>
            {(search || startDate || endDate) && <Button type="button" variant="ghost" size="sm" className="h-9 text-pink-700 hover:bg-pink-50 hover:text-pink-800" onClick={clearFilters}>Limpar filtros</Button>}
          </CardContent>
        </Card>

        {data && (
          <Card className="border-0 bg-green-50 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-xl bg-green-100 p-3"><TrendingUp className="h-6 w-6 text-green-600" aria-hidden="true" /></div>
              <div>
                <p className="text-sm font-medium text-green-700">Total Recebido no Período</p>
                <p className="mt-1 text-2xl font-bold text-green-800">{formatCurrency(data.totalValor)}</p>
                <p className="mt-1 text-xs text-green-600">{data.total} pagamento(s) confirmado(s)</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-base">{data ? `${data.total} recebimento(s)` : "Carregando..."}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : !data?.data.length ? (
              <div className="p-8 text-center text-gray-400"><CheckCircle className="mx-auto mb-2 h-12 w-12 opacity-30" aria-hidden="true" /><p>Nenhum recebimento encontrado com estes filtros</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50"><tr><th className="p-3 text-left font-medium text-gray-600">Pedido</th><th className="p-3 text-left font-medium text-gray-600">Cliente</th><th className="p-3 text-right font-medium text-gray-600">Valor</th><th className="p-3 text-left font-medium text-gray-600">Data</th><th className="p-3 text-left font-medium text-gray-600">Pagamento</th><th className="p-3 text-left font-medium text-gray-600">Entrega</th><th className="p-3 text-left font-medium text-gray-600">Status</th><th className="p-3 text-center font-medium text-gray-600">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.data.map((item: any) => (
                      <tr key={item.pedidoId} className="hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs font-semibold text-pink-600">#{item.orderNumber}</td>
                        <td className="p-3 font-medium">{item.cliente || "—"}</td>
                        <td className="p-3 text-right font-semibold text-green-700">{formatCurrency(item.valor)}</td>
                        <td className="p-3 text-gray-500">{formatDate(item.createdAt)}</td>
                        <td className="p-3"><Badge variant="outline" className="text-xs">{PAYMENT_LABELS[item.formaPagamento] || item.formaPagamento || "—"}</Badge></td>
                        <td className="p-3 text-xs text-gray-500">{item.formaEntrega === "retirada_loja" ? "Retirada" : item.formaEntrega || "—"}</td>
                        <td className="p-3"><Badge className="border-0 bg-green-100 text-xs text-green-700">Pago</Badge></td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-pink-600 hover:bg-pink-50 hover:text-pink-700"
                              aria-label={item.receiptId ? `Abrir recibo ${item.receiptNumber || `do pedido ${item.orderNumber}`}` : `Recibo do pedido ${item.orderNumber} ainda não está disponível`}
                              title={item.receiptId ? "Abrir recibo" : "Recibo indisponível"}
                              disabled={!item.receiptId}
                              onClick={() => item.receiptId && setLocation(`/admin/financeiro/recibos/${item.receiptId}/imprimir`)}
                            >
                              <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            {canManageReceivedAccountsTrash && <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" aria-label={`Mover o recebimento do pedido ${item.orderNumber} para a lixeira`} onClick={() => { setDeletionReason(""); setReceiptToDelete(item); }}><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></Button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {data && data.totalPages > 1 && <div className="flex items-center justify-between border-t p-4"><span className="text-sm text-gray-500">Página {page} de {data.totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div></div>}
          </CardContent>
        </Card>

        <AlertDialog open={Boolean(receiptToDelete)} onOpenChange={(open) => { if (!open) { setReceiptToDelete(null); setDeletionReason(""); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mover esta conta recebida para a lixeira?</AlertDialogTitle>
              <AlertDialogDescription>O pedido #{receiptToDelete?.orderNumber} será ocultado de Contas Recebidas, mas poderá ser restaurado posteriormente na Lixeira por uma pessoa administradora.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-2">
              <label htmlFor="deletion-reason" className="text-sm font-medium text-gray-800">Motivo da exclusão <span className="text-red-600">*</span></label>
              <textarea id="deletion-reason" value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} placeholder="Descreva por que este recebimento deve ser movido para a lixeira" maxLength={1000} className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
              <p className="text-xs text-gray-500">O motivo é obrigatório e ficará registrado na lixeira e na auditoria.</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={moveReceiptToTrashMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={moveReceiptToTrashMutation.isPending || deletionReason.trim().length < 3} onClick={(event) => { event.preventDefault(); if (receiptToDelete?.pedidoId && deletionReason.trim().length >= 3) moveReceiptToTrashMutation.mutate({ orderId: receiptToDelete.pedidoId, reason: deletionReason.trim() }); }}>
                {moveReceiptToTrashMutation.isPending ? "Movendo..." : "Mover para lixeira"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={Boolean(receiptToRestore)} onOpenChange={(open) => !open && setReceiptToRestore(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar esta conta recebida?</AlertDialogTitle>
              <AlertDialogDescription>O pedido #{receiptToRestore?.orderNumber} voltará imediatamente para a lista ativa de Contas Recebidas.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={restoreReceiptMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-green-600 hover:bg-green-700" disabled={restoreReceiptMutation.isPending} onClick={(event) => { event.preventDefault(); if (receiptToRestore?.orderId) restoreReceiptMutation.mutate({ orderId: receiptToRestore.orderId }); }}>
                {restoreReceiptMutation.isPending ? "Restaurando..." : "Confirmar restauração"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmEmptyTrash} onOpenChange={setConfirmEmptyTrash}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Esvaziar a lixeira permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>
                Você está prestes a remover permanentemente {deletedReceipts.length} item(ns) da lixeira. Pedidos, pagamentos e registros vinculados não poderão ser restaurados depois desta ação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={emptyTrashMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={emptyTrashMutation.isPending} onClick={(event) => { event.preventDefault(); emptyTrashMutation.mutate({ confirmation: true }); }}>
                {emptyTrashMutation.isPending ? "Esvaziando..." : "Esvaziar permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={Boolean(receiptToPermanentlyDelete)} onOpenChange={(open) => !open && setReceiptToPermanentlyDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir este item permanentemente?</AlertDialogTitle>
              <AlertDialogDescription>O pedido #{receiptToPermanentlyDelete?.orderNumber} e seus registros vinculados serão excluídos de forma definitiva. Esta ação não poderá ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={permanentlyDeleteReceiptMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={permanentlyDeleteReceiptMutation.isPending} onClick={(event) => { event.preventDefault(); if (receiptToPermanentlyDelete?.orderId) permanentlyDeleteReceiptMutation.mutate({ orderId: receiptToPermanentlyDelete.orderId }); }}>
                {permanentlyDeleteReceiptMutation.isPending ? "Excluindo..." : "Excluir permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {canManageReceivedAccountsTrash && showTrash && (
          <Card className="border border-pink-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="flex items-center gap-2 text-base text-gray-900"><Trash2 className="h-4 w-4 text-pink-600" />Lixeira de Contas Recebidas</CardTitle>{canPermanentlyDeleteReceivedAccounts && <Button size="sm" variant="outline" className="h-8 border-red-200 text-xs text-red-600 hover:bg-red-50 hover:text-red-700" disabled={isLoadingTrash || !deletedReceipts.length} onClick={() => setConfirmEmptyTrash(true)}><Trash2 className="mr-1 h-3.5 w-3.5" />Esvaziar Lixeira</Button>}</CardHeader>
            <CardContent className="p-0">
              {isLoadingTrash ? <div className="p-8 text-center text-sm text-gray-400">Carregando lixeira...</div> : !deletedReceipts.length ? <div className="p-8 text-center text-sm text-gray-400">Nenhuma conta recebida na lixeira.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-gray-50"><tr><th className="p-3 text-left font-medium text-gray-600">Pedido</th><th className="p-3 text-left font-medium text-gray-600">Cliente</th><th className="p-3 text-right font-medium text-gray-600">Valor</th><th className="p-3 text-left font-medium text-gray-600">Motivo</th><th className="p-3 text-left font-medium text-gray-600">Data e hora da exclusão</th><th className="p-3 text-left font-medium text-gray-600">Usuário que excluiu</th><th className="p-3 text-center font-medium text-gray-600">Ação</th></tr></thead><tbody className="divide-y divide-gray-100">{deletedReceipts.map((item: any) => <tr key={item.trashId}><td className="p-3 font-mono text-xs font-semibold text-pink-600">#{item.orderNumber}</td><td className="p-3 font-medium">{item.cliente}</td><td className="p-3 text-right font-semibold text-gray-700">{formatCurrency(item.valor)}</td><td className="max-w-60 p-3 text-xs text-gray-600">{item.deletionReason || "Motivo não informado"}</td><td className="whitespace-nowrap p-3 text-xs font-medium text-gray-600">{formatDateTime(item.deletedAt)}</td><td className="p-3 text-xs text-gray-600"><span className="font-medium text-gray-700">{item.deletedByAdminName || "Usuário não informado"}</span>{item.deletedByAdminId ? <span className="block text-[11px] text-gray-400">ID do usuário: #{item.deletedByAdminId}</span> : null}</td><td className="p-3 text-center"><div className="flex justify-center gap-1"><Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={restoreReceiptMutation.isPending} onClick={() => setReceiptToRestore(item)}><RotateCcw className="h-3.5 w-3.5" />Restaurar</Button>{canPermanentlyDeleteReceivedAccounts && <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" title={`Excluir permanentemente o pedido ${item.orderNumber}`} aria-label={`Excluir permanentemente o pedido ${item.orderNumber}`} disabled={permanentlyDeleteReceiptMutation.isPending} onClick={() => setReceiptToPermanentlyDelete(item)}><Trash2 className="h-3.5 w-3.5" /></Button>}</div></td></tr>)}</tbody></table></div>}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
