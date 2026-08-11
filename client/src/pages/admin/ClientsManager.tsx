import AdminLayout from "@/components/AdminLayout";
import { useState } from "react";
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
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Edit2, Search, Users, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  balcao:      { label: "Balcão",      color: "bg-blue-100 text-blue-800" },
  site:        { label: "Site",        color: "bg-green-100 text-green-800" },
  revendedor:  { label: "Revendedor",  color: "bg-purple-100 text-purple-800" },
  agencia:     { label: "Agência",     color: "bg-orange-100 text-orange-800" },
  corporativo: { label: "Corporativo", color: "bg-pink-100 text-pink-800" },
};

export default function ClientsManager({ defaultType, title, ..._ }: { defaultType?: string; title?: string; [k: string]: any } = {}) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>(defaultType ?? "");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    clientType: (defaultType ?? "balcao") as any,
  });

  // Queries
  const { data: clients, isLoading, refetch } = trpc.crm.listClients.useQuery({
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
    if (confirm("Tem certeza que deseja deletar este cliente?")) {
      deleteClientMutation.mutate({ clientId });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: "", email: "", phone: "", whatsapp: "", clientType: (defaultType ?? "balcao") as any });
  };

  // Filtro local por busca de texto
  const filtered = (clients ?? []).filter((c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.whatsapp?.includes(q)
    );
  });

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/admin">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title ?? "Gestão de Clientes (CRM)"}</h1>
          <p className="text-gray-600 mt-2">Gerencie clientes, histórico de pedidos e estatísticas</p>
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
                <SelectItem value="corporativo">Corporativo</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Formulário */}
        {showForm && (
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
                        <SelectItem value="corporativo">Corporativo</SelectItem>
                        <SelectItem value="site">Site</SelectItem>
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
        {!showForm && (
          <div className="mb-6">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
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
            ) : clients && clients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-semibold">Nome</th>
                      <th className="text-left py-2 px-4 font-semibold">Email</th>
                      <th className="text-left py-2 px-4 font-semibold">Telefone</th>
                      <th className="text-left py-2 px-4 font-semibold">Tipo</th>
                      <th className="text-left py-2 px-4 font-semibold">Volume</th>
                      <th className="text-left py-2 px-4 font-semibold">Pedidos</th>
                      <th className="text-left py-2 px-4 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client: any) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{client.name}</td>
                        <td className="py-2 px-4 text-sm text-gray-600">{client.email || "-"}</td>
                        <td className="py-2 px-4 text-sm text-gray-600">{client.phone || "-"}</td>
                        <td className="py-2 px-4">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${TYPE_LABELS[client.clientType]?.color ?? "bg-gray-100 text-gray-700"}`}>
                            {TYPE_LABELS[client.clientType]?.label ?? client.clientType}
                          </span>
                        </td>
                        <td className="py-2 px-4 font-semibold">
                          R$ {parseFloat(client.totalVolume).toFixed(2)}
                        </td>
                        <td className="py-2 px-4">{client.totalOrders}</td>
                        <td className="py-2 px-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(client)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(client.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
      </div>
    </div>
    </AdminLayout>
  );
}
