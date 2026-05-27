import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Loader2, Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

import { ProductVariationManager } from "@/components/ProductVariationManager";

export default function AdminDashboard() {
  const { data: orders, isLoading: ordersLoading } = trpc.admin.getAllOrders.useQuery();
  const { data: products, isLoading: productsLoading } = trpc.products.getAll.useQuery();

  // KPIs rápidos
  const totalOrders = orders?.length ?? 0;
  const totalProducts = products?.length ?? 0;
  const pendingOrders = orders?.filter((o) => o.status === "pedido_recebido" || o.status === "arte_em_analise" || o.status === "aguardando_aprovacao").length ?? 0;
  const totalRevenue = orders?.reduce((acc, o) => acc + parseFloat(o.totalPrice.toString()), 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do sistema</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{ordersLoading ? "..." : totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{ordersLoading ? "..." : pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{productsLoading ? "..." : totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Faturamento</p>
                <p className="text-xl font-bold text-gray-900">
                  {ordersLoading ? "..." : `R$ ${totalRevenue.toFixed(2)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atalhos rápidos */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/produtos">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Package className="w-4 h-4 mr-2" />
            Gerenciar Produtos
          </Button>
        </Link>
        <Link href="/admin/pedidos">
          <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Ver Pedidos
          </Button>
        </Link>
        <Link href="/admin/clientes-loja">
          <Button variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50">
            <Users className="w-4 h-4 mr-2" />
            Clientes da Loja
          </Button>
        </Link>
      </div>

      {/* Tabs: Variações e Pedidos recentes */}
      <Tabs defaultValue="variacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="variacoes">Gerenciar Variações</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos Recentes</TabsTrigger>
        </TabsList>

        {/* Variações Tab */}
        <TabsContent value="variacoes" className="mt-6">
          <ProductVariationManager />
        </TabsContent>

        {/* Pedidos Tab */}
        <TabsContent value="pedidos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>Últimos pedidos recebidos</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                </div>
              ) : orders && orders.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Pedido</th>
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Cliente</th>
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Valor</th>
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Status</th>
                          <th className="text-left py-2 px-4 text-sm font-semibold text-gray-600">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 10).map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4 font-semibold text-orange-600">{order.orderNumber}</td>
                            <td className="py-2 px-4 text-sm text-gray-700">Cliente #{order.clientId}</td>
                            <td className="py-2 px-4 text-sm font-medium">R$ {parseFloat(order.totalPrice.toString()).toFixed(2)}</td>
                            <td className="py-2 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                {order.status}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {orders.length > 10 && (
                    <div className="mt-4 text-center">
                      <Link href="/admin/pedidos">
                        <Button variant="outline" size="sm">Ver todos os {orders.length} pedidos</Button>
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600 text-center py-8">Nenhum pedido encontrado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
