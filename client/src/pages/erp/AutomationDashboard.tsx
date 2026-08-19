import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  Filter,
  History,
  Info,
  RefreshCw,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

type AutomationHealth = "active" | "attention" | "manual";
type ActivityStatus = "success" | "failure" | "prepared";

const HEALTH_META: Record<AutomationHealth, { label: string; className: string }> = {
  active: {
    label: "Ativa",
    className: "border-pink-200 bg-pink-50 text-pink-700",
  },
  attention: {
    label: "Exige atenção",
    className: "border-red-200 bg-red-50 text-red-700",
  },
  manual: {
    label: "Assistida",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
};

const ACTIVITY_META: Record<ActivityStatus, { label: string; className: string }> = {
  success: { label: "Concluída", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  failure: { label: "Falhou", className: "border-red-200 bg-red-50 text-red-700" },
  prepared: { label: "Preparada", className: "border-amber-200 bg-amber-50 text-amber-800" },
};

function formatExecution(value: number | null | undefined) {
  if (!value) return "Ainda não registrada";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ainda não registrada";

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AutomationDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const { data, isLoading, isError, error, refetch, isFetching } = trpc.automation.getDashboard.useQuery();

  const categories = useMemo(
    () => ["Todas", ...Array.from(new Set(data?.automations.map((automation) => automation.category) ?? []))],
    [data?.automations]
  );

  const filteredAutomations = useMemo(
    () => data?.automations.filter((automation) => selectedCategory === "Todas" || automation.category === selectedCategory) ?? [],
    [data?.automations, selectedCategory]
  );

  return (
    <AdminLayout>
      <main className="min-h-screen bg-slate-50 py-6 sm:py-8" aria-labelledby="automation-dashboard-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link href="/admin/relatorios">
                <Button variant="ghost" className="mb-3 -ml-3 text-slate-600 hover:bg-pink-50 hover:text-pink-700">
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Voltar para Relatórios
                </Button>
              </Link>
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-pink-600 p-3 text-white shadow-lg shadow-pink-200">
                  <Workflow className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-pink-600">Central operacional</p>
                  <h1 id="automation-dashboard-title" className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    Automações do site
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Consulte os gatilhos ativos, a situação atual, a última execução registrada e o resultado de cada rotina do sistema.
                  </p>
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Atualizar dados da central de automações"
              className="border-pink-200 bg-white text-pink-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-800"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Atualizar dados
            </Button>
          </div>

          <Card className="mb-6 border-pink-100 bg-gradient-to-r from-pink-50 via-white to-white shadow-sm">
            <CardContent className="flex gap-3 p-4 text-sm leading-6 text-slate-700 sm:p-5">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-pink-600" aria-hidden="true" />
              <p>
                Esta central diferencia eventos <strong>enviados</strong>, <strong>preparados</strong> e rotinas sem histórico persistido. Uma ação preparada não é exibida como enviada até que exista um registro real de conclusão.
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Carregando indicadores de automação" aria-busy="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="border-slate-200">
                  <CardContent className="space-y-3 p-5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-8 w-1/3 animate-pulse rounded bg-slate-200" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex gap-3 p-5 text-red-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Não foi possível carregar as automações.</p>
                  <p className="mt-1 text-sm">{error.message || "Atualize os dados ou tente novamente em alguns instantes."}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <section aria-label="Resumo das automações" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Rotinas mapeadas" value={data?.summary.total ?? 0} description="Gatilhos implementados no site" icon={Bot} tone="pink" />
                <SummaryCard label="Rotinas ativas" value={data?.summary.active ?? 0} description="Sem alerta no último resultado" icon={CheckCircle2} tone="emerald" />
                <SummaryCard label="Exigem atenção" value={data?.summary.attention ?? 0} description="Último registro indica falha" icon={AlertTriangle} tone="red" />
                <SummaryCard label="Com histórico" value={data?.summary.withHistory ?? 0} description="Possuem ao menos uma execução" icon={History} tone="slate" />
              </section>

              <section aria-labelledby="automation-list-title" className="mb-6">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 id="automation-list-title" className="text-xl font-bold text-slate-900">Catálogo de automações</h2>
                    <p className="mt-1 text-sm text-slate-600">Cada card detalha a rotina, sem confundir recursos manuais com envios automáticos.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2" aria-label="Filtrar automações por categoria">
                    <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    {categories.map((category) => (
                      <Button
                        key={category}
                        type="button"
                        size="sm"
                        variant="outline"
                        aria-pressed={selectedCategory === category}
                        onClick={() => setSelectedCategory(category)}
                        className={selectedCategory === category
                          ? "border-pink-600 bg-pink-600 text-white hover:bg-pink-700 hover:text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-700"}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {filteredAutomations.map((automation) => {
                    const health = HEALTH_META[automation.health as AutomationHealth];
                    return (
                      <Card key={automation.id} className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                        <CardHeader className="space-y-3 pb-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pink-600">{automation.category}</p>
                              <CardTitle className="mt-1 text-lg leading-6 text-slate-900">{automation.name}</CardTitle>
                            </div>
                            <Badge variant="outline" className={`shrink-0 ${health.className}`}>{health.label}</Badge>
                          </div>
                          <CardDescription className="leading-5 text-slate-600">{automation.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <dl className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gatilho</dt>
                              <dd className="mt-1 text-sm leading-5 text-slate-800">{automation.trigger}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Canal</dt>
                              <dd className="mt-1 text-sm leading-5 text-slate-800">{automation.channel}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Última execução</dt>
                              <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-800">
                                <Clock3 className="h-3.5 w-3.5 text-pink-600" aria-hidden="true" />
                                {formatExecution(automation.lastExecutedAt)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origem do status</dt>
                              <dd className="mt-1 text-sm leading-5 text-slate-800">{automation.tracking}</dd>
                            </div>
                          </dl>
                          <div className={automation.health === "attention" ? "rounded-xl border border-red-100 bg-red-50 p-3" : "rounded-xl border border-pink-100 bg-pink-50/60 p-3"}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resultado mais recente</p>
                            <p className={automation.health === "attention" ? "mt-1 text-sm leading-5 text-red-800" : "mt-1 text-sm leading-5 text-slate-700"}>{automation.result}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>

              <section aria-labelledby="automation-activity-title">
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-pink-50 p-2 text-pink-700">
                        <Activity className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle id="automation-activity-title">Últimas atividades rastreadas</CardTitle>
                        <CardDescription className="mt-1">Eventos armazenados em recibos, e-mails, lembretes e comunicações assistidas.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {data?.recentActivity.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th scope="col" className="px-5 py-3 font-semibold">Automação</th>
                              <th scope="col" className="px-5 py-3 font-semibold">Canal</th>
                              <th scope="col" className="px-5 py-3 font-semibold">Quando</th>
                              <th scope="col" className="px-5 py-3 font-semibold">Resultado</th>
                              <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.recentActivity.map((activity) => {
                              const activityMeta = ACTIVITY_META[activity.status as ActivityStatus];
                              return (
                                <tr key={activity.id} className="align-top hover:bg-slate-50/70">
                                  <td className="px-5 py-4">
                                    <p className="font-semibold text-slate-900">{activity.label}</p>
                                    <p className="mt-1 text-xs text-slate-500">{activity.source}</p>
                                  </td>
                                  <td className="px-5 py-4 text-slate-700">{activity.channel}</td>
                                  <td className="px-5 py-4 whitespace-nowrap text-slate-700">{formatExecution(activity.occurredAt)}</td>
                                  <td className="max-w-sm px-5 py-4 leading-5 text-slate-600">{activity.result}</td>
                                  <td className="px-5 py-4"><Badge variant="outline" className={activityMeta.className}>{activityMeta.label}</Badge></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <Bot className="mx-auto h-8 w-8 text-pink-300" aria-hidden="true" />
                        <p className="mt-3 font-semibold text-slate-800">Ainda não há atividades rastreadas.</p>
                        <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-slate-600">Quando uma rotina registrada for executada, o resultado aparecerá aqui com canal, data e situação.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            </>
          )}
        </div>
      </main>
    </AdminLayout>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Bot;
  tone: "pink" | "emerald" | "red" | "slate";
}) {
  const styles = {
    pink: "bg-pink-50 text-pink-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${styles}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
