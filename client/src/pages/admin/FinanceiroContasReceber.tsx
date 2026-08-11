import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Search, DollarSign, Eye, Send, CreditCard, Banknote,
  QrCode, RefreshCw, Filter, Phone, Trash2
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function formatDate(ts: any) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("pt-BR");
}

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão Crédito",
  cartao_debito: "Cartão Débito",
  boleto: "Boleto",
  transferencia: "Transferência",
  pagar_na_retirada: "Pagar na Retirada",
  outro: "Outro",
};

const DELIVERY_LABELS: Record<string, string> = {
  retirada_loja: "Retirada na Loja",
  moto_express: "Moto Express",
  transportadora: "Transportadora",
  correios: "Correios",
  outro: "Outro",
};

export default function FinanceiroContasReceber() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });
  const [pixDialog, setPixDialog] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });
  const [selectedPayment, setSelectedPayment] = useState<"dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "transferencia">("pix");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });

  const { data, isLoading, refetch } = trpc.financeiro.getContasReceber.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    formaPagamento: formaPagamento || undefined,
  });

  const confirmarPagamento = trpc.financeiro.confirmarPagamento.useMutation({
    onSuccess: () => {
      toast.success("Pagamento confirmado com sucesso!");
      setConfirmDialog({ open: false, order: null });
      refetch();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const gerarPix = trpc.financeiro.gerarPix.useMutation({
    onSuccess: (data) => {
      setPixDialog(prev => ({ ...prev, order: { ...prev.order, pixCopiaECola: data.pixCopiaECola } }));
      toast.success("Pix gerado com sucesso!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const enviarCobranca = trpc.financeiro.enviarCobrancaWhatsApp.useMutation({
    onSuccess: (data) => {
      window.open(data.whatsappUrl, "_blank");
      toast.success("Abrindo WhatsApp...");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteOrder = trpc.admin.deleteOrder.useMutation({
    onSuccess: () => {
      toast.success("Pedido excluído com sucesso!");
      setDeleteDialog({ open: false, order: null });
      refetch();
    },
    onError: (e) => toast.error("Erro ao excluir: " + e.message),
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-sm text-gray-500 mt-1">Pedidos aguardando confirmação de pagamento</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por cliente, pedido..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={formaPagamento} onValueChange={(v) => { setFormaPagamento(v === "todos" ? "" : v); setPage(1); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Forma de Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as formas</SelectItem>
                {Object.entries(PAYMENT_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {data ? `${data.total} pedido(s) pendente(s)` : "Carregando..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : !data?.data.length ? (
            <div className="p-8 text-center text-gray-400">
              <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma conta a receber no momento</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Pedido</th>
                    <th className="text-left p-3 font-medium text-gray-600">Cliente</th>
                    <th className="text-left p-3 font-medium text-gray-600">Telefone</th>
                    <th className="text-right p-3 font-medium text-gray-600">Valor</th>
                    <th className="text-left p-3 font-medium text-gray-600">Data</th>
                    <th className="text-left p-3 font-medium text-gray-600">Pagamento</th>
                    <th className="text-left p-3 font-medium text-gray-600">Entrega</th>
                    <th className="text-left p-3 font-medium text-gray-600">Status</th>
                    <th className="text-center p-3 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.data.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-mono text-xs font-semibold text-orange-600">
                        #{item.orderNumber}
                      </td>
                      <td className="p-3 font-medium">{item.cliente || "—"}</td>
                      <td className="p-3 text-gray-500">{item.telefone || "—"}</td>
                      <td className="p-3 text-right font-semibold text-gray-900">
                        {formatCurrency(item.valor)}
                      </td>
                      <td className="p-3 text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {PAYMENT_LABELS[item.formaPagamento] || item.formaPagamento || "—"}
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-500 text-xs">
                        {DELIVERY_LABELS[item.formaEntrega] || item.formaEntrega || "—"}
                      </td>
                      <td className="p-3">
                        <Badge className="bg-orange-100 text-orange-700 border-0 text-xs">
                          A Receber
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmDialog({ open: true, order: item })}
                            title="Confirmar Pagamento"
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Receber
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setPixDialog({ open: true, order: item });
                            }}
                            title="Gerar Pix"
                          >
                            <QrCode className="h-3 w-3" />
                          </Button>
                          {item.telefone && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-green-600"
                              onClick={() => enviarCobranca.mutate({
                                orderId: item.pedidoId,
                                telefone: item.telefone,
                              })}
                              title="Enviar Cobrança WhatsApp"
                            >
                              <Send className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:border-red-300"
                            onClick={() => setDeleteDialog({ open: true, order: item })}
                            title="Excluir Pedido"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <span className="text-sm text-gray-500">
                Página {page} de {data.totalPages}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Confirmar Pagamento */}
      <Dialog open={confirmDialog.open} onOpenChange={(o) => !o && setConfirmDialog({ open: false, order: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          {confirmDialog.order && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pedido</span>
                  <span className="font-mono font-semibold">#{confirmDialog.order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-medium">{confirmDialog.order.cliente}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-bold text-green-600 text-base">{formatCurrency(confirmDialog.order.valor)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Forma de Pagamento Recebida</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "dinheiro", label: "Dinheiro", icon: Banknote },
                    { value: "pix", label: "Pix", icon: QrCode },
                    { value: "cartao_credito", label: "Crédito", icon: CreditCard },
                    { value: "cartao_debito", label: "Débito", icon: CreditCard },
                    { value: "transferencia", label: "Transferência", icon: DollarSign },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedPayment(opt.value as any)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm ${
                        selectedPayment === opt.value
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <opt.icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, order: null })}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={confirmarPagamento.isPending}
              onClick={() => {
                if (confirmDialog.order) {
                  confirmarPagamento.mutate({
                    orderId: confirmDialog.order.pedidoId,
                    formaPagamento: selectedPayment,
                  });
                }
              }}
            >
              {confirmarPagamento.isPending ? "Confirmando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Pix */}
      {/* Dialog: Confirmar Exclusão */}
      <Dialog open={deleteDialog.open} onOpenChange={(o) => !o && setDeleteDialog({ open: false, order: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Excluir Pedido</DialogTitle>
          </DialogHeader>
          {deleteDialog.order && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Tem certeza que deseja excluir o pedido abaixo? Esta ação é <strong>irreversível</strong>.
              </p>
              <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pedido</span>
                  <span className="font-mono font-semibold">#{deleteDialog.order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-medium">{deleteDialog.order.cliente}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-bold text-red-600">{formatCurrency(deleteDialog.order.valor)}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, order: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteOrder.isPending}
              onClick={() => {
                if (deleteDialog.order) {
                  deleteOrder.mutate({ orderId: deleteDialog.order.pedidoId });
                }
              }}
            >
              {deleteOrder.isPending ? "Excluindo..." : "Sim, excluir pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pixDialog.open} onOpenChange={(o) => !o && setPixDialog({ open: false, order: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cobrança Pix</DialogTitle>
          </DialogHeader>
          {pixDialog.order && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pedido</span>
                  <span className="font-mono font-semibold">#{pixDialog.order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-bold text-green-600">{formatCurrency(pixDialog.order.valor)}</span>
                </div>
              </div>

              {pixDialog.order.pixCopiaECola ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Pix Copia e Cola:</p>
                  <div className="bg-gray-100 rounded p-3 text-xs font-mono break-all select-all">
                    {pixDialog.order.pixCopiaECola}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(pixDialog.order.pixCopiaECola);
                      toast.success("Código Pix copiado!");
                    }}
                  >
                    Copiar Código Pix
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={gerarPix.isPending}
                  onClick={() => gerarPix.mutate({
                    orderId: pixDialog.order.pedidoId,
                    valor: parseFloat(pixDialog.order.valor),
                  })}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {gerarPix.isPending ? "Gerando..." : "Gerar Código Pix"}
                </Button>
              )}

              {pixDialog.order.telefone && (
                <Button
                  variant="outline"
                  className="w-full text-green-600 border-green-200"
                  onClick={() => {
                    enviarCobranca.mutate({
                      orderId: pixDialog.order.pedidoId,
                      telefone: pixDialog.order.telefone,
                    });
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Enviar por WhatsApp
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPixDialog({ open: false, order: null })}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
