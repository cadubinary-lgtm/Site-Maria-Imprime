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
  DollarSign, TrendingUp, TrendingDown, Plus, Pencil, Trash2, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

function formatCurrency(v: number | string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}
function formatDate(ts: any) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("pt-BR");
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
  const [periodo, setPeriodo] = useState<"7" | "30" | "90">("30");
  const [form, setForm] = useState<EntradaForm>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const startDate = Date.now() - parseInt(periodo) * 24 * 60 * 60 * 1000;
  const { data, isLoading, refetch } = trpc.financeiro.getFluxoCaixa.useQuery({ startDate });

  const addEntrada = trpc.financeiro.addEntradaManual.useMutation({
    onSuccess: () => { toast.success("Entrada adicionada!"); setDialogOpen(false); setForm(emptyForm); refetch(); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const editEntrada = trpc.financeiro.editEntradaManual.useMutation({
    onSuccess: () => { toast.success("Entrada atualizada!"); setDialogOpen(false); setEditId(null); setForm(emptyForm); refetch(); },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
          <p className="text-sm text-gray-500 mt-1">Entradas e saídas financeiras</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />Atualizar
          </Button>
          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Nova Entrada
          </Button>
        </div>
      </div>

      {/* Filtro período */}
      <div className="flex gap-2">
        {[["7","7 dias"],["30","30 dias"],["90","90 dias"]] .map(([v, l]) => (
          <Button key={v} variant={periodo === v ? "default" : "outline"} size="sm"
            onClick={() => setPeriodo(v as any)}
            className={periodo === v ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}>
            {l}
          </Button>
        ))}
      </div>

      {/* Cards de resumo */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
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
          <Card className={`border-0 shadow-sm ${data.netBalance >= 0 ? "bg-blue-50" : "bg-orange-50"}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${data.netBalance >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
                <DollarSign className={`h-5 w-5 ${data.netBalance >= 0 ? "text-blue-600" : "text-orange-600"}`} />
              </div>
              <div>
                <p className={`text-xs font-medium ${data.netBalance >= 0 ? "text-blue-700" : "text-orange-700"}`}>Saldo Líquido</p>
                <p className={`text-lg font-bold ${data.netBalance >= 0 ? "text-blue-800" : "text-orange-800"}`}>
                  {formatCurrency(data.netBalance)}
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
                    <span className={`font-bold ${day.balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      = {formatCurrency(day.balance)}
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
            <DialogTitle>{editId !== null ? "Editar Entrada" : "Nova Entrada Manual"}</DialogTitle>
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
  );
}
