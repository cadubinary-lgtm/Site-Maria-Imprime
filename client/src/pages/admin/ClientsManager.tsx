import AdminLayout from "@/components/AdminLayout";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowLeft, Plus, Trash2, Edit2, Eye, Users, RefreshCw, Clock3, WalletCards, UserRoundCheck, RotateCcw, AlertTriangle, Ban, UserCheck, Loader2, Mail, Phone, MapPin, Calendar, Lock, ShoppingBag, CheckCircle, AlertCircle, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ADMIN_VISUAL_SYSTEM } from "@/lib/admin-visual-system";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  balcao:      { label: "Cliente Balcão", color: "bg-blue-100 text-blue-800" },
  site:        { label: "Cliente Site", color: "bg-green-100 text-green-800" },
  revendedor:  { label: "Revendedor",  color: "bg-purple-100 text-purple-800" },
  agencia:     { label: "Agência",     color: "bg-orange-100 text-orange-800" },
};

const OPERATIONAL_STATUS_STYLES: Record<string, string> = {
  ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reativar: "bg-amber-50 text-amber-700 border-amber-200",
  atencao: "bg-rose-50 text-rose-700 border-rose-200",
  sem_compras: "bg-gray-100 text-gray-700 border-gray-200",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatCurrency = (value: unknown) => currencyFormatter.format(Number(value) || 0);
const formatDate = (value: Date | string | null | undefined) => value ? new Date(value).toLocaleDateString("pt-BR") : "Sem compras";

function CustomerDetailsDialog({ selectedClient, open, onClose, onRefetch }: { selectedClient: any | null; open: boolean; onClose: () => void; onRefetch: () => void }) {
  const isStoreAccount = selectedClient?.source === "site";
  const { data: storeDetail, isLoading: isLoadingStoreDetail } = trpc.customerAuth.adminGetCustomerDetail.useQuery(
    { customerId: selectedClient?.externalId ?? 0 },
    { enabled: open && isStoreAccount && Boolean(selectedClient?.externalId) },
  );
  const { data: legacyDetail, isLoading: isLoadingLegacyDetail } = trpc.crm.adminGetBalcaoClientDetail.useQuery(
    { clientId: selectedClient?.id ?? 0 },
    { enabled: open && !isStoreAccount && Boolean(selectedClient?.id) },
  );
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const setPassword = trpc.customerAuth.adminSetCustomerPassword.useMutation({
    onSuccess: () => { toast.success("Senha redefinida com sucesso!"); setNewPassword(""); setShowPasswordForm(false); },
    onError: (error) => toast.error(error.message),
  });
  const updateStorePriceTier = trpc.customerAuth.adminUpdateCustomerPriceTier.useMutation({
    onSuccess: () => { toast.success("Tabela de preços atualizada"); onRefetch(); },
    onError: (error) => toast.error(error.message),
  });

  const rawCustomer: any = isStoreAccount ? storeDetail?.customer : legacyDetail?.client;
  const orders = isStoreAccount ? storeDetail?.orders ?? [] : legacyDetail?.orders ?? [];
  const isLoading = isStoreAccount ? isLoadingStoreDetail : isLoadingLegacyDetail;
  const customer = rawCustomer && {
    name: isStoreAccount ? `${rawCustomer.firstName} ${rawCustomer.lastName}`.trim() : rawCustomer.name,
    cpfCnpj: rawCustomer.cpfCnpj,
    email: rawCustomer.email,
    emailVerified: rawCustomer.emailVerified,
    phone: rawCustomer.phone || rawCustomer.whatsapp,
    status: isStoreAccount ? rawCustomer.status : rawCustomer.isActive ? "active" : "inactive",
    allowStorePickup: rawCustomer.allowStorePickup,
    priceTier: rawCustomer.priceTier === "reseller" ? "reseller" : "final",
    createdAt: rawCustomer.createdAt,
    updatedAt: rawCustomer.updatedAt,
    lastLogin: rawCustomer.lastLogin,
    loginAttempts: rawCustomer.loginAttempts,
    addressZipCode: rawCustomer.addressZipCode,
    addressStreet: rawCustomer.addressStreet,
    addressNumber: rawCustomer.addressNumber,
    addressComplement: rawCustomer.addressComplement,
    addressNeighborhood: rawCustomer.addressNeighborhood,
    addressCity: rawCustomer.addressCity,
    addressState: rawCustomer.addressState,
  };

  const handleSetPassword = () => {
    if (!selectedClient?.externalId) return;
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error("A senha deve ter 8 caracteres, uma letra maiúscula e um número.");
      return;
    }
    setPassword.mutate({ customerId: selectedClient.externalId, newPassword });
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="admin-visual-system max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-pink-600"><Users className="h-5 w-5" />Detalhes do Cliente</DialogTitle>
          <DialogDescription>Informações completas e histórico de pedidos</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-pink-600" /></div>
        ) : !customer ? (
          <div className="py-8 text-center text-gray-500">Cliente não encontrado</div>
        ) : (
          <div className="space-y-5 pt-2">
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-pink-600"><UserCheck className="h-4 w-4" />Informações Pessoais</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="mb-0.5 text-xs text-gray-500">Nome Completo</p><p className="font-medium text-gray-900">{customer.name}</p></div>
                <div><p className="mb-0.5 text-xs text-gray-500">CPF / CNPJ</p><p className="font-medium text-gray-900">{customer.cpfCnpj || "Não informado"}</p></div>
                <div><p className="mb-0.5 text-xs text-gray-500">E-mail</p><div className="flex items-center gap-1.5 text-gray-900"><Mail className="h-3.5 w-3.5 text-gray-400" /><span>{customer.email || "Não informado"}</span>{isStoreAccount && (customer.emailVerified ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />)}</div></div>
                <div><p className="mb-0.5 text-xs text-gray-500">Telefone / WhatsApp</p><div className="flex items-center gap-1.5 text-gray-900"><Phone className="h-3.5 w-3.5 text-gray-400" /><span>{customer.phone || "Não informado"}</span></div></div>
                <div><p className="mb-0.5 text-xs text-gray-500">Status</p><Badge variant="outline" className={customer.status === "blocked" ? "border-red-200 bg-red-50 text-red-700" : customer.status === "inactive" ? "border-gray-200 bg-gray-100 text-gray-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{customer.status === "blocked" ? "Bloqueado" : customer.status === "inactive" ? "Inativo" : "Ativo"}</Badge></div>
                <div><p className="mb-0.5 text-xs text-gray-500">Retirada na Loja</p><Badge variant="outline" className={customer.allowStorePickup ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-100 text-gray-700"}>{customer.allowStorePickup ? "Liberado" : "Não liberado"}</Badge></div>
                <div><p className="mb-0.5 text-xs text-gray-500">Tabela de Preços</p>{isStoreAccount ? <Select value={customer.priceTier} onValueChange={(priceTier: "final" | "reseller") => updateStorePriceTier.mutate({ customerId: selectedClient.externalId, priceTier })} disabled={updateStorePriceTier.isPending}><SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="final">Cliente final</SelectItem><SelectItem value="reseller">Revendedor</SelectItem></SelectContent></Select> : <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">{customer.priceTier === "reseller" ? "Revendedor" : "Cliente final"}</Badge>}</div>
              </div>
            </section>
            <Separator />
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-pink-600"><Calendar className="h-4 w-4" />Datas e Acesso</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="mb-0.5 text-xs text-gray-500">Membro desde</p><p className="text-gray-900">{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—"}</p></div>
                <div><p className="mb-0.5 text-xs text-gray-500">Último Login</p><p className="text-gray-900">{customer.lastLogin ? new Date(customer.lastLogin).toLocaleString("pt-BR") : "Nunca"}</p></div>
                <div><p className="mb-0.5 text-xs text-gray-500">Última Atualização</p><p className="text-gray-900">{customer.updatedAt ? new Date(customer.updatedAt).toLocaleString("pt-BR") : "—"}</p></div>
                <div><p className="mb-0.5 text-xs text-gray-500">Tentativas de Login Falhas</p><p className="text-gray-900">{isStoreAccount ? customer.loginAttempts || 0 : "Não aplicável"}</p></div>
              </div>
            </section>
            <Separator />
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-pink-600"><MapPin className="h-4 w-4" />Endereço de Entrega</h3>
              {customer.addressStreet ? <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="mb-0.5 text-xs text-gray-500">CEP</p><p className="text-gray-900">{customer.addressZipCode || "—"}</p></div><div><p className="mb-0.5 text-xs text-gray-500">Rua / Avenida</p><p className="text-gray-900">{customer.addressStreet}, {customer.addressNumber || "s/n"}</p></div>{customer.addressComplement && <div><p className="mb-0.5 text-xs text-gray-500">Complemento</p><p className="text-gray-900">{customer.addressComplement}</p></div>}<div><p className="mb-0.5 text-xs text-gray-500">Bairro</p><p className="text-gray-900">{customer.addressNeighborhood || "—"}</p></div><div><p className="mb-0.5 text-xs text-gray-500">Cidade / UF</p><p className="text-gray-900">{customer.addressCity || "—"}{customer.addressState ? ` — ${customer.addressState}` : ""}</p></div></div> : <p className="text-sm italic text-gray-400">Endereço não cadastrado</p>}
            </section>
            <Separator />
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-pink-600"><Lock className="h-4 w-4" />Segurança</h3>
              {isStoreAccount ? !showPasswordForm ? <Button variant="outline" size="sm" className={ADMIN_VISUAL_SYSTEM.iconAction} onClick={() => setShowPasswordForm(true)}><Lock className="mr-1.5 h-3.5 w-3.5" />Redefinir Senha do Cliente</Button> : <div className="flex items-start gap-2"><div className="flex-1"><Input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Nova senha (mín. 8 caracteres, 1 maiúscula, 1 número)" /><p className="mt-1 text-xs text-gray-400">Mínimo 8 caracteres, uma letra maiúscula e um número.</p></div><Button size="sm" disabled={setPassword.isPending} onClick={handleSetPassword}>{setPassword.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}</Button><Button variant="ghost" size="sm" onClick={() => { setShowPasswordForm(false); setNewPassword(""); }}>Cancelar</Button></div> : <p className="text-sm italic text-gray-400">Cliente cadastrado no balcão não possui senha de acesso.</p>}
            </section>
            <Separator />
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-pink-600"><ShoppingBag className="h-4 w-4" />Histórico de Pedidos ({orders.length})</h3>
              {orders.length === 0 ? <p className="text-sm italic text-gray-400">Nenhum pedido encontrado</p> : <div className="space-y-2">{orders.map((order: any) => <div key={order.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm"><div><p className="font-medium text-gray-900">#{order.orderNumber || order.id}</p><p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("pt-BR")}{order.paymentMethod && ` · ${order.paymentMethod.toUpperCase()}`}</p></div><div className="flex items-center gap-3"><Badge variant="outline" className="border-gray-200 bg-white text-gray-700">{order.status}</Badge><span className="font-semibold text-gray-900">{formatCurrency(order.totalPrice)}</span></div></div>)}</div>}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ClientsManager({ defaultType, title, ..._ }: { defaultType?: string; title?: string; [k: string]: any } = {}) {
  const searchParams = useSearch();
  const [, setLocation] = useLocation();
  const isDashboardView = new URLSearchParams(searchParams).get("view") === "dashboard";
  const pageTitle = title ?? (isDashboardView ? "Dashboard de Clientes" : "Todos os Clientes");
  const pageDescription = isDashboardView
    ? "Visão operacional para priorizar clientes ativos, reativações e oportunidades de atendimento."
    : "Consulta e gerenciamento completo dos cadastros de clientes.";
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>(defaultType ?? "");
  const [activityFilter, setActivityFilter] = useState("todos");
  const [pendingDeleteClient, setPendingDeleteClient] = useState<any | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    clientType: (defaultType ?? "balcao") as any,
  });

  // Queries
  const { data: dashboard, isLoading, refetch } = trpc.crm.getOperationalDashboard.useQuery({
    limit: 100,
    offset: 0,
    clientType: filterType || undefined,
  });

  // Mutations
  const createClientMutation = trpc.crm.createClient.useMutation({
    onSuccess: () => {
      toast.success("Cliente criado com sucesso!");
      setFormData({ name: "", email: "", phone: "", whatsapp: "", clientType: "balcao" });
      setShowForm(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar cliente: ${error.message}`);
    },
  });

  const updateClientMutation = trpc.crm.updateClient.useMutation({
    onSuccess: () => {
      toast.success("Cliente atualizado com sucesso!");
      setEditingId(null);
      setFormData({ name: "", email: "", phone: "", whatsapp: "", clientType: "balcao" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });

  const deleteClientMutation = trpc.crm.deleteClient.useMutation({
    onSuccess: () => {
      toast.success("Cliente deletado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao deletar cliente: ${error.message}`);
    },
  });

  const updateStoreAccountStatus = trpc.customerAuth.adminUpdateCustomerStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado com sucesso!"); refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const deleteStoreAccount = trpc.customerAuth.adminDeleteCustomer.useMutation({
    onSuccess: () => { toast.success("Cliente excluído com sucesso!"); refetch(); },
    onError: (error) => toast.error(error.message),
  });
  const updateLegacyStatus = trpc.crm.updateClient.useMutation({
    onSuccess: () => { toast.success("Status atualizado com sucesso!"); refetch(); },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome do cliente é obrigatório");
      return;
    }

    if (editingId) {
      await updateClientMutation.mutateAsync({
        clientId: editingId,
        data: formData,
      });
    } else {
      await createClientMutation.mutateAsync(formData);
    }
  };

  const handleEdit = (client: any) => {
    setFormData({
      name: client.name,
      email: client.email || "",
      phone: client.phone || "",
      whatsapp: client.whatsapp || "",
      clientType: client.clientType,
    });
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = (client: any) => {
    if (client.source === "site") {
      deleteStoreAccount.mutate({ customerId: client.externalId });
      return;
    }
    deleteClientMutation.mutate({ clientId: client.id });
  };

  const handleToggleBlock = (client: any) => {
    if (client.source === "site") {
      updateStoreAccountStatus.mutate({ customerId: client.externalId, status: client.accountStatus === "blocked" ? "active" : "blocked" });
      return;
    }
    updateLegacyStatus.mutate({ clientId: client.id, data: { isActive: !client.isActive } });
  };


  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", email: "", phone: "", whatsapp: "", clientType: (defaultType ?? "balcao") as any });
  };

  // Filtro local por busca de texto
  const clients = dashboard?.clients ?? [];
  const metrics = dashboard?.metrics;
  const filtered = useMemo(() => clients.filter((c: any) => {
    const matchesActivity = activityFilter === "todos" || c.operationalStatus === activityFilter;
    if (!matchesActivity) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.whatsapp?.includes(q);
  }), [activityFilter, clients, search]);

  return (
    <AdminLayout>
    <div className="admin-visual-system min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/admin">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-2">{pageDescription}</p>
        </div>

        {isDashboardView && (
          <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-5">
            <Card className="border-gray-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Clientes ativos</span><UserRoundCheck className="h-4 w-4 text-pink-600" /></div><p className="mt-2 text-2xl font-bold text-gray-900">{metrics?.activeClients ?? 0}</p><p className="text-xs text-gray-500">Compra nos últimos 30 dias</p></CardContent></Card>
            <Card className="border-gray-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Reativar</span><RotateCcw className="h-4 w-4 text-amber-600" /></div><p className="mt-2 text-2xl font-bold text-gray-900">{metrics?.reactivationQueue ?? 0}</p><p className="text-xs text-gray-500">31 a 90 dias sem comprar</p></CardContent></Card>
            <Card className="border-gray-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Atenção</span><AlertTriangle className="h-4 w-4 text-rose-600" /></div><p className="mt-2 text-2xl font-bold text-gray-900">{metrics?.attentionQueue ?? 0}</p><p className="text-xs text-gray-500">Mais de 90 dias sem comprar</p></CardContent></Card>
            <Card className="border-gray-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Sem compras</span><Clock3 className="h-4 w-4 text-gray-500" /></div><p className="mt-2 text-2xl font-bold text-gray-900">{metrics?.clientsWithoutPurchases ?? 0}</p><p className="text-xs text-gray-500">Clientes a ativar</p></CardContent></Card>
            <Card className="col-span-2 border-gray-200 shadow-sm lg:col-span-1"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Volume comprado</span><WalletCards className="h-4 w-4 text-pink-600" /></div><p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(metrics?.totalVolume)}</p><p className="text-xs text-gray-500">Pedidos não cancelados</p></CardContent></Card>
          </div>
        )}

        {/* Barra de busca e filtros */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {!defaultType && (
            <Select value={filterType || "todos"} onValueChange={(v) => setFilterType(v === "todos" ? "" : v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Tipo de cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="balcao">Balcão</SelectItem>
                <SelectItem value="site">Site</SelectItem>
                <SelectItem value="revendedor">Revendedor</SelectItem>
                <SelectItem value="agencia">Agência</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Situação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as situações</SelectItem>
              <SelectItem value="ativo">Ativos (até 30 dias)</SelectItem>
              <SelectItem value="reativar">Reativar (31 a 90 dias)</SelectItem>
              <SelectItem value="atencao">Atenção (+90 dias)</SelectItem>
              <SelectItem value="sem_compras">Sem compras</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Formulário */}
        {!isDashboardView && showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome do cliente"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 9999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="(11) 9999-9999"
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientType">Tipo de Cliente</Label>
                    <Select
                      value={formData.clientType}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, clientType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balcao">Balcão</SelectItem>
                        <SelectItem value="revendedor">Revendedor</SelectItem>
                        <SelectItem value="agencia">Agência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={createClientMutation.isPending || updateClientMutation.isPending}>
                    {editingId ? "Atualizar" : "Criar"} Cliente
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Botão para criar novo cliente */}
        {!isDashboardView && !showForm && filterType !== "site" && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Button onClick={() => setLocation("/admin/clientes-loja?novo=cliente")}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
            <Button variant="outline" onClick={() => setLocation("/admin/clientes-loja")}>
              Gerenciar acessos e senhas
            </Button>
          </div>
        )}

        {/* Lista de clientes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-pink-600" />
                  Clientes
                </CardTitle>
                <CardDescription>
                  {filtered.length} cliente(s) encontrado(s){filterType ? ` · Tipo: ${TYPE_LABELS[filterType]?.label ?? filterType}` : ""}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando clientes...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="w-full overflow-hidden">
                <table className="customer-list-standard w-full text-[11px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Cliente</th>
                      <th className="text-left py-2 px-4 font-semibold">Contato</th>
                      <th className="text-left py-2 px-4 font-semibold">E-mail</th>
                      <th className="text-left py-2 px-4 font-semibold">Status</th>
                      <th className="text-left py-2 px-4 font-semibold">Cadastro</th>
                      <th className="text-left py-2 px-4 font-semibold">Retirada</th>
                      <th className="text-left py-2 px-4 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client: any) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{client.name}</p>
                          {client.cpfCnpj && <p className="text-xs text-gray-500">{client.cpfCnpj}</p>}
                          <span className={`mt-1 inline-block px-2 py-0.5 text-[11px] font-semibold rounded ${TYPE_LABELS[client.clientType]?.color ?? "bg-gray-100 text-gray-700"}`}>{TYPE_LABELS[client.clientType]?.label ?? client.clientType}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {client.phone || client.whatsapp || "Não informado"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">
                          {client.email || "Não informado"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={client.accountStatus === "blocked" ? "border-red-200 bg-red-50 text-red-700" : client.accountStatus === "inactive" ? "border-gray-200 bg-gray-100 text-gray-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>{client.accountStatus === "blocked" ? "Bloqueado" : client.accountStatus === "inactive" ? "Inativo" : "Ativo"}</Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {client.createdAt ? formatDate(client.createdAt) : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {client.allowStorePickup ? "Liberado" : "Não informado"}
                        </td>
                        <td className="py-3 px-4">
                          <div data-customer-actions>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={ADMIN_VISUAL_SYSTEM.iconAction}
                              onClick={() => setSelectedClient(client)}
                            >
                              <Eye className="w-4 h-4" /> Ver
                            </Button>
                            {client.source === "site" ? (
                              <Link href="/admin/clientes-loja" className="inline-flex h-8 items-center gap-2 text-xs font-medium text-gray-600 transition-colors hover:text-pink-600">
                                <Edit2 className="w-4 h-4" /> Editar
                              </Link>
                            ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={ADMIN_VISUAL_SYSTEM.iconAction}
                              onClick={() => handleEdit(client)}
                            >
                              <Edit2 className="w-4 h-4" /> Editar
                            </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className={ADMIN_VISUAL_SYSTEM.iconAction}
                              onClick={() => handleToggleBlock(client)}
                              disabled={updateStoreAccountStatus.isPending || updateLegacyStatus.isPending}
                            >
                              {client.source === "site" && client.accountStatus === "blocked" || client.source !== "site" && !client.isActive ? <><UserCheck className="w-4 h-4" /> Desbloquear</> : <><Ban className="w-4 h-4" /> Bloquear</>}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className={ADMIN_VISUAL_SYSTEM.iconAction}
                              onClick={() => setPendingDeleteClient(client)}
                              disabled={deleteStoreAccount.isPending || deleteClientMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" /> Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum cliente cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <CustomerDetailsDialog selectedClient={selectedClient} open={selectedClient !== null} onClose={() => setSelectedClient(null)} onRefetch={refetch} />

        <AlertDialog open={pendingDeleteClient !== null} onOpenChange={(open) => !open && setPendingDeleteClient(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
              <AlertDialogDescription>O cliente “{pendingDeleteClient?.name}” será removido permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingDeleteClient) handleDelete(pendingDeleteClient);
                  setPendingDeleteClient(null);
                }}
              >
                Excluir cliente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    </AdminLayout>
  );
}
