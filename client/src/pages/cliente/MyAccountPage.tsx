import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  MapPin,
  Search,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pagamento_aprovado:  "Pagamento Aprovado",
  pagamento_retirada:  "Pagamento na Retirada",
  analisando:          "Analisando",
  com_problemas:       "Com Problemas",
  em_producao:         "Em Produção",
  pronto_entrega:      "Pronto para Entrega",
  pronto_retirada:     "Pronto para Retirada",
  entregue:            "Entregue",
  cancelado:           "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  pagamento_aprovado:  "bg-green-100 text-green-700",
  pagamento_retirada:  "bg-blue-100 text-blue-700",
  analisando:          "bg-orange-100 text-orange-700",
  com_problemas:       "bg-red-100 text-red-700",
  em_producao:         "bg-orange-100 text-orange-700",
  pronto_entrega:      "bg-teal-100 text-teal-700",
  pronto_retirada:     "bg-cyan-100 text-cyan-700",
  entregue:            "bg-emerald-100 text-emerald-700",
  cancelado:           "bg-red-100 text-red-700",
};

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  cpfCnpj: "",
  addressZipCode: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressCity: "",
  addressState: "",
};

export default function MyAccountPage() {
  const { customer, isAuthenticated, isLoading, refetch } = useCustomerAuth();
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [cepLoading, setCepLoading] = useState(false);

  // Buscar perfil completo (inclui endereço)
  const { data: profile, refetch: refetchProfile } = trpc.customerAuth.getProfile.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: ordersData, isLoading: ordersLoading } = trpc.customerAuth.getMyOrders.useQuery(
    { status: "all", search: "", orderBy: "newest" },
    { enabled: isAuthenticated }
  );

  const updateProfile = trpc.customerAuth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
      refetch();
      refetchProfile();
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

  // Preencher form com dados do perfil completo
  useEffect(() => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        cpfCnpj: profile.cpfCnpj || "",
        addressZipCode: profile.addressZipCode || "",
        addressStreet: profile.addressStreet || "",
        addressNumber: profile.addressNumber || "",
        addressComplement: profile.addressComplement || "",
        addressNeighborhood: profile.addressNeighborhood || "",
        addressCity: profile.addressCity || "",
        addressState: profile.addressState || "",
      });
    } else if (customer) {
      setEditForm((p) => ({
        ...p,
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        phone: customer.phone || "",
        cpfCnpj: customer.cpfCnpj || "",
      }));
    }
  }, [profile, customer]);

  // Busca automática de CEP via ViaCEP
  const handleCepBlur = async () => {
    const cep = editForm.addressZipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setEditForm((p) => ({
          ...p,
          addressStreet: data.logradouro || p.addressStreet,
          addressNeighborhood: data.bairro || p.addressNeighborhood,
          addressCity: data.localidade || p.addressCity,
          addressState: data.uf || p.addressState,
        }));
      }
    } catch {
      // silencioso
    } finally {
      setCepLoading(false);
    }
  };

  const setField = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setEditForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = () => {
    updateProfile.mutate(editForm);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        cpfCnpj: profile.cpfCnpj || "",
        addressZipCode: profile.addressZipCode || "",
        addressStreet: profile.addressStreet || "",
        addressNumber: profile.addressNumber || "",
        addressComplement: profile.addressComplement || "",
        addressNeighborhood: profile.addressNeighborhood || "",
        addressCity: profile.addressCity || "",
        addressState: profile.addressState || "",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated || !customer) return null;

  const orders = ordersData || [];
  const displayProfile = profile || customer;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minha Conta</h1>
            <p className="text-gray-500 mt-1" translate="no">
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
                                <span className="text-xs text-gray-400" aria-hidden="true">•</span>
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
                        onClick={handleSave}
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
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* ── Dados Pessoais ── */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-orange-500" />
                    Dados Pessoais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Nome <span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input value={editForm.firstName} onChange={setField("firstName")} placeholder="João" />
                      ) : (
                        <p className="text-gray-900 font-medium py-2">{displayProfile.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label>Sobrenome <span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input value={editForm.lastName} onChange={setField("lastName")} placeholder="Silva" />
                      ) : (
                        <p className="text-gray-900 font-medium py-2">{displayProfile.lastName}</p>
                      )}
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
                        <Input value={editForm.phone} onChange={setField("phone")} placeholder="(11) 99999-9999" />
                      ) : (
                        <p className="text-gray-900 font-medium py-2">
                          {(displayProfile as any).phone || <span className="text-gray-400 italic">Não informado</span>}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <Label>CPF / CNPJ</Label>
                      {isEditing ? (
                        <Input value={editForm.cpfCnpj} onChange={setField("cpfCnpj")} placeholder="000.000.000-00" />
                      ) : (
                        <p className="text-gray-900 font-medium py-2">
                          {(profile?.cpfCnpj) || <span className="text-gray-400 italic">Não informado</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Endereço de Entrega ── */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    Endereço de Entrega
                    {!isEditing && (
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        (será preenchido automaticamente no checkout)
                      </span>
                    )}
                  </h3>

                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CEP com busca automática */}
                      <div className="space-y-1 md:col-span-2">
                        <Label>CEP</Label>
                        <div className="relative">
                          <Input
                            value={editForm.addressZipCode}
                            onChange={setField("addressZipCode")}
                            onBlur={handleCepBlur}
                            placeholder="00000-000"
                            maxLength={9}
                          />
                          {cepLoading && (
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-pulse text-orange-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">Digite o CEP para preencher o endereço automaticamente</p>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label>Rua / Avenida</Label>
                        <Input value={editForm.addressStreet} onChange={setField("addressStreet")} placeholder="Nome da rua" />
                      </div>

                      <div className="space-y-1">
                        <Label>Número</Label>
                        <Input value={editForm.addressNumber} onChange={setField("addressNumber")} placeholder="123" />
                      </div>

                      <div className="space-y-1">
                        <Label>Complemento</Label>
                        <Input value={editForm.addressComplement} onChange={setField("addressComplement")} placeholder="Apto, sala, bloco..." />
                      </div>

                      <div className="space-y-1">
                        <Label>Bairro</Label>
                        <Input value={editForm.addressNeighborhood} onChange={setField("addressNeighborhood")} placeholder="Bairro" />
                      </div>

                      <div className="space-y-1">
                        <Label>Cidade</Label>
                        <Input value={editForm.addressCity} onChange={setField("addressCity")} placeholder="Cidade" />
                      </div>

                      <div className="space-y-1">
                        <Label>UF</Label>
                        <Input
                          value={editForm.addressState}
                          onChange={setField("addressState")}
                          placeholder="SP"
                          maxLength={2}
                          className="uppercase"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-900">
                      {profile?.addressStreet ? (
                        <div className="space-y-1">
                          <p className="font-medium">
                            {profile.addressStreet}{profile.addressNumber ? `, ${profile.addressNumber}` : ""}
                            {profile.addressComplement ? ` — ${profile.addressComplement}` : ""}
                          </p>
                          {profile.addressNeighborhood && (
                            <p className="text-gray-600">{profile.addressNeighborhood}</p>
                          )}
                          <p className="text-gray-600">
                            {profile.addressCity}{profile.addressState ? ` — ${profile.addressState}` : ""}
                          </p>
                          {profile.addressZipCode && (
                            <p className="text-gray-500 text-sm">CEP: {profile.addressZipCode}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic py-2">Endereço não cadastrado. Clique em Editar para adicionar.</p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* ── Rodapé ── */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Membro desde{" "}
                    <span className="font-medium">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </p>
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
