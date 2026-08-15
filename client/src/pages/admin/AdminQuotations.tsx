import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Send,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowRight,
  TrendingUp,
  Clock,
  DollarSign,
  Percent,
  RotateCcw,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getOperationalQuotationCards, getQuotationProcedure } from "@/lib/quotation-dashboard";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  rascunho:      { label: "Rascunho",       cls: "bg-gray-100 text-gray-700" },
  enviado:       { label: "Enviado",         cls: "bg-blue-100 text-blue-700" },
  em_negociacao: { label: "Em Negociação",   cls: "bg-amber-100 text-amber-700" },
  aprovado:      { label: "Aprovado",        cls: "bg-green-100 text-green-700" },
  recusado:      { label: "Recusado",        cls: "bg-red-100 text-red-700" },
  expirado:      { label: "Expirado",        cls: "bg-orange-100 text-orange-700" },
  cancelado:     { label: "Cancelado",       cls: "bg-slate-100 text-slate-500" },
};

function fmt(v: number | string | null | undefined) {
  return Number(v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function toDateInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getMonthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { startDate: toDateInput(start), endDate: toDateInput(end) };
}

const OPERATIONAL_CARD_TONES = {
  gray: "text-gray-600",
  blue: "text-blue-600",
  green: "text-green-600",
  amber: "text-amber-600",
} as const;

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminQuotations() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState<"all" | "this_month" | "last_month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [trashQuotation, setTrashQuotation] = useState<any | null>(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [restoreQuotation, setRestoreQuotation] = useState<any | null>(null);
  const [permanentQuotation, setPermanentQuotation] = useState<any | null>(null);
  const [statusActionQuotation, setStatusActionQuotation] = useState<{ type: "cancel" | "restore"; quotation: any } | null>(null);
  const { adminUser } = useAdminAuth();
  const canManageTrash = adminUser?.role === "superadmin";
  const presetRange = period === "this_month" ? getMonthRange(0) : period === "last_month" ? getMonthRange(-1) : { startDate: undefined, endDate: undefined };
  const startDate = period === "custom" ? customStartDate || undefined : presetRange.startDate;
  const endDate = period === "custom" ? customEndDate || undefined : presetRange.endDate;

  const { data, isLoading, refetch } = trpc.quotations.list.useQuery({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
    limit: 50,
    startDate,
    endDate,
  });
  const { data: trashedQuotations = [], isLoading: isLoadingTrash } = trpc.quotations.listTrash.useQuery(undefined, { enabled: canManageTrash && showTrash });

  const updateStatus = trpc.quotations.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); setStatusActionQuotation(null); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const restoreCancelledStatus = trpc.quotations.restoreStatusBeforeCancellation.useMutation({
    onSuccess: (result) => {
      toast.success(`Cancelamento desfeito. Status restaurado para ${STATUS_CONFIG[result.restoredStatus]?.label ?? result.restoredStatus}.`);
      setStatusActionQuotation(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const duplicate = trpc.quotations.duplicate.useMutation({
    onSuccess: (res) => {
      toast.success(`Orçamento duplicado: ${res.newNumber}`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const moveToTrash = trpc.quotations.moveToTrash.useMutation({ onSuccess: async () => { toast.success("Orçamento movido para a lixeira."); setTrashQuotation(null); setDeletionReason(""); await refetch(); }, onError: (e) => toast.error(e.message) });
  const restoreFromTrash = trpc.quotations.restoreFromTrash.useMutation({ onSuccess: async () => { toast.success("Orçamento restaurado."); setRestoreQuotation(null); await refetch(); }, onError: (e) => toast.error(e.message) });
  const permanentlyDelete = trpc.quotations.permanentlyDeleteFromTrash.useMutation({ onSuccess: async () => { toast.success("Orçamento removido permanentemente."); setPermanentQuotation(null); await refetch(); }, onError: (e) => toast.error(e.message) });

  const convertToOrder = trpc.quotations.convertToOrder.useMutation({
    onSuccess: (res) => {
      toast.success(`Pedido ${res.orderNumber} criado com sucesso!`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const kpis = data?.kpis;
  const rows = data?.rows ?? [];
  const operationalCards = kpis ? getOperationalQuotationCards(kpis) : [];

  return (
    <AdminLayout>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie propostas comerciais e converta em pedidos</p>
        </div>
        <div className="flex gap-2">
          {canManageTrash && <Button variant="outline" className={showTrash ? "border-pink-300 bg-pink-50 text-pink-700" : ""} onClick={() => setShowTrash((value) => !value)}><Trash2 className="w-4 h-4 mr-1" />{showTrash ? "Fechar lixeira" : "Lixeira"}</Button>}
          <Button className="bg-pink-600 hover:bg-pink-700 text-white gap-2" onClick={() => navigate("/admin/orcamentos/novo")}><Plus className="w-4 h-4" />Novo Orçamento</Button>
        </div>
      </div>

      {/* Dashboard operacional */}
      {kpis && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-pink-600" /><div><p className="text-sm font-semibold text-gray-800">Acompanhamento operacional</p><p className="text-xs text-gray-500">Os cards mostram a próxima ação necessária em cada etapa do orçamento.</p></div></div>
            <div className="flex flex-wrap items-center gap-2">
              {[{ value: "all", label: "Todo período" }, { value: "this_month", label: "Este mês" }, { value: "last_month", label: "Mês passado" }].map((item) => <Button key={item.value} variant={period === item.value ? "default" : "outline"} size="sm" className={period === item.value ? "bg-pink-600 hover:bg-pink-700" : ""} onClick={() => setPeriod(item.value as typeof period)}>{item.label}</Button>)}
              <Button variant={period === "custom" ? "default" : "outline"} size="sm" className={period === "custom" ? "bg-pink-600 hover:bg-pink-700" : ""} onClick={() => setPeriod("custom")}>Personalizado</Button>
              {period === "custom" && <><Input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="h-8 w-36 text-xs" /><Input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="h-8 w-36 text-xs" /></>}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {operationalCards.map((card) => {
              const Icon = card.icon;
              return <div key={card.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${OPERATIONAL_CARD_TONES[card.tone]}`} /><p className="text-xs font-medium text-gray-500">{card.label}</p></div><p className={`mt-2 text-2xl font-bold ${OPERATIONAL_CARD_TONES[card.tone]}`}>{card.value}</p><p className="mt-1 text-xs text-gray-400">{card.detail}</p></div>;
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-3 rounded-lg border border-gray-200">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por número, cliente ou e-mail..."
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <SelectItem key={v} value={v}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando orçamentos...</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum orçamento encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Crie o primeiro orçamento clicando em "Novo Orçamento"</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Nº", "Cliente", "Data", "Validade", "Valor", "Status", "Próximo procedimento", "Ações"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const sc = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.rascunho;
                  const isApproved = row.status === "aprovado";
                  const isDraft = row.status === "rascunho";
                  const alreadyConverted = !!row.convertedOrderId;

                  return (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-700 font-medium">
                        {row.quotationNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{row.clientName ?? "—"}</p>
                        {row.clientEmail && <p className="text-xs text-gray-400">{row.clientEmail}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(row.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(row.expiresAt)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{fmt(row.total)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.cls}`}>
                          {sc.label}
                        </span>
                        {alreadyConverted && (
                          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                            Convertido
                          </span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-gray-500 xl:table-cell">
                        {getQuotationProcedure(row.status, row.convertedOrderId)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => navigate(`/admin/orcamentos/${row.id}`)}
                            title="Visualizar"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {(isDraft || row.status === "em_negociacao") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => navigate(`/admin/orcamentos/${row.id}/editar`)}
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {isApproved && !alreadyConverted && (
                            <Button
                              size="sm"
                              className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
                              onClick={() => convertToOrder.mutate({ id: row.id })}
                              title="Converter em Pedido"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Converter
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-44">
                             <DropdownMenuItem onClick={() => duplicate.mutate({ id: row.id })}>
                               <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
                             </DropdownMenuItem>
                              {!["cancelado", "expirado"].includes(row.status) && (
                                <DropdownMenuItem onClick={() => navigate(`/admin/orcamentos/${row.id}/editar`)}>
                                  <Edit className="w-3.5 h-3.5 mr-2" /> Editar
                                </DropdownMenuItem>
                              )}
                             {isDraft && (
                                <DropdownMenuItem onClick={() => updateStatus.mutate({ id: row.id, status: "enviado" })}>
                                  <Send className="w-3.5 h-3.5 mr-2" /> Enviar ao Cliente
                                </DropdownMenuItem>
                              )}
                              {row.status === "enviado" && (
                                <>
                                  <DropdownMenuItem onClick={() => updateStatus.mutate({ id: row.id, status: "aprovado" })}>
                                    <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-600" /> Marcar Aprovado
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => updateStatus.mutate({ id: row.id, status: "recusado" })}>
                                    <XCircle className="w-3.5 h-3.5 mr-2 text-red-500" /> Marcar Recusado
                                  </DropdownMenuItem>
                                </>
                              )}
                              {!["cancelado", "expirado"].includes(row.status) && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setStatusActionQuotation({ type: "cancel", quotation: row })}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-2" /> Cancelar
                                </DropdownMenuItem>
                              )}
                              {row.status === "cancelado" && (
                                <DropdownMenuItem onClick={() => setStatusActionQuotation({ type: "restore", quotation: row })}>
                                  <RotateCcw className="w-3.5 h-3.5 mr-2 text-green-600" /> Restaurar status anterior
                                </DropdownMenuItem>
                              )}
              {canManageTrash && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => { setDeletionReason(""); setTrashQuotation(row); }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Mover para lixeira
                </DropdownMenuItem>
              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canManageTrash && showTrash && <div className="bg-white rounded-lg border border-pink-200 shadow-sm overflow-hidden"><div className="px-4 py-3 border-b"><h2 className="font-semibold">Lixeira de Orçamentos</h2></div>{isLoadingTrash ? <div className="p-8 text-center text-gray-400">Carregando lixeira...</div> : !trashedQuotations.length ? <div className="p-8 text-center text-gray-400">Nenhum orçamento na lixeira.</div> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-gray-50">{["Nº", "Cliente", "Valor", "Motivo", "Excluído em", "Usuário", "Ação"].map((h) => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead><tbody>{trashedQuotations.map((q: any) => <tr key={q.trashId} className="border-b"><td className="px-4 py-3 font-mono text-xs text-pink-600">{q.quotationNumber}</td><td className="px-4 py-3">{q.clientName || "Cliente não informado"}</td><td className="px-4 py-3 font-semibold">{fmt(q.total)}</td><td className="px-4 py-3 text-xs">{q.deletionReason || "Motivo não informado"}</td><td className="px-4 py-3 text-xs">{new Date(q.deletedAt).toLocaleString("pt-BR")}</td><td className="px-4 py-3 text-xs">{q.deletedByAdminName || "Usuário não informado"}</td><td className="px-4 py-3"><div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setRestoreQuotation(q)}><RotateCcw className="w-3.5 h-3.5 mr-1" />Restaurar</Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => setPermanentQuotation(q)}><Trash2 className="w-4 h-4" /></Button></div></td></tr>)}</tbody></table></div>}</div>}

      <AlertDialog open={trashQuotation !== null} onOpenChange={(o) => !o && setTrashQuotation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover orçamento para a lixeira?</AlertDialogTitle>
            <AlertDialogDescription>
              O orçamento {trashQuotation?.quotationNumber} será ocultado da lista ativa e poderá ser restaurado por um Superadmin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <textarea value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} placeholder="Motivo da exclusão (obrigatório)" className="min-h-24 w-full rounded-md border px-3 py-2 text-sm" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deletionReason.trim().length < 3 || moveToTrash.isPending}
              onClick={(event) => { event.preventDefault(); if (trashQuotation && deletionReason.trim().length >= 3) moveToTrash.mutate({ id: trashQuotation.id, reason: deletionReason.trim() }); }}
            >
              {moveToTrash.isPending ? "Movendo..." : "Mover para lixeira"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={statusActionQuotation !== null} onOpenChange={(open) => !open && setStatusActionQuotation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusActionQuotation?.type === "cancel" ? "Cancelar orçamento?" : "Restaurar status anterior?"}</AlertDialogTitle>
            <AlertDialogDescription>{statusActionQuotation?.type === "cancel" ? `O orçamento ${statusActionQuotation.quotation.quotationNumber} será marcado como cancelado. Esta ação poderá ser desfeita posteriormente.` : `O orçamento ${statusActionQuotation?.quotation.quotationNumber} voltará ao status que possuía antes do cancelamento.`}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatus.isPending || restoreCancelledStatus.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className={statusActionQuotation?.type === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} disabled={updateStatus.isPending || restoreCancelledStatus.isPending} onClick={(event) => { event.preventDefault(); if (!statusActionQuotation) return; if (statusActionQuotation.type === "cancel") updateStatus.mutate({ id: statusActionQuotation.quotation.id, status: "cancelado" }); else restoreCancelledStatus.mutate({ id: statusActionQuotation.quotation.id }); }}>
              {statusActionQuotation?.type === "cancel" ? (updateStatus.isPending ? "Cancelando..." : "Confirmar cancelamento") : (restoreCancelledStatus.isPending ? "Restaurando..." : "Confirmar restauração")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={restoreQuotation !== null} onOpenChange={(o) => !o && setRestoreQuotation(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Restaurar orçamento?</AlertDialogTitle><AlertDialogDescription>O orçamento {restoreQuotation?.quotationNumber} voltará para a lista ativa.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={(event) => { event.preventDefault(); if (restoreQuotation) restoreFromTrash.mutate({ id: restoreQuotation.quotationId }); }}>{restoreFromTrash.isPending ? "Restaurando..." : "Confirmar restauração"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={permanentQuotation !== null} onOpenChange={(o) => !o && setPermanentQuotation(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir orçamento permanentemente?</AlertDialogTitle><AlertDialogDescription>O orçamento {permanentQuotation?.quotationNumber} e seus itens serão removidos definitivamente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={(event) => { event.preventDefault(); if (permanentQuotation) permanentlyDelete.mutate({ id: permanentQuotation.quotationId }); }}>{permanentlyDelete.isPending ? "Excluindo..." : "Excluir permanentemente"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
    </AdminLayout>
  );
}
