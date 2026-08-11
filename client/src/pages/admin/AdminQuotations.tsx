import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
} from "lucide-react";
import { toast } from "sonner";

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

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminQuotations() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading, refetch } = trpc.quotations.list.useQuery({
    search: search || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    page: 1,
    limit: 50,
  });

  const updateStatus = trpc.quotations.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const duplicate = trpc.quotations.duplicate.useMutation({
    onSuccess: (res) => {
      toast.success(`Orçamento duplicado: ${res.newNumber}`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.quotations.delete.useMutation({
    onSuccess: () => { toast.success("Orçamento excluído."); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const convertToOrder = trpc.quotations.convertToOrder.useMutation({
    onSuccess: (res) => {
      toast.success(`Pedido ${res.orderNumber} criado com sucesso!`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const kpis = data?.kpis;
  const rows = data?.rows ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie propostas comerciais e converta em pedidos</p>
        </div>
        <Button
          className="bg-pink-600 hover:bg-pink-700 text-white gap-2"
          onClick={() => navigate("/admin/orcamentos/novo")}
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Rascunhos",      value: kpis.rascunhos,      icon: FileText,    cls: "text-gray-600" },
            { label: "Enviados",       value: kpis.enviados,        icon: Send,        cls: "text-blue-600" },
            { label: "Aprovados",      value: kpis.aprovados,       icon: CheckCircle, cls: "text-green-600" },
            { label: "Expirados",      value: kpis.expirados,       icon: Clock,       cls: "text-orange-600" },
            { label: "Em Negociação",  value: fmt(kpis.valorNegociacao), icon: TrendingUp, cls: "text-amber-600", isValue: true },
            { label: "Valor Aprovado", value: fmt(kpis.valorAprovado),   icon: DollarSign, cls: "text-green-600", isValue: true },
            { label: "Taxa Conversão", value: `${kpis.taxaConversao}%`,  icon: Percent,    cls: "text-pink-600",  isValue: true },
          ].map((k) => (
            <div key={k.label} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className={`w-4 h-4 ${k.cls}`} />
                <span className="text-xs text-gray-500">{k.label}</span>
              </div>
              <p className={`font-bold ${k.isValue ? "text-sm" : "text-xl"} ${k.cls}`}>{k.value}</p>
            </div>
          ))}
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
                  {["Nº", "Cliente", "Data", "Validade", "Valor", "Status", "Ações"].map((h) => (
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
                                  onClick={() => updateStatus.mutate({ id: row.id, status: "cancelado" })}
                                >
                                  <XCircle className="w-3.5 h-3.5 mr-2" /> Cancelar
                                </DropdownMenuItem>
                              )}
              {true && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setDeleteId(row.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir Orçamento
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

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O orçamento e todos os seus itens serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => { if (deleteId) deleteMutation.mutate({ id: deleteId }); setDeleteId(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
