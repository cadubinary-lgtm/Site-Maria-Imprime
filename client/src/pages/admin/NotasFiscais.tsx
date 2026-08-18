import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  Receipt, ChevronLeft, ChevronRight, Plus, AlertCircle,
  CheckCircle, Clock, XCircle, Eye, Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const fmt = (v: number | string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-orange-100 text-orange-700" },
  issued: { label: "Emitida", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700" },
  voided: { label: "Anulada", color: "bg-gray-100 text-gray-700" },
  error: { label: "Erro", color: "bg-red-100 text-red-700" },
};

export default function NotasFiscais() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"pending" | "issued" | "cancelled" | "voided" | "error" | "all">("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [noteType, setNoteType] = useState<"nfse" | "nfe">("nfse");
  const [customerName, setCustomerName] = useState("");
  const [customerDoc, setCustomerDoc] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [description, setDescription] = useState("");
  const [noteToCancel, setNoteToCancel] = useState<any | null>(null);
  const limit = 20;

  const { data, isLoading, refetch } = trpc.gestaoFiscal.listNotes.useQuery({
    page,
    limit,
    status: statusFilter,
  });

  const createNote = trpc.gestaoFiscal.createNote.useMutation({
    onSuccess: () => {
      toast.success("Nota fiscal criada com sucesso!");
      setShowCreateDialog(false);
      setOrderId(""); setCustomerName(""); setCustomerDoc(""); setTotalValue(""); setDescription("");
      refetch();
    },
    onError: (e) => toast.error("Erro ao criar nota: " + e.message),
  });

  const updateNoteStatus = trpc.gestaoFiscal.updateNoteStatus.useMutation({
    onSuccess: () => { toast.success("Nota cancelada."); setNoteToCancel(null); refetch(); },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const notes = data?.notes ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const handleCreate = () => {
    const val = parseFloat(totalValue.replace(",", "."));
    if (!val || val <= 0) { toast.error("Valor inválido"); return; }
    createNote.mutate({
      orderId: orderId ? parseInt(orderId) : 0,
      noteType,
      customerName: customerName || undefined,
      customerCpf: customerDoc || undefined,
      totalValue: val,
      notes: description || undefined,
      items: [],
    });
  };

  const handleConfirmCancel = () => {
    if (noteToCancel) updateNoteStatus.mutate({ id: noteToCancel.id, status: "cancelled" });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/fiscal">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notas Fiscais</h1>
              <p className="text-sm text-gray-500">Gestão de notas fiscais emitidas</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" /> Nova Nota
          </Button>
        </div>

        {/* Filtros de status */}
        <div className="flex gap-2 flex-wrap">
          {([
            { key: "all" as const, label: "Todas" },
            { key: "pending" as const, label: "Pendentes" },
            { key: "issued" as const, label: "Emitidas" },
            { key: "cancelled" as const, label: "Canceladas" },
            { key: "error" as const, label: "Com Erro" },
          ]).map((s) => (
            <button
              key={s.key}
              onClick={() => { setStatusFilter(s.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === s.key
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-500" />
              Notas Fiscais ({total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : notes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma nota fiscal encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Pedido</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((note) => {
                      const statusKey = note.status ?? "pending";
                      const statusCfg = STATUS_CONFIG[statusKey] ?? { label: statusKey, color: "bg-gray-100 text-gray-700" };
                      return (
                        <tr key={note.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {note.noteNumber || `#${note.id}`}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {note.orderId ? (
                              <Link href={`/admin/pedidos/${note.orderId}`} className="text-orange-600 hover:underline">
                                #{note.orderId}
                              </Link>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{note.customerName || "—"}</p>
                            <p className="text-xs text-gray-400">{note.customerCpf || note.customerCnpj || ""}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="text-xs bg-blue-100 text-blue-700 uppercase">{note.noteType}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{fmtDate(note.issueDate ? new Date(note.issueDate) : note.createdAt)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {fmt(note.totalValue || "0")}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {note.pdfUrl && (
                                <a href={note.pdfUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm" className="h-7 px-2">
                                    <Download className="w-3.5 h-3.5" />
                                  </Button>
                                </a>
                              )}
                              {(statusKey === "pending" || statusKey === "issued") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-red-500 hover:text-red-700"
                                  onClick={() => setNoteToCancel(note)}
                                  disabled={updateNoteStatus.isPending}
                                  aria-label={`Cancelar nota fiscal ${note.noteNumber || `#${note.id}`}`}
                                >
                                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Página {page} de {totalPages}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nova Nota */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Nota Fiscal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Tipo de Nota</label>
              <div className="flex gap-2 mt-1">
                {(["nfse", "nfe"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNoteType(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border uppercase transition-colors ${
                      noteType === t ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pedido (opcional)</label>
              <Input
                type="number"
                placeholder="ID do pedido"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Nome do Cliente</label>
              <Input
                placeholder="Nome completo ou razão social"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">CPF/CNPJ</label>
              <Input
                placeholder="000.000.000-00"
                value={customerDoc}
                onChange={(e) => setCustomerDoc(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Valor Total (R$)</label>
              <Input
                type="number"
                placeholder="0,00"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Descrição do Serviço</label>
              <Input
                placeholder="Ex: Impressão de adesivos personalizados"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={createNote.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createNote.isPending ? "Criando..." : "Criar Nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={Boolean(noteToCancel)} onOpenChange={(open) => !open && setNoteToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar a nota fiscal {noteToCancel?.noteNumber || (noteToCancel ? `#${noteToCancel.id}` : "")}?</AlertDialogTitle>
            <AlertDialogDescription>O cancelamento será registrado na gestão fiscal e esta nota não poderá mais ser utilizada como emitida.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateNoteStatus.isPending}>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={updateNoteStatus.isPending} aria-busy={updateNoteStatus.isPending} onClick={(event) => { event.preventDefault(); handleConfirmCancel(); }}>
              {updateNoteStatus.isPending ? "Cancelando..." : "Cancelar nota"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
