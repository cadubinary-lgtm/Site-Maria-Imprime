import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { ShoppingCart, Settings, Zap, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">GP</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Gráfica Ponto Digital</h1>
            </div>
            <a href={getLoginUrl()}>
              <Button>Entrar</Button>
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Produtos Personalizados para Seu Negócio
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Adesivos, lonas, banners e muito mais. Produção própria com qualidade garantida.
            </p>
            <a href={getLoginUrl()}>
              <Button size="lg" className="gap-2">
                Começar Agora <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle>Catálogo Completo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Explore produtos para alimentação, beleza, varejo e serviços.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-orange-500 mb-2" />
                <CardTitle>Entrega Rápida</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Produção própria com prazos que você define.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle>Personalização Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Customize cores, tamanhos e acabamentos conforme sua necessidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  // Usuário autenticado
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">GP</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Gráfica Ponto Digital</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <Button variant="outline" size="sm">
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {user?.name?.split(" ")[0]}!
          </h2>
          <p className="text-gray-600">
            Seu papel: <span className="font-semibold capitalize">{user?.role}</span>
          </p>
        </div>

        {/* Role-based navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {user?.role === "user" && (
            <>
              <Link href="/catalogo">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <ShoppingCart className="w-8 h-8 text-blue-600 mb-2" />
                    <CardTitle>Catálogo de Produtos</CardTitle>
                    <CardDescription>Explore nossos produtos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Escolha produtos, faça upload de sua arte e realize o pedido.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/meus-pedidos">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Zap className="w-8 h-8 text-orange-500 mb-2" />
                    <CardTitle>Meus Pedidos</CardTitle>
                    <CardDescription>Acompanhe seus pedidos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Veja o status em tempo real de todos os seus pedidos.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}

          {user?.role === "admin" && (
            <Link href="/admin">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Settings className="w-8 h-8 text-green-600 mb-2" />
                  <CardTitle>Painel Admin</CardTitle>
                  <CardDescription>Gerenciar produtos e pedidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Crie, edite e remova produtos. Visualize todos os pedidos.
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}

          {user?.role === "production" && (
            <Link href="/producao">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Zap className="w-8 h-8 text-orange-500 mb-2" />
                  <CardTitle>Painel de Produção</CardTitle>
                  <CardDescription>Kanban de pedidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Gerencie o status dos pedidos em tempo real com Kanban.
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
