import { Link } from "wouter";
import { ImageIcon, Package, Plus, Tag, Wallet } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getProductDashboardMetrics } from "@/lib/product-dashboard-metrics";

export default function AdminProductsDashboard() {
  const { data: products = [], isLoading } = trpc.products.getAll.useQuery();
  const { data: segments = [] } = trpc.segments.getAll.useQuery();
  const metrics = getProductDashboardMetrics(products as any[]);
  const recentProducts = [...products].slice(0, 5) as any[];

  const cards = [
    { label: "Produtos cadastrados", value: metrics.total, detail: "Itens disponíveis no catálogo", icon: Package, tone: "text-pink-600" },
    { label: "Com imagem", value: metrics.withImage, detail: "Capa ou galeria configurada", icon: ImageIcon, tone: "text-blue-600" },
    { label: "Sem imagem", value: metrics.withoutImage, detail: "Precisam de atenção visual", icon: ImageIcon, tone: "text-amber-600" },
    { label: "Com preço", value: metrics.withPrice, detail: "Valor base configurado", icon: Wallet, tone: "text-green-600" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 admin-visual-system">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-2xl font-bold text-gray-900">Dashboard de Produtos</h1><p className="mt-0.5 text-sm text-gray-500">Acompanhe a qualidade e a configuração do catálogo.</p></div>
          <div className="flex gap-2"><Link href="/admin/produtos"><Button variant="outline">Ver todos</Button></Link><Link href="/admin/novo-produto"><Button className="bg-pink-600 text-white hover:bg-pink-700"><Plus className="mr-2 h-4 w-4" />Novo produto</Button></Link></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => { const Icon = card.icon; return <Card key={card.label}><CardContent className="p-4"><div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${card.tone}`} /><p className="text-xs font-medium text-gray-500">{card.label}</p></div><p className={`mt-2 text-2xl font-bold ${card.tone}`}>{isLoading ? "—" : card.value}</p><p className="mt-1 text-xs text-gray-400">{card.detail}</p></CardContent></Card>; })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card><CardHeader><CardTitle className="text-base">Produtos recentes</CardTitle><CardDescription>Atalhos para revisar os itens cadastrados no catálogo.</CardDescription></CardHeader><CardContent>
            {isLoading ? <p className="text-sm text-gray-400">Carregando catálogo...</p> : recentProducts.length > 0 ? <div className="space-y-2">{recentProducts.map((product) => <Link key={product.id} href="/admin/produtos" className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 transition-colors hover:border-pink-200 hover:bg-pink-50"><div className="h-10 w-10 overflow-hidden rounded-md bg-gray-100">{product.imageUrl ? <img src={product.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package className="m-3 h-4 w-4 text-gray-400" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-800">{product.name}</p><p className="text-xs text-gray-400">Abrir catálogo para editar</p></div></Link>)}</div> : <p className="text-sm text-gray-400">Nenhum produto cadastrado.</p>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4 text-pink-600" />Segmentos do catálogo</CardTitle><CardDescription>Organização disponível para classificar produtos.</CardDescription></CardHeader><CardContent><p className="text-3xl font-bold text-pink-600">{segments.length}</p><p className="mt-1 text-sm text-gray-500">segmento(s) cadastrado(s)</p><Link href="/admin/segmentos"><Button variant="outline" className="mt-4 w-full">Gerenciar segmentos</Button></Link></CardContent></Card>
        </div>
      </div>
    </AdminLayout>
  );
}
