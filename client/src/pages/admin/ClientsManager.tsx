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
import { ArrowLeft, Plus, Trash2, Edit2, Eye, Users, RefreshCw, Clock3, WalletCards, UserRoundCheck, RotateCcw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const handleDelete = (clientId: number) => {
    deleteClientMutation.mutate({ clientId });
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

        <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-5">
          <Card className="border-gray-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Clientes ativos</span><UserRoundCheck className="h-4 w-4 text-pink-600" /></div><p className="mt-2 text-2xl font-bold text-gray-900">{metrics?.activeClients ?? 0}</p><p className="text-xs text-gray-500">Compra nos últimos 30 dias</p></CardContent></Card>
          <Card className="border-gray-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Reativar</span><RotateCcw className="h-4 w-4 text-amber-600" /></div><p className="mt-2 text-2xl font-bold text-gray-900">{metrics?.reactivationQueue ?? 0}</p><p className="text-xs text-gray-500">31 a 90 dias sem comprar</p></CardContent></Card>
          <Card className="border-gray-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Atenção</span><AlertTriangle className="h-4 w-4 text-rose-600" /></div><p className="mt-2 text-2xl font-bold text-gray-900">{metrics?.attentionQueue ?? 0}</p><p className="text-xs text-gray-500">Mais de 90 dias sem comprar</p></CardContent></Card>
          <Card className="border-gray-200 shadow-sm"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Sem compras</span><Clock3 className="h-4 w-4 text-gray-500" /></div><p className="mt-2 text-2xl font-bold text-gray-900">{metrics?.clientsWithoutPurchases ?? 0}</p><p className="text-xs text-gray-500">Clientes a ativar</p></CardContent></Card>
          <Card className="col-span-2 border-gray-200 shadow-sm lg:col-span-1"><CardContent className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-500">Volume comprado</span><WalletCards className="h-4 w-4 text-pink-600" /></div><p className="mt-2 text-xl font-bold text-gray-900">{formatCurrency(metrics?.totalVolume)}</p><p className="text-xs text-gray-500">Pedidos não cancelados</p></CardContent></Card>
        </div>

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
                            {client.source !== "site" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className={ADMIN_VISUAL_SYSTEM.iconAction}
                              onClick={() => setPendingDeleteClient(client)}
                            >
                              <Trash2 className="w-4 h-4" /> Excluir
                            </Button>
                            )}
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

        <Dialog open={selectedClient !== null} onOpenChange={(open) => !open && setSelectedClient(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Produtos comprados — {selectedClient?.name}</DialogTitle>
              <DialogDescription>Resumo calculado somente com pedidos vinculados a este cliente.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 text-sm">
              <div><p className="text-xs text-gray-500">Valor acumulado</p><p className="font-semibold">{formatCurrency(selectedClient?.totalVolume)}</p></div>
              <div><p className="text-xs text-gray-500">Pedidos</p><p className="font-semibold">{selectedClient?.totalOrders ?? 0}</p></div>
              <div><p className="text-xs text-gray-500">Última compra</p><p className="font-semibold">{formatDate(selectedClient?.lastPurchase)}</p></div>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {selectedClient?.products?.length ? selectedClient.products.map((product: any) => (
                <div key={product.name} className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2">
                  <span className="text-sm font-medium text-gray-800">{product.name}</span>
                  <span className="text-sm text-gray-500">{product.totalQuantity} unidade(s)</span>
                </div>
              )) : <p className="py-6 text-center text-sm text-gray-500">Nenhum item de produto vinculado aos pedidos deste cliente.</p>}
            </div>
          </DialogContent>
        </Dialog>

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
                  if (pendingDeleteClient) handleDelete(pendingDeleteClient.id);
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
