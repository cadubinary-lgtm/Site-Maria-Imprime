import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, User, MapPin, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MyAccountPage() {
  const { user, logout, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Minha Conta</h1>
          <p className="text-gray-600 mt-2">Gerencie suas informações e pedidos</p>
        </div>

        <Tabs defaultValue="perfil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="endereco">Endereços</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
                <CardDescription>Atualize seus dados de perfil</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={user.name || ""}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      value={user.email || ""}
                      readOnly
                      className="bg-gray-100"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Segurança</h3>
                  <Button variant="outline">Alterar Senha</Button>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair da Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endereco" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Meus Endereços
                </CardTitle>
                <CardDescription>Gerencie seus endereços de entrega</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum endereço cadastrado</p>
                  <Button className="mt-4" variant="outline">
                    Adicionar Endereço
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pedidos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Meus Pedidos
                </CardTitle>
                <CardDescription>Visualize e acompanhe seus pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Você ainda não fez nenhum pedido</p>
                  <Button className="mt-4" variant="outline" onClick={() => setLocation("/catalogo")}>
                    Ir ao Catálogo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
