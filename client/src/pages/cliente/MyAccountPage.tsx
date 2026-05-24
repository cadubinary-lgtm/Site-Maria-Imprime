import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  LogOut,
  User,
  ShoppingBag,
  Loader2,
  CheckCircle,
  AlertCircle,
  Package,
  Clock,
  ChevronRight,
  Edit2,
  Save,
  X,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pagamento_aprovado: "Pagamento Aprovado",
  pedido_recebido: "Pedido em Andamento",
  arte_em_analise: "Arte em Análise",
  aguardando_aprovacao: "Aguardando Aprovação",
  em_producao: "Em Produção",
  impressao: "Impressão",
  acabamento: "Acabamento",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para Entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pagamento_aprovado: "bg-green-100 text-green-700",
  pedido_recebido: "bg-blue-100 text-blue-700",
  arte_em_analise: "bg-orange-100 text-orange-700",
  aguardando_aprovacao: "bg-amber-100 text-amber-700",
  em_producao: "bg-purple-100 text-purple-700",
  impressao: "bg-indigo-100 text-indigo-700",
  acabamento: "bg-pink-100 text-pink-700",
  pronto: "bg-teal-100 text-teal-700",
  saiu_para_entrega: "bg-cyan-100 text-cyan-700",
  entregue: "bg-emerald-100 text-emerald-700",
  cancelado: "bg-red-100 text-red-700",
};

export default function MyAccountPage() {
  const { customer, isAuthenticated, isLoading, refetch } = useCustomerAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "" });

  const { data: ordersData, isLoading: ordersLoading } = trpc.customerAuth.getMyOrders.useQuery(
    { status: "all", search: "", orderBy: "newest" },
    { enabled: isAuthenticated }
  );

  const updateProfile = trpc.customerAuth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const logout = trpc.customerAuth.logout.useMutation({
    onSuccess: () => {
      refetch();
      navigate("/");
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login-cliente");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (customer) {
      setEditForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone || "",
      });
    }
  }, [customer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated || !customer) return null;

  const orders = ordersData || [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minha Conta</h1>
            <p className="text-gray-500 mt-1">
              Olá, <span className="font-semibold text-orange-600">{customer.firstName}</span>! Bem-vindo(a) de volta.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {logout.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 mr-2" />
            )}
            Sair
          </Button>
        </div>

        {/* Verificação de email */}
        {!customer.emailVerified && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Email não confirmado</p>
              <p className="text-sm text-yellow-700 mt-1">
                Confirme seu email para ter acesso completo à sua conta.{" "}
                <Link href="/reenviar-verificacao" className="underline font-medium">
                  Reenviar email
                </Link>
              </p>
            </div>
          </div>
        )}

        <Tabs defaultValue="pedidos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pedidos" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Meus Pedidos
            </TabsTrigger>
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </TabsTrigger>
          </TabsList>

          {/* ── Aba Pedidos ── */}
          <TabsContent value="pedidos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-500" />
                  Histórico de Pedidos
                </CardTitle>
                <CardDescription>Acompanhe o status dos seus pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Você ainda não fez nenhum pedido</p>
                    <p className="text-gray-400 text-sm mt-1">Explore nosso catálogo e faça seu primeiro pedido!</p>
                    <Button asChild className="mt-6 bg-orange-500 hover:bg-orange-600">
                      <Link href="/catalogo">Ver Catálogo</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order: any) => (
                      <Link key={order.id} href={`/pedido/${order.orderNumber}`}>
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                Pedido #{order.orderNumber}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                                </span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs font-medium text-gray-700">
                                  R$ {parseFloat(order.totalAmount || "0").toFixed(2).replace(".", ",")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Aba Perfil ── */}
          <TabsContent value="perfil">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-500" />
                      Informações Pessoais
                    </CardTitle>
                    <CardDescription>Seus dados de cadastro</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateProfile.mutate(editForm)}
                        disabled={updateProfile.isPending}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        {updateProfile.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span className="ml-1">Salvar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditForm({
                            firstName: customer.firstName,
                            lastName: customer.lastName,
                            phone: customer.phone || "",
                          });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Nome</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.firstName}
                        onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                        placeholder="Nome"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-2">{customer.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label>Sobrenome</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.lastName}
                        onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                        placeholder="Sobrenome"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-2">{customer.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Email</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-medium py-2">{customer.email}</p>
                    {customer.emailVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verificado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Não verificado
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Telefone / WhatsApp</Label>
                  {isEditing ? (
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium py-2">
                      {customer.phone || <span className="text-gray-400 italic">Não informado</span>}
                    </p>
                  )}
                </div>

                {customer.cpfCnpj && (
                  <div className="space-y-1">
                    <Label>CPF / CNPJ</Label>
                    <p className="text-gray-900 font-medium py-2">{customer.cpfCnpj}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Membro desde{" "}
                    <span className="font-medium">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/recuperar-senha">Alterar Senha</Link>
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
