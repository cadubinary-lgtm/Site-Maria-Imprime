import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TrendingUp, RefreshCw, CheckCircle, Trash2 } from "lucide-react";
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

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro", pix: "Pix", cartao_credito: "Cartão Crédito",
  cartao_debito: "Cartão Débito", boleto: "Boleto", transferencia: "Transferência",
  pagar_na_retirada: "Pagar na Retirada", outro: "Outro",
};

type Periodo = "dia" | "semana" | "mes" | "ano";

export default function FinanceiroContasRecebidas() {
  const [page, setPage] = useState(1);
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [receiptToDelete, setReceiptToDelete] = useState<any | null>(null);
  const { adminUser } = useAdminAuth();
  const utils = trpc.useUtils();
  const canDeleteReceivedAccounts = adminUser?.role === "superadmin";

  const { data, isLoading, refetch } = trpc.financeiro.getContasRecebidas.useQuery({ page, limit: 20, periodo });
  const deleteReceiptMutation = trpc.financeiro.deleteContaRecebida.useMutation({
    onSuccess: async () => {
      toast.success("Conta recebida excluída com sucesso.");
      setReceiptToDelete(null);
      await utils.financeiro.getContasRecebidas.invalidate();
    },
    onError: (error) => toast.error(error.message || "Não foi possível excluir a conta recebida."),
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas Recebidas</h1>
          <p className="text-sm text-gray-500 mt-1">Histórico de pagamentos confirmados</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />Atualizar
        </Button>
      </div>

      {/* Filtro período */}
      <div className="flex gap-2">
        {(["dia","semana","mes","ano"] as Periodo[]).map(p => (
          <Button key={p} variant={periodo === p ? "default" : "outline"} size="sm"
            onClick={() => { setPeriodo(p); setPage(1); }}
            className={periodo === p ? "bg-green-600 hover:bg-green-700 text-white" : ""}>
            {p === "dia" ? "Hoje" : p === "semana" ? "Semana" : p === "mes" ? "Mês" : "Ano"}
          </Button>
        ))}
      </div>

      {/* Total recebido */}
      {data && (
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Total Recebido no Período</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(data.totalValor)}</p>
              <p className="text-xs text-green-600">{data.total} pagamento(s) confirmado(s)</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{data ? `${data.total} recebimento(s)` : "Carregando..."}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : !data?.data.length ? (
            <div className="p-8 text-center text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhum recebimento no período selecionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Pedido</th>
                    <th className="text-left p-3 font-medium text-gray-600">Cliente</th>
                    <th className="text-right p-3 font-medium text-gray-600">Valor</th>
                    <th className="text-left p-3 font-medium text-gray-600">Data</th>
                    <th className="text-left p-3 font-medium text-gray-600">Pagamento</th>
                      <th className="text-left p-3 font-medium text-gray-600">Entrega</th>
                      <th className="text-left p-3 font-medium text-gray-600">Status</th>
                      {canDeleteReceivedAccounts && <th className="text-center p-3 font-medium text-gray-600">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs font-semibold text-orange-600">#{item.orderNumber}</td>
                      <td className="p-3 font-medium">{item.cliente || "—"}</td>
                      <td className="p-3 text-right font-semibold text-green-700">{formatCurrency(item.valor)}</td>
                      <td className="p-3 text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {PAYMENT_LABELS[item.formaPagamento] || item.formaPagamento || "—"}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {item.formaEntrega === "retirada_loja" ? "Retirada" : item.formaEntrega || "—"}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-green-100 text-green-700 border-0 text-xs">Pago</Badge>
                      </td>
                      {canDeleteReceivedAccounts && (
                        <td className="p-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                            title={`Excluir recebimento do pedido ${item.orderNumber}`}
                            aria-label={`Excluir recebimento do pedido ${item.orderNumber}`}
                            onClick={() => setReceiptToDelete(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-500">Página {page} de {data.totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </div>
          )}
        </CardContent>
        </Card>
        <AlertDialog open={Boolean(receiptToDelete)} onOpenChange={(open) => !open && setReceiptToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir esta conta recebida?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação remove permanentemente o pedido #{receiptToDelete?.orderNumber} e os registros relacionados a ele. Ela não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteReceiptMutation.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteReceiptMutation.isPending}
                onClick={(event) => {
                  event.preventDefault();
                  if (receiptToDelete?.pedidoId) deleteReceiptMutation.mutate({ orderId: receiptToDelete.pedidoId });
                }}
              >
                {deleteReceiptMutation.isPending ? "Excluindo..." : "Excluir permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
