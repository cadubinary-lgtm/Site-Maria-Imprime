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
  QrCode, RefreshCw, Filter, Phone, Trash2, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { useLocation } from "wouter";
import { createAdminDetailLocation } from "@/lib/adminNavigation";
import { useAdminAuth } from "@/hooks/useAdminAuth";

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
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });
  const [pixDialog, setPixDialog] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });
  const [selectedPayment, setSelectedPayment] = useState<"dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "transferencia">("pix");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });
  const [deletionReason, setDeletionReason] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [whatsappDialog, setWhatsappDialog] = useState<{ open: boolean; order: any | null }>({ open: false, order: null });
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const { adminUser } = useAdminAuth();
  const canDeleteReceivable = adminUser?.role === "superadmin";
  const utils = trpc.useUtils();

  const { data, isLoading, refetch } = trpc.financeiro.getContasReceber.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    formaPagamento: formaPagamento || undefined,
  });
  const { data: trashedAccounts = [], isLoading: isLoadingTrash } = trpc.financeiro.listDeletedContasRecebidas.useQuery(undefined, {
    enabled: canDeleteReceivable && showTrash,
  });
  const trashedReceivables = trashedAccounts.filter((item: any) => item.paymentStatus !== "pago" || item.paymentMethod === "pagar_na_retirada");

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

  const moveToTrash = trpc.financeiro.moveContaRecebidaToTrash.useMutation({
    onSuccess: () => {
      toast.success("Conta a receber movida para a lixeira.");
      setDeleteDialog({ open: false, order: null });
      setDeletionReason("");
      refetch();
    },
    onError: (e) => toast.error("Erro ao mover para a lixeira: " + e.message),
  });

  const restoreReceivable = trpc.financeiro.restoreContaRecebida.useMutation({
    onSuccess: async () => {
      toast.success("Conta a receber restaurada com sucesso.");
      setRestoreDialog({ open: false, item: null });
      await utils.financeiro.getContasReceber.invalidate();
      await utils.financeiro.listDeletedContasRecebidas.invalidate();
    },
    onError: (e) => toast.error("Erro ao restaurar: " + e.message),
  });

  const permanentlyDeleteReceivable = trpc.financeiro.permanentlyDeleteContaRecebida.useMutation({
    onSuccess: async () => {
      toast.success("Item removido permanentemente da lixeira.");
      setPermanentDeleteDialog({ open: false, item: null });
      await utils.financeiro.getContasReceber.invalidate();
      await utils.financeiro.listDeletedContasRecebidas.invalidate();
    },
    onError: (e) => toast.error("Erro ao excluir permanentemente: " + e.message),
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
        <div className="flex items-center gap-2">
          {canDeleteReceivable && <Button variant="outline" size="sm" onClick={() => setShowTrash((current) => !current)} className={showTrash ? "border-pink-300 bg-pink-50 text-pink-700 hover:bg-pink-100" : ""}><Trash2 className="h-4 w-4 mr-1" />{showTrash ? "Fechar lixeira" : "Lixeira"}</Button>}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>
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
                            onClick={() => setLocation(createAdminDetailLocation(`/admin/pedidos/${item.pedidoId}`, "/admin/financeiro/receber"))}
                            title="Ver pedido"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-green-600 hover:bg-green-50 hover:border-green-300"
                            onClick={() => {
                              if (item.telefone) {
                                enviarCobranca.mutate({ orderId: item.pedidoId, telefone: item.telefone });
                              } else {
                                setWhatsappPhone("");
                                setWhatsappDialog({ open: true, order: item });
                              }
                            }}
                            title="Enviar Cobrança WhatsApp"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          {canDeleteReceivable && <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-red-500 hover:bg-red-50 hover:border-red-300"
                            onClick={() => { setDeletionReason(""); setDeleteDialog({ open: true, order: item }); }}
                            title="Mover conta para a lixeira"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>}
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

      {canDeleteReceivable && showTrash && (
        <Card className="border border-pink-200 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base text-gray-900"><Trash2 className="h-4 w-4 text-pink-600" />Lixeira de Contas a Receber</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoadingTrash ? <div className="p-8 text-center text-sm text-gray-400">Carregando lixeira...</div> : !trashedReceivables.length ? <div className="p-8 text-center text-sm text-gray-400">Nenhuma conta a receber na lixeira.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-gray-50"><tr><th className="p-3 text-left font-medium text-gray-600">Pedido</th><th className="p-3 text-left font-medium text-gray-600">Cliente</th><th className="p-3 text-right font-medium text-gray-600">Valor</th><th className="p-3 text-left font-medium text-gray-600">Motivo</th><th className="p-3 text-left font-medium text-gray-600">Excluído em</th><th className="p-3 text-left font-medium text-gray-600">Usuário</th><th className="p-3 text-center font-medium text-gray-600">Ação</th></tr></thead><tbody className="divide-y divide-gray-100">{trashedReceivables.map((item: any) => <tr key={item.trashId}><td className="p-3 font-mono text-xs font-semibold text-pink-600">#{item.orderNumber}</td><td className="p-3 font-medium">{item.cliente}</td><td className="p-3 text-right font-semibold text-gray-700">{formatCurrency(item.valor)}</td><td className="max-w-60 p-3 text-xs text-gray-600">{item.deletionReason || "Motivo não informado"}</td><td className="whitespace-nowrap p-3 text-xs text-gray-600">{new Date(item.deletedAt).toLocaleString("pt-BR")}</td><td className="p-3 text-xs text-gray-600">{item.deletedByAdminName || "Usuário não informado"}</td><td className="p-3 text-center"><div className="flex justify-center gap-1"><Button size="sm" variant="outline" className="h-8 gap-1 text-xs" disabled={restoreReceivable.isPending} onClick={() => setRestoreDialog({ open: true, item })}><RotateCcw className="h-3.5 w-3.5" />Restaurar</Button><Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" title={`Excluir permanentemente o pedido ${item.orderNumber}`} aria-label={`Excluir permanentemente o pedido ${item.orderNumber}`} disabled={permanentlyDeleteReceivable.isPending} onClick={() => setPermanentDeleteDialog({ open: true, item })}><Trash2 className="h-3.5 w-3.5" /></Button></div></td></tr>)}</tbody></table></div>}
          </CardContent>
        </Card>
      )}

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

      <Dialog open={restoreDialog.open} onOpenChange={(open) => !open && setRestoreDialog({ open: false, item: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Restaurar esta conta a receber?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">O pedido #{restoreDialog.item?.orderNumber} voltará imediatamente para a lista ativa de Contas a Receber.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog({ open: false, item: null })}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" disabled={restoreReceivable.isPending} onClick={() => { if (restoreDialog.item?.orderId) restoreReceivable.mutate({ orderId: restoreDialog.item.orderId }); }}>{restoreReceivable.isPending ? "Restaurando..." : "Confirmar restauração"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permanentDeleteDialog.open} onOpenChange={(open) => !open && setPermanentDeleteDialog({ open: false, item: null })}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-red-600">Excluir este item permanentemente?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">O pedido #{permanentDeleteDialog.item?.orderNumber} e seus registros vinculados serão removidos de forma definitiva. Esta ação não poderá ser desfeita.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermanentDeleteDialog({ open: false, item: null })}>Cancelar</Button>
            <Button variant="destructive" disabled={permanentlyDeleteReceivable.isPending} onClick={() => { if (permanentDeleteDialog.item?.orderId) permanentlyDeleteReceivable.mutate({ orderId: permanentDeleteDialog.item.orderId }); }}>{permanentlyDeleteReceivable.isPending ? "Excluindo..." : "Excluir permanentemente"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Mover para lixeira */}
      <Dialog open={deleteDialog.open} onOpenChange={(o) => { if (!o) { setDeleteDialog({ open: false, order: null }); setDeletionReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Mover conta a receber para a lixeira</DialogTitle>
          </DialogHeader>
          {deleteDialog.order && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                O pedido abaixo será ocultado de Contas a Receber, mas poderá ser restaurado posteriormente na lixeira por um Superadmin.
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
              <div className="space-y-2">
                <label htmlFor="receivable-deletion-reason" className="text-sm font-medium text-gray-800">Motivo da exclusão <span className="text-red-600">*</span></label>
                <textarea id="receivable-deletion-reason" value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} placeholder="Descreva por que esta conta deve ser movida para a lixeira" maxLength={1000} className="min-h-24 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" />
                <p className="text-xs text-gray-500">O motivo é obrigatório e ficará registrado na lixeira e na auditoria.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, order: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={moveToTrash.isPending || deletionReason.trim().length < 3}
              onClick={() => {
                if (deleteDialog.order && deletionReason.trim().length >= 3) {
                  moveToTrash.mutate({ orderId: deleteDialog.order.pedidoId, reason: deletionReason.trim() });
                }
              }}
            >
              {moveToTrash.isPending ? "Movendo..." : "Mover para lixeira"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: WhatsApp sem telefone */}
      <Dialog open={whatsappDialog.open} onOpenChange={(o) => !o && setWhatsappDialog({ open: false, order: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Cobrança por WhatsApp</DialogTitle>
          </DialogHeader>
          {whatsappDialog.order && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pedido</span>
                  <span className="font-mono font-semibold">#{whatsappDialog.order.orderNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cliente</span>
                  <span className="font-medium">{whatsappDialog.order.cliente}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-bold text-green-600">{formatCurrency(whatsappDialog.order.valor)}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Número de WhatsApp do cliente
                </label>
                <Input
                  placeholder="Ex: 11999999999"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={15}
                  className="font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">Somente números, com DDD. Ex: 11999999999</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappDialog({ open: false, order: null })}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={whatsappPhone.length < 10 || enviarCobranca.isPending}
              onClick={() => {
                if (whatsappDialog.order && whatsappPhone) {
                  enviarCobranca.mutate({ orderId: whatsappDialog.order.pedidoId, telefone: whatsappPhone });
                  setWhatsappDialog({ open: false, order: null });
                }
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              {enviarCobranca.isPending ? "Abrindo..." : "Abrir WhatsApp"}
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
