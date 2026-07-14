import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useSearch } from "wouter";
import { Search, ChevronRight, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PRE_PRODUCTION_STATUS: Record<string, { label: string; color: string }> = {
  liberado_analise:    { label: "Liberado para Análise",  color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  arte_final_aprovada: { label: "Arte Final Aprovada",    color: "bg-green-100 text-green-800 border-green-200" },
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  pagamento_aprovado: "Pagamento Aprovado",
  pagamento_retirada: "Pagamento Retirada",
  analisando:         "Analisado",
  com_problemas:      "Com Problemas",
  em_producao:        "Em Produção",
  pronto_entrega:     "Pronto p/ Entrega",
  pronto_retirada:    "Pronto p/ Retirada",
  entregue:           "Entregue",
  cancelado:          "Cancelado",
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (d: any) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";

export default function AdminPreImpressao() {
  const searchStr = useSearch();
  const urlStatus = new URLSearchParams(searchStr).get("status") || "todos";
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>(urlStatus);

  useEffect(() => {
    const s = new URLSearchParams(searchStr).get("status") || "todos";
    setFilterStatus(s);
  }, [searchStr]);
  const utils = trpc.useUtils();

  const { data: allOrders = [], isLoading } = trpc.checkout.getAllOrders.useQuery();

  const updatePreProductionMutation = trpc.admin.updatePreProductionStatus.useMutation({
    onSuccess: () => {
      toast.success("Status de pré-impressão atualizado!");
      utils.checkout.getAllOrders.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar status"),
  });

  const filtered = useMemo(() => {
    return (allOrders as any[])
      .filter((o) => {
        const matchStatus = filterStatus === "todos" || (o.preProductionStatus || "liberado_analise") === filterStatus;
        const matchSearch =
          !search ||
          o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
          o.deliveryFullName?.toLowerCase().includes(search.toLowerCase()) ||
          o.deliveryPhone?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allOrders, filterStatus, search]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-orange-500" />
              Pré-Impressão
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Gerencie o status de pré-impressão dos pedidos
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Layers className="w-4 h-4" />
            {filtered.length} pedido{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por número, cliente ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["todos", "liberado_analise", "arte_final_aprovada"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterStatus === s
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s === "todos" ? "Todos" : PRE_PRODUCTION_STATUS[s]?.label ?? s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((order: any) => {
              const currentPreStatus = order.preProductionStatus || "liberado_analise";
              const statusCfg = PRE_PRODUCTION_STATUS[currentPreStatus];
              return (
                <Card key={order.orderId ?? order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Info do pedido */}
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            #{order.orderNumber}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {ORDER_STATUS_LABEL[order.status] ?? order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.deliveryFullName} • {order.deliveryPhone} • {fmtDate(order.createdAt)}
                        </p>
                        <p className="text-xs font-semibold text-gray-700 mt-1">
                          {fmt(Number(order.totalAmount ?? order.totalPrice ?? 0))}
                        </p>
                      </div>

                      {/* Status de Pré-Impressão */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">Pré-Impressão:</span>
                        <Badge className={`text-xs border ${statusCfg?.color}`}>
                          {statusCfg?.label ?? currentPreStatus}
                        </Badge>
                      </div>

                      {/* Status de pré-impressão é gerenciado por item na tela de detalhes */}

                      {/* Link para detalhes */}
                      <Link href={`/admin/pedidos/${order.orderId ?? order.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                          Detalhes
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
