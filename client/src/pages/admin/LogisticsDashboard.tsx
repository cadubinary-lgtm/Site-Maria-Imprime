import { Link } from "wouter";
import { ArrowRight, ClipboardList, MapPinned, Settings2, ShieldCheck, Truck } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

const LOGISTICS_MODULES = [
  {
    href: "/admin/logistica/transportadoras",
    title: "Transportadoras",
    description: "Cadastre, revise e ative as opções de entrega disponíveis.",
    icon: Truck,
  },
  {
    href: "/admin/logistica/regras-frete",
    title: "Regras de frete",
    description: "Organize regras de cobrança, regiões e condições de envio.",
    icon: Settings2,
  },
  {
    href: "/admin/logistica/expedicao",
    title: "Expedição",
    description: "Acompanhe pedidos preparados para postagem ou entrega.",
    icon: ClipboardList,
  },
  {
    href: "/admin/logistica/rastreamento",
    title: "Rastreamento",
    description: "Consulte atualizações de transporte e códigos de rastreio.",
    icon: MapPinned,
  },
] as const;

export function LogisticsDashboard() {
  return (
    <AdminLayout>
      <main className="space-y-6 p-5 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-pink-600">
              <Truck className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-semibold">Operação logística</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Logística</h1>
            <p className="mt-1 max-w-2xl text-gray-500">Configure fretes e transportadoras, acompanhe a expedição e consulte o rastreamento dos pedidos.</p>
          </div>
          <Link href="/admin/logistica/configuracoes" className="inline-flex min-h-10 items-center gap-2 rounded-md border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Configurações
          </Link>
        </header>

        <section className="rounded-xl border border-pink-200 bg-pink-50/70 p-4 sm:p-5" aria-labelledby="logistics-overview-title">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-pink-600 shadow-sm">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="logistics-overview-title" className="font-semibold text-gray-900">Central de operação</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">Use os módulos abaixo para manter as opções de entrega, expedição e rastreio organizadas. Cada área apresenta seus próprios dados e ações disponíveis.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="logistics-modules-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="logistics-modules-title" className="text-lg font-semibold text-gray-900">Módulos logísticos</h2>
            <span className="text-sm text-gray-500">{LOGISTICS_MODULES.length} áreas disponíveis</span>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Acessos aos módulos logísticos">
            {LOGISTICS_MODULES.map(({ href, title, description, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="group flex h-full min-h-44 flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-pink-700">{title}</h3>
                  <p className="mt-1 flex-1 text-sm leading-5 text-gray-500">{description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-pink-700">Acessar <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </AdminLayout>
  );
}
