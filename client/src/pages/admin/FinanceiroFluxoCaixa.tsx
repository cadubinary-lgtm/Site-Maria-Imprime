import { useMemo, useState } from "react";
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
  DollarSign, TrendingUp, TrendingDown, Plus, Pencil, Trash2, RefreshCw, CalendarDays, Wallet, Download
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";

function formatCurrency(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function formatDate(ts: any) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("pt-BR");
}

function toDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function formatCurrencyForExport(value: number | string) {
  return Number(value).toFixed(2).replace(".", ",");
}

const CATEGORIAS_ENTRADA = ["Vendas", "Serviços", "Outros Recebimentos", "Transferência Recebida"];
const CATEGORIAS_SAIDA = ["Fornecedores", "Aluguel", "Funcionários", "Marketing", "Equipamentos", "Impostos", "Outros Gastos"];

interface EntradaForm {
  tipo: "income" | "expense";
  categoria: string;
  descricao: string;
  valor: string;
  data: string;
}

const emptyForm: EntradaForm = {
  tipo: "income",
  categoria: "",
  descricao: "",
  valor: "",
  data: new Date().toISOString().split("T")[0],
};

export default function FinanceiroFluxoCaixa() {
  const [periodo, setPeriodo] = useState<"1" | "7" | "30" | "90" | "custom">("30");
  const [startDate, setStartDate] = useState(() => {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return toDateInput(start);
  });
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()));
  const [form, setForm] = useState<EntradaForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const queryInput = useMemo(() => ({
    startDate: new Date(`${startDate}T00:00:00`).getTime(),
    endDate: new Date(`${endDate}T23:59:59.999`).getTime(),
    groupBy: "day" as const,
  }), [startDate, endDate]);
  const { data, isLoading, refetch } = trpc.financeiro.getFluxoCaixa.useQuery(queryInput, {
    enabled: queryInput.startDate <= queryInput.endDate,
  });

  const applyPeriod = (days: 1 | 7 | 30 | 90) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    setPeriodo(String(days) as "1" | "7" | "30" | "90");
    setStartDate(toDateInput(start));
    setEndDate(toDateInput(end));
  };

  const addEntrada = trpc.financeiro.addEntradaManual.useMutation({
    onSuccess: () => { toast.success("Movimentação adicionada!"); setDialogOpen(false); setForm(emptyForm); refetch(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const editEntrada = trpc.financeiro.editEntradaManual.useMutation({
    onSuccess: () => { toast.success("Movimentação atualizada!"); setDialogOpen(false); setEditId(null); setForm(emptyForm); refetch(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteEntrada = trpc.financeiro.deleteEntradaManual.useMutation({
    onSuccess: () => { toast.success("Entrada removida!"); setDeleteId(null); refetch(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const handleSubmit = () => {
    if (!form.categoria || !form.valor || !form.data) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const payload = {
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao || undefined,
      valor: parseFloat(form.valor),
      data: new Date(form.data).getTime(),
    };
    if (editId !== null) {
      editEntrada.mutate({ id: editId, ...payload });
    } else {
      addEntrada.mutate(payload);
    }
  };

  const openEdit = (e: any) => {
    setEditId(e.entryId);
    setForm({
      tipo: e.tipo,
      categoria: e.categoria || "",
      descricao: e.descricao || "",
      valor: String(e.valor),
      data: new Date(e.data).toISOString().split("T")[0],
    });
    setDialogOpen(true);
  };

  const categorias = form.tipo === "income" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;
  const exportFileName = `fluxo-caixa_${startDate}_a_${endDate}`;

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Relatório de Fluxo de Caixa", `Período: ${formatDate(data.startDate)} a ${formatDate(data.endDate)}`],
      ["Saldo inicial", formatCurrencyForExport(data.openingBalance)],
      ["Entradas no período", formatCurrencyForExport(data.totalIncome)],
      ["Saídas no período", formatCurrencyForExport(data.totalExpense)],
      ["Saldo final", formatCurrencyForExport(data.closingBalance)],
      [],
      ["Data", "Tipo", "Categoria", "Descrição", "Origem", "Valor", "Saldo acumulado"],
      ...data.timeline.flatMap((day: any) => day.entries.map((entry: any) => [
        formatDate(entry.data),
        entry.tipo === "income" ? "Entrada" : "Saída",
        entry.categoria || "",
        entry.descricao || "",
        entry.origem === "automatico" ? "Automático" : "Manual",
        formatCurrencyForExport(entry.valor),
        formatCurrencyForExport(day.closingBalance),
      ])),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exportFileName}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso.");
  };

  const exportPdf = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 16;
    const nextLine = (height = 6) => {
      if (y + height > pageHeight - 14) {
        doc.addPage();
        y = 14;
      }
    };
    const write = (text: string, x: number, options?: { bold?: boolean; color?: [number, number, number]; size?: number }) => {
      doc.setFont("helvetica", options?.bold ? "bold" : "normal");
      doc.setFontSize(options?.size ?? 9);
      doc.setTextColor(...(options?.color ?? [40, 40, 40]));
      doc.text(text, x, y);
    };

    doc.setFillColor(236, 0, 110);
    doc.rect(0, 0, pageWidth, 10, "F");
    write("MARIA IMPRIME — FLUXO DE CAIXA", 14, { bold: true, color: [255, 255, 255], size: 13 });
    y = 20;
    write(`Período: ${formatDate(data.startDate)} a ${formatDate(data.endDate)}`, 14, { size: 9, color: [90, 90, 90] });
    y += 8;
    write(`Saldo inicial: ${formatCurrency(data.openingBalance)}`, 14, { bold: true });
    write(`Entradas: ${formatCurrency(data.totalIncome)}`, 84, { bold: true, color: [22, 130, 73] });
    write(`Saídas: ${formatCurrency(data.totalExpense)}`, 142, { bold: true, color: [190, 24, 93] });
    write(`Saldo final: ${formatCurrency(data.closingBalance)}`, 202, { bold: true, color: data.closingBalance >= 0 ? [37, 99, 235] : [190, 24, 93] });
    y += 10;
    doc.setDrawColor(225, 225, 225);
    doc.line(14, y - 4, pageWidth - 14, y - 4);

    for (const day of data.timeline as any[]) {
      nextLine(9);
      write(`${formatDate(`${day.date}T12:00:00`)}  |  Entradas: ${formatCurrency(day.income)}  |  Saídas: ${formatCurrency(day.expense)}  |  Saldo acumulado: ${formatCurrency(day.closingBalance)}`, 14, { bold: true, color: [65, 65, 65] });
      y += 6;
      for (const entry of day.entries as any[]) {
        nextLine(6);
        const description = (entry.descricao || entry.categoria || "Movimentação").slice(0, 68);
        write(entry.tipo === "income" ? "Entrada" : "Saída", 18, { size: 8, color: entry.tipo === "income" ? [22, 130, 73] : [190, 24, 93] });
        write((entry.categoria || "Outros").slice(0, 28), 48, { size: 8 });
        write(description, 92, { size: 8 });
        write(entry.origem === "automatico" ? "Automático" : "Manual", 205, { size: 8, color: [90, 90, 90] });
        write(`${entry.tipo === "income" ? "+" : "-"}${formatCurrency(entry.valor)}`, 236, { bold: true, size: 8, color: entry.tipo === "income" ? [22, 130, 73] : [190, 24, 93] });
        y += 5;
      }
      y += 2;
    }
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 14, pageHeight - 7);
    doc.save(`${exportFileName}.pdf`);
    toast.success("PDF exportado com sucesso.");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
          <p className="text-sm text-gray-500 mt-1">Entradas e saídas financeiras</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />Atualizar
          </Button>
          <Button variant="outline" size="sm" disabled={!data?.timeline.length} onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" />CSV
          </Button>
          <Button variant="outline" size="sm" disabled={!data?.timeline.length} onClick={exportPdf}>
            <Download className="h-4 w-4 mr-1" />PDF
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Nova movimentação
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            {([[1, "Hoje"], [7, "7 dias"], [30, "30 dias"], [90, "90 dias"]] as const).map(([days, label]) => (
              <Button key={days} variant={periodo === String(days) ? "default" : "outline"} size="sm"
                onClick={() => applyPeriod(days)}
                className={periodo === String(days) ? "bg-blue-600 text-white hover:bg-blue-700" : ""}>
                {label}
              </Button>
            ))}
          </div>
          <label className="grid gap-1 text-xs font-medium text-gray-600">
            Data inicial
            <Input type="date" value={startDate} onChange={(event) => { setPeriodo("custom"); setStartDate(event.target.value); }} className="h-9" />
          </label>
          <label className="grid gap-1 text-xs font-medium text-gray-600">
            Data final
            <Input type="date" value={endDate} onChange={(event) => { setPeriodo("custom"); setEndDate(event.target.value); }} className="h-9" />
          </label>
          <div className="flex items-center gap-1 text-xs text-gray-500"><CalendarDays className="h-3.5 w-3.5" />Período de movimentação</div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 bg-slate-50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-slate-100 p-2"><Wallet className="h-5 w-5 text-slate-600" /></div>
              <div><p className="text-xs font-medium text-slate-600">Saldo inicial</p><p className="text-lg font-bold text-slate-800">{formatCurrency(data.openingBalance)}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-700 font-medium">Total Entradas</p>
                <p className="text-lg font-bold text-green-800">{formatCurrency(data.totalIncome)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-700 font-medium">Total Saídas</p>
                <p className="text-lg font-bold text-red-800">{formatCurrency(data.totalExpense)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className={`border-0 shadow-sm ${data.closingBalance >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${data.closingBalance >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
                <DollarSign className={`h-5 w-5 ${data.closingBalance >= 0 ? "text-blue-600" : "text-orange-600"}`} />
              </div>
              <div>
                <p className={`text-xs font-medium ${data.closingBalance >= 0 ? "text-blue-700" : "text-orange-700"}`}>Saldo final</p>
                <p className={`text-lg font-bold ${data.closingBalance >= 0 ? "text-blue-800" : "text-orange-800"}`}>
                  {formatCurrency(data.closingBalance)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="p-8 text-center text-gray-400">Carregando...</div>
      ) : data?.timeline.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>Nenhum movimento no período</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data?.timeline.map((day, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader className="py-3 px-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    {new Date(day.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-green-600 font-medium">+{formatCurrency(day.income)}</span>
                    {day.expense > 0 && <span className="text-red-600 font-medium">-{formatCurrency(day.expense)}</span>}
                    <span className={`font-bold ${day.closingBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      Saldo acumulado: {formatCurrency(day.closingBalance)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {day.entries.map((entry: any, j: number) => (
                  <div key={j} className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-gray-50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${entry.tipo === "income" ? "bg-green-500" : "bg-red-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{entry.descricao || entry.categoria}</p>
                      <p className="text-xs text-gray-500">{entry.categoria}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${entry.origem === "automatico" ? "bg-gray-50" : "bg-white"}`}>
                      {entry.origem === "automatico" ? "Auto" : "Manual"}
                    </Badge>
                    <span className={`text-sm font-semibold flex-shrink-0 ${entry.tipo === "income" ? "text-green-600" : "text-red-600"}`}>
                      {entry.tipo === "income" ? "+" : "-"}{formatCurrency(entry.valor)}
                    </span>
                    {entry.origem === "manual" && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(entry)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => setDeleteId(entry.entryId)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog: Nova/Editar Entrada */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setDialogOpen(false); setEditId(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId !== null ? "Editar movimentação" : "Nova movimentação manual"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "income", label: "Entrada", color: "border-green-500 bg-green-50 text-green-700" },
                  { value: "expense", label: "Saída", color: "border-red-500 bg-red-50 text-red-700" },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(f => ({ ...f, tipo: opt.value as any, categoria: "" }))}
                    className={`p-3 rounded-lg border-2 font-medium text-sm transition-all ${form.tipo === opt.value ? opt.color : "border-gray-200 hover:border-gray-300"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Categoria *</label>
              <Select value={form.categoria} onValueChange={(v) => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Descrição</label>
              <Input placeholder="Descrição opcional" value={form.descricao}
                onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Valor (R$) *</label>
                <Input type="number" step="0.01" min="0.01" placeholder="0,00" value={form.valor}
                  onChange={(e) => setForm(f => ({ ...f, valor: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Data *</label>
                <Input type="date" value={form.data}
                  onChange={(e) => setForm(f => ({ ...f, data: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditId(null); setForm(emptyForm); }}>
              Cancelar
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={addEntrada.isPending || editEntrada.isPending}
              onClick={handleSubmit}>
              {addEntrada.isPending || editEntrada.isPending ? "Salvando..." : editId !== null ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar exclusão */}
      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Entrada</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">Tem certeza que deseja remover esta entrada do fluxo de caixa?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="destructive" disabled={deleteEntrada.isPending}
              onClick={() => deleteId !== null && deleteEntrada.mutate({ id: deleteId })}>
              {deleteEntrada.isPending ? "Removendo..." : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
