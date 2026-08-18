import { useState } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, TrendingDown, ChevronLeft, Plus, AlertCircle,
  DollarSign, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

export default function FluxoCaixa() {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [entryType, setEntryType] = useState<"income" | "expense">("income");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entryCategory, setEntryCategory] = useState("");

  const now = Date.now();
  const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const startOfQuarter = new Date(); startOfQuarter.setDate(startOfQuarter.getDate() - 90);

  const startDate = period === "week" ? startOfWeek.getTime() : period === "month" ? startOfMonth.getTime() : startOfQuarter.getTime();

  const { data, isLoading, refetch } = trpc.gerenciadorFinanceiro.getCashFlow.useQuery({
    startDate,
    endDate: now,
    groupBy,
  });

  const addEntry = trpc.gerenciadorFinanceiro.addCashFlowEntry.useMutation({
    onSuccess: () => {
      toast.success("Lançamento adicionado com sucesso!");
      setShowAddDialog(false);
      setEntryAmount("");
      setEntryDescription("");
      setEntryCategory("");
      refetch();
    },
    onError: (e) => toast.error("Erro ao adicionar lançamento: " + e.message),
  });

  const cashFlowData = data?.cashFlowData ?? [];
  const manualEntries = data?.manualEntries ?? [];

  const handleAddEntry = () => {
    const amount = parseFloat(entryAmount.replace(",", "."));
    if (!amount || amount <= 0) {
      toast.error("Valor inválido");
      return;
    }
    addEntry.mutate({
      entryType,
      amount,
      description: entryDescription || undefined,
      category: entryCategory || undefined,
      entryDate: Date.now(),
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/gerenciador-financeiro">
              <span className="inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-50 hover:text-pink-800">
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" /> Voltar
              </span>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
              <p className="text-sm text-gray-500">Entradas e saídas financeiras</p>
            </div>
          </div>
          <Button type="button" onClick={() => setShowAddDialog(true)} className="bg-pink-600 hover:bg-pink-700 text-white">
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Novo Lançamento
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" aria-hidden="true" />
                <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Total Entradas</p>
              </div>
              <p className="text-2xl font-bold text-green-700 mt-1">{fmt(data?.totalIncome ?? 0)}</p>
            </CardContent>
          </Card>
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" aria-hidden="true" />
                <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Total Saídas</p>
              </div>
              <p className="text-2xl font-bold text-red-700 mt-1">{fmt(data?.totalExpense ?? 0)}</p>
            </CardContent>
          </Card>
          <Card className={`border ${(data?.netBalance ?? 0) >= 0 ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${(data?.netBalance ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`} aria-hidden="true" />
                <p className={`text-xs font-medium uppercase tracking-wide ${(data?.netBalance ?? 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>Saldo Líquido</p>
              </div>
              <p className={`text-2xl font-bold mt-1 ${(data?.netBalance ?? 0) >= 0 ? "text-blue-700" : "text-red-700"}`}>
                {fmt(data?.netBalance ?? 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["week", "month", "quarter"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-700"
                }`}
                aria-pressed={period === p}
              >
                {p === "week" ? "7 dias" : p === "month" ? "Mês" : "90 dias"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["day", "week", "month"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  groupBy === g ? "bg-pink-600 text-white" : "bg-white text-gray-600 hover:bg-pink-50 hover:text-pink-700"
                }`}
                aria-pressed={groupBy === g}
              >
                {g === "day" ? "Diário" : g === "week" ? "Semanal" : "Mensal"}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Evolução do Fluxo de Caixa</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-2 border-pink-600 border-t-transparent rounded-full" aria-label="Carregando fluxo de caixa" />
              </div>
            ) : cashFlowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Entradas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" aria-hidden="true" />
                  <p className="text-sm">Nenhum dado no período</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lançamentos Manuais */}
        {manualEntries.length > 0 && (
          <Card className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Lançamentos Manuais</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Categoria</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Descrição</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manualEntries.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600">{fmtDate(entry.entryDate)}</td>
                        <td className="px-4 py-3">
                          <Badge className={entry.entryType === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                            {entry.entryType === "income" ? "Entrada" : "Saída"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{entry.category || "—"}</td>
                        <td className="px-4 py-3 text-gray-600">{entry.description || "—"}</td>
                        <td className={`px-4 py-3 text-right font-semibold ${entry.entryType === "income" ? "text-green-600" : "text-red-600"}`}>
                          {entry.entryType === "income" ? "+" : "-"}{fmt(parseFloat(entry.amount || "0"))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog Novo Lançamento */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento Manual</DialogTitle>
          </DialogHeader>
          <form id="cash-flow-entry-form" className="space-y-4 py-2" onSubmit={(event) => { event.preventDefault(); handleAddEntry(); }}>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEntryType("income")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  entryType === "income" ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-600 border-gray-200"
                }`}
                aria-pressed={entryType === "income"}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setEntryType("expense")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  entryType === "expense" ? "bg-red-500 text-white border-red-500" : "bg-white text-gray-600 border-gray-200"
                }`}
                aria-pressed={entryType === "expense"}
              >
                Saída
              </button>
            </div>
            <div>
              <label htmlFor="cash-flow-entry-amount" className="text-sm font-medium text-gray-700">Valor (R$)</label>
              <Input
                id="cash-flow-entry-amount"
                type="number"
                placeholder="0,00"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="cash-flow-entry-category" className="text-sm font-medium text-gray-700">Categoria</label>
              <Input
                id="cash-flow-entry-category"
                placeholder="Ex: Aluguel, Material, Venda..."
                value={entryCategory}
                onChange={(e) => setEntryCategory(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="cash-flow-entry-description" className="text-sm font-medium text-gray-700">Descrição</label>
              <Input
                id="cash-flow-entry-description"
                placeholder="Descrição do lançamento"
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
                className="mt-1"
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
            <Button
              type="submit"
              form="cash-flow-entry-form"
              disabled={addEntry.isPending}
              className="bg-pink-600 hover:bg-pink-700 text-white"
              aria-busy={addEntry.isPending}
            >
              {addEntry.isPending ? "Salvando..." : "Salvar Lançamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
