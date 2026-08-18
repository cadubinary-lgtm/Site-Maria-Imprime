import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import {
  Receipt, FileText, CheckCircle, Clock, XCircle,
  ArrowRight, Settings, Plus, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendente", color: "bg-orange-100 text-orange-700", icon: <Clock className="w-3.5 h-3.5" /> },
  issued: { label: "Emitida", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
  voided: { label: "Anulada", color: "bg-gray-100 text-gray-700", icon: <XCircle className="w-3.5 h-3.5" /> },
  error: { label: "Erro", color: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

export default function GestaoFiscalDashboard() {
  const { data: metrics, isLoading } = trpc.gestaoFiscal.getFiscalMetrics.useQuery();
  const { data: settings } = trpc.gestaoFiscal.getSettings.useQuery();
  const { data: notesData } = trpc.gestaoFiscal.listNotes.useQuery({ page: 1, limit: 5, status: "all" });

  const recentNotes = notesData?.notes ?? [];

  const kpis = [
    {
      title: "Total de Notas",
      value: metrics?.total ?? 0,
      icon: <FileText className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      title: "Notas Emitidas",
      value: metrics?.issued ?? 0,
      sub: fmt(metrics?.totalIssued ?? 0),
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      title: "Pendentes",
      value: metrics?.pending ?? 0,
      icon: <Clock className="w-5 h-5" />,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    {
      title: "Canceladas",
      value: metrics?.cancelled ?? 0,
      icon: <XCircle className="w-5 h-5" />,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão Fiscal</h1>
            <p className="text-sm text-gray-500 mt-0.5">Controle de notas fiscais e configurações</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/fiscal/configuracoes">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" /> Configurações
              </Button>
            </Link>
            <Link href="/admin/fiscal/notas">
              <Button className="bg-pink-600 hover:bg-pink-700 text-white" size="sm">
                <Plus className="w-4 h-4 mr-2" aria-hidden="true" /> Nova Nota
              </Button>
            </Link>
          </div>
        </div>

        {/* Aviso de configuração */}
        {!settings?.cnpj && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Configurações fiscais incompletas</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Configure os dados da empresa para emitir notas fiscais.{" "}
                <Link href="/admin/fiscal/configuracoes" className="underline font-medium">
                  Configurar agora
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <Card key={kpi.title} className={`border ${kpi.border}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{kpi.title}</p>
                      <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
                      {kpi.sub && <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>}
                    </div>
                    <div className={`p-2 rounded-lg ${kpi.bg}`}>
                      <span className={kpi.color}>{kpi.icon}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Notas Recentes */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-pink-600" aria-hidden="true" />
                Notas Fiscais Recentes
              </CardTitle>
              <Link href="/admin/fiscal/notas">
                <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700">
                  Ver todas <ArrowRight className="w-3.5 h-3.5 ml-1" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentNotes.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma nota fiscal emitida ainda</p>
                <Link href="/admin/fiscal/notas">
                  <Button className="mt-3 bg-pink-600 hover:bg-pink-700 text-white" size="sm">
                    Emitir primeira nota
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Número</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Tipo</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentNotes.map((note) => {
                      const statusKey = note.status ?? "pending";
                      const statusCfg = STATUS_CONFIG[statusKey] ?? { label: statusKey, color: "bg-gray-100 text-gray-700", icon: undefined };
                      return (
                        <tr key={note.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {note.noteNumber || `#${note.id}`}
                          </td>
                          <td className="px-4 py-3 text-gray-700">{note.customerName || "—"}</td>
                          <td className="px-4 py-3">
                            <Badge className="text-xs bg-blue-100 text-blue-700 uppercase">{note.noteType}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs flex items-center gap-1 w-fit ${statusCfg.color}`}>
                              {statusCfg.icon ?? null}
                              {statusCfg.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            {fmt(parseFloat(note.totalValue || "0"))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Listar Notas Fiscais", href: "/admin/fiscal/notas", icon: <FileText className="w-4 h-4" />, color: "text-blue-600" },
            { label: "Configurações Fiscais", href: "/admin/fiscal/configuracoes", icon: <Settings className="w-4 h-4" />, color: "text-gray-600" },
            { label: "Gerenciador Financeiro", href: "/admin/gerenciador-financeiro", icon: <Receipt className="w-4 h-4" />, color: "text-pink-600" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-pink-300 hover:shadow-sm transition-all cursor-pointer">
                <span className={link.color}>{link.icon}</span>
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 ml-auto" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
