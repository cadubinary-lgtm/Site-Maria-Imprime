import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle,
  Copy,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import SellerLayout from "@/components/seller/SellerLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getOperationalQuotationCards, getQuotationProcedure } from "@/lib/quotation-dashboard";
import { trpc } from "@/lib/trpc";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-slate-100 text-slate-700" },
  enviado: { label: "Enviado", cls: "bg-blue-100 text-blue-700" },
  em_negociacao: { label: "Em negociação", cls: "bg-amber-100 text-amber-800" },
  aprovado: { label: "Aprovado", cls: "bg-emerald-100 text-emerald-700" },
  recusado: { label: "Recusado", cls: "bg-red-100 text-red-700" },
  expirado: { label: "Expirado", cls: "bg-orange-100 text-orange-700" },
  cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
};

const CARD_TONES = {
  gray: "text-slate-600",
  blue: "text-blue-600",
  amber: "text-amber-600",
  green: "text-emerald-600",
} as const;

function currency(value: unknown) {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function date(value?: Date | string | number | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("pt-BR");
}

function getMonthRange(offset: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { startDate: start.getTime(), endDate: end.getTime() };
}

type StatusAction = { type: "cancel" | "restore"; quotation: any } | null;

export default function SellerQuotations() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [period, setPeriod] = useState<"all" | "this_month" | "last_month" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [statusAction, setStatusAction] = useState<StatusAction>(null);
  const [conversionQuotation, setConversionQuotation] = useState<any | null>(null);

  const dateRange = useMemo(() => {
    if (period === "this_month") return getMonthRange(0);
    if (period === "last_month") return getMonthRange(-1);
    if (period === "custom") {
      return {
        startDate: customStartDate ? new Date(`${customStartDate}T00:00:00`).getTime() : undefined,
        endDate: customEndDate ? new Date(`${customEndDate}T23:59:59.999`).getTime() : undefined,
      };
    }
    return { startDate: undefined, endDate: undefined };
  }, [period, customStartDate, customEndDate]);

  const hasActiveFilters = Boolean(search || statusFilter !== "all" || period !== "all");
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPeriod("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };
  const quotationQuery = trpc.sellers.seller.quotations.useQuery({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const rows = quotationQuery.data?.rows ?? [];
  const operationalCards = quotationQuery.data?.kpis ? getOperationalQuotationCards(quotationQuery.data.kpis) : [];
  const refresh = async () => utils.sellers.seller.quotations.invalidate();

  const updateStatus = trpc.quotations.updateStatus.useMutation({
    onSuccess: async (_, variables) => {
      await refresh();
      const label = STATUS_CONFIG[variables.status]?.label ?? variables.status;
      toast.success("Status atualizado", { description: `Orçamento marcado como ${label}.`, position: "top-right", duration: 3500, id: `seller-quotation-status-${variables.id}` });
    },
    onError: (error) => toast.error("Não foi possível atualizar o status", { description: error.message, position: "top-right" }),
  });
  const restoreCancelledStatus = trpc.quotations.restoreStatusBeforeCancellation.useMutation({
    onSuccess: async (result, variables) => {
      await refresh();
      setStatusAction(null);
      const label = STATUS_CONFIG[result.restoredStatus]?.label ?? result.restoredStatus;
      toast.success("Cancelamento desfeito", { description: `O status foi restaurado para ${label}.`, position: "top-right", duration: 3500, id: `seller-quotation-restore-${variables.id}` });
    },
    onError: (error) => toast.error("Não foi possível restaurar o orçamento", { description: error.message, position: "top-right" }),
  });
  const duplicate = trpc.quotations.duplicate.useMutation({
    onSuccess: async (result, variables) => {
      await refresh();
      toast.success("Orçamento duplicado", { description: `A nova proposta ${result.newNumber} foi criada.`, position: "top-right", duration: 3500, id: `seller-quotation-duplicate-${variables.id}` });
      navigate(`/vendedor/orcamentos/${result.newId}`);
    },
    onError: (error) => toast.error("Não foi possível duplicar o orçamento", { description: error.message, position: "top-right" }),
  });
  const convertToOrder = trpc.quotations.convertToOrder.useMutation({
    onSuccess: async (result, variables) => {
      await refresh();
      setConversionQuotation(null);
      toast.success("Pedido criado com sucesso", { description: `O pedido ${result.orderNumber} já está disponível para acompanhamento.`, position: "top-right", duration: 4000, id: `seller-quotation-convert-${variables.id}` });
      navigate(`/vendedor/pedidos/${result.orderId}`);
    },
    onError: (error) => toast.error("Não foi possível converter em pedido", { description: error.message, position: "top-right" }),
  });

  return (
    <SellerLayout title="Meus orçamentos" description="Gerencie propostas da sua própria carteira e acompanhe o próximo passo comercial.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Acompanhamento de propostas</h2>
            <p className="mt-0.5 text-sm text-slate-500">Status, validade e ações comerciais dos seus orçamentos.</p>
          </div>
          <Button asChild className="bg-pink-600 hover:bg-pink-700"><Link href="/vendedor/orcamentos/novo"><Plus className="mr-2 h-4 w-4" />Novo orçamento</Link></Button>
        </div>

        <section className="space-y-3" aria-label="Acompanhamento operacional de orçamentos">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-pink-600" aria-hidden="true" /><div><p className="text-sm font-semibold text-slate-800">Acompanhamento operacional</p><p className="text-xs text-slate-500">Os indicadores mostram a próxima ação em cada etapa da sua carteira.</p></div></div>
            <div className="flex flex-wrap items-center gap-2">
              {[{ value: "all", label: "Todo período" }, { value: "this_month", label: "Este mês" }, { value: "last_month", label: "Mês passado" }].map((item) => <Button key={item.value} type="button" variant={period === item.value ? "default" : "outline"} size="sm" className={period === item.value ? "bg-pink-600 hover:bg-pink-700" : ""} onClick={() => setPeriod(item.value as typeof period)}>{item.label}</Button>)}
              <Button type="button" variant={period === "custom" ? "default" : "outline"} size="sm" className={period === "custom" ? "bg-pink-600 hover:bg-pink-700" : ""} onClick={() => setPeriod("custom")}>Personalizado</Button>
              {period === "custom" && <><label htmlFor="seller-quotation-period-start" className="sr-only">Data inicial</label><Input id="seller-quotation-period-start" type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="h-8 w-36 text-xs" /><label htmlFor="seller-quotation-period-end" className="sr-only">Data final</label><Input id="seller-quotation-period-end" type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="h-8 w-36 text-xs" /></>}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
            {operationalCards.map((card) => {
              const Icon = card.icon;
              return <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${CARD_TONES[card.tone]}`} aria-hidden="true" /><p className="text-xs font-medium text-slate-500">{card.label}</p></div><p className={`mt-2 text-2xl font-bold ${CARD_TONES[card.tone]}`}>{card.value}</p><p className="mt-1 text-xs text-slate-400">{card.detail}</p></div>;
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1"><label htmlFor="seller-quotations-search" className="sr-only">Buscar orçamentos</label><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input id="seller-quotations-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por número, cliente ou e-mail..." className="h-9 pl-9" /></div>
            <label htmlFor="seller-quotations-status" className="sr-only">Filtrar por status</label><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger id="seller-quotations-status" className="h-9 w-48"><SelectValue placeholder="Todos os status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(STATUS_CONFIG).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}</SelectContent></Select>
            <Button type="button" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50" disabled={!hasActiveFilters} onClick={resetFilters}>Limpar filtros</Button>
          </div>
          <p className="mt-3 text-xs text-slate-500" aria-live="polite">{quotationQuery.isLoading ? "Atualizando resultados..." : `Mostrando ${rows.length} orçamento${rows.length === 1 ? "" : "s"}.`}</p>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {quotationQuery.isLoading ? <div className="p-8 text-center text-slate-400">Carregando orçamentos...</div> : rows.length === 0 ? <div className="p-12 text-center"><FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" aria-hidden="true" /><p className="font-medium text-slate-500">Nenhum orçamento encontrado</p><p className="mt-1 text-sm text-slate-400">Crie um orçamento ou ajuste os filtros para consultar sua carteira.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50">{["Nº", "Cliente", "Data", "Validade", "Valor", "Status", "Próximo procedimento", "Ações"].map((heading) => <th key={heading} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-50">{rows.map((quote: any) => {
            const status = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.rascunho;
            const isDraft = quote.status === "rascunho";
            const isApproved = quote.status === "aprovado";
            const alreadyConverted = Boolean(quote.convertedOrderId);
            const canEdit = !["cancelado", "expirado"].includes(quote.status);
            return <tr key={quote.id} className="transition-colors hover:bg-slate-50"><td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">{quote.quotationNumber}</td><td className="px-4 py-3"><p className="font-medium text-slate-800">{quote.clientName ?? "Cliente"}</p>{quote.clientEmail && <p className="text-xs text-slate-400">{quote.clientEmail}</p>}</td><td className="px-4 py-3 text-slate-600">{date(quote.createdAt)}</td><td className="px-4 py-3 text-slate-600">{date(quote.expiresAt)}</td><td className="px-4 py-3 font-semibold text-slate-800">{currency(quote.total)}</td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.cls}`}>{status.label}</span>{alreadyConverted && <span className="ml-1 inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Convertido</span>}</td><td className="px-4 py-3 text-xs text-slate-500">{getQuotationProcedure(quote.status, quote.convertedOrderId)}</td><td className="px-4 py-3"><div className="flex items-center gap-1"><Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate(`/vendedor/orcamentos/${quote.id}`)} title="Visualizar" aria-label={`Visualizar orçamento ${quote.quotationNumber}`}><Eye className="h-3.5 w-3.5" /></Button>{canEdit && <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => navigate(`/vendedor/orcamentos/${quote.id}/editar`)} title="Editar" aria-label={`Editar orçamento ${quote.quotationNumber}`}><Edit className="h-3.5 w-3.5" /></Button>}{isApproved && !alreadyConverted && <Button size="sm" className="h-7 gap-1 bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700" onClick={() => setConversionQuotation(quote)}><ArrowRight className="h-3 w-3" />Converter</Button>}<DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label={`Mais ações para o orçamento ${quote.quotationNumber}`}><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-52"><DropdownMenuItem onClick={() => duplicate.mutate({ id: quote.id })}><Copy className="mr-2 h-3.5 w-3.5" />Duplicar</DropdownMenuItem>{canEdit && <DropdownMenuItem onClick={() => navigate(`/vendedor/orcamentos/${quote.id}/editar`)}><Edit className="mr-2 h-3.5 w-3.5" />Editar</DropdownMenuItem>}{isDraft && <DropdownMenuItem onClick={() => updateStatus.mutate({ id: quote.id, status: "enviado" })}><Send className="mr-2 h-3.5 w-3.5" />Enviar ao cliente</DropdownMenuItem>}{quote.status === "enviado" && <><DropdownMenuItem onClick={() => updateStatus.mutate({ id: quote.id, status: "aprovado" })}><CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-600" />Marcar aprovado</DropdownMenuItem><DropdownMenuItem onClick={() => updateStatus.mutate({ id: quote.id, status: "recusado" })}><XCircle className="mr-2 h-3.5 w-3.5 text-red-500" />Marcar recusado</DropdownMenuItem></>}{canEdit && <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => setStatusAction({ type: "cancel", quotation: quote })}><XCircle className="mr-2 h-3.5 w-3.5" />Cancelar</DropdownMenuItem>}{quote.status === "cancelado" && <DropdownMenuItem onClick={() => setStatusAction({ type: "restore", quotation: quote })}><RotateCcw className="mr-2 h-3.5 w-3.5 text-emerald-600" />Restaurar status anterior</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></div></td></tr>;
          })}</tbody></table></div>}
        </section>
      </div>

      <AlertDialog open={statusAction !== null} onOpenChange={(open) => !open && setStatusAction(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{statusAction?.type === "cancel" ? "Cancelar orçamento?" : "Restaurar status anterior?"}</AlertDialogTitle><AlertDialogDescription>{statusAction?.type === "cancel" ? `O orçamento ${statusAction.quotation.quotationNumber} será cancelado. Esta ação poderá ser desfeita posteriormente.` : `O orçamento ${statusAction?.quotation.quotationNumber} voltará ao status anterior ao cancelamento.`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={updateStatus.isPending || restoreCancelledStatus.isPending}>Voltar</AlertDialogCancel><AlertDialogAction className={statusAction?.type === "cancel" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"} disabled={updateStatus.isPending || restoreCancelledStatus.isPending} onClick={(event) => { event.preventDefault(); if (!statusAction) return; if (statusAction.type === "cancel") { updateStatus.mutate({ id: statusAction.quotation.id, status: "cancelado" }, { onSuccess: () => setStatusAction(null) }); } else { restoreCancelledStatus.mutate({ id: statusAction.quotation.id }); } }}>{statusAction?.type === "cancel" ? "Confirmar cancelamento" : "Restaurar status"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <AlertDialog open={conversionQuotation !== null} onOpenChange={(open) => !open && setConversionQuotation(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Converter em pedido?</AlertDialogTitle><AlertDialogDescription>Todos os dados de {conversionQuotation?.quotationNumber} serão clonados em um pedido. O orçamento continuará vinculado ao pedido para acompanhamento e rastreabilidade.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={convertToOrder.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-pink-600 hover:bg-pink-700" disabled={convertToOrder.isPending} onClick={(event) => { event.preventDefault(); if (conversionQuotation) convertToOrder.mutate({ id: conversionQuotation.id }); }}>{convertToOrder.isPending ? "Convertendo..." : "Confirmar conversão"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </SellerLayout>
  );
}
