import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, Search, Users, UserCheck, AlertCircle, Ban,
  RefreshCw, Mail, Phone, Trash2, Eye, MapPin, ShoppingBag,
  Calendar, Plus, Store, StoreIcon,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const TYPE_LABELS: Record<string, string> = {
  balcao: "Balcão", site: "Site", revendedor: "Revendedor",
  agencia: "Agência", corporativo: "Corporativo",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  pagamento_aprovado: "Pag. Aprovado", pagamento_retirada: "Pagar na Retirada",
  analisando: "Analisando", em_producao: "Em Produção",
  pronto_entrega: "Pronto Entrega", pronto_retirada: "Pronto Retirada",
  entregue: "Entregue", cancelado: "Cancelado",
};

function ClientDetailModal({ clientId, open, onClose }: { clientId: number | null; open: boolean; onClose: () => void }) {
  const { data, isLoading } = trpc.crm.adminGetBalcaoClientDetail.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId && open }
  );
  const client = data?.client;
  const orders = data?.orders ?? [];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pink-600">
            <Users className="w-5 h-5" />
            Detalhes do Cliente
          </DialogTitle>
          <p className="text-sm text-gray-500">Informações completas e histórico de pedidos</p>
        </DialogHeader>
        {isLoading ? (
          <div className="py-8 text-center text-gray-400">Carregando...</div>
        ) : !client ? (
          <div className="py-8 text-center text-gray-400">Cliente não encontrado</div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Informações Pessoais */}
            <div>
              <h3 className="text-sm font-semibold text-pink-600 flex items-center gap-1.5 mb-3">
                <Users className="w-4 h-4" /> Informações Pessoais
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Nome Completo</p>
                  <p className="font-semibold text-gray-900">{client.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">CPF / CNPJ</p>
                  <p className="text-gray-900">{client.cpfCnpj || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">E-mail</p>
                  <p className="text-gray-900">{client.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Telefone / WhatsApp</p>
                  <p className="text-gray-900 flex items-center gap-1">
                    {client.phone || client.whatsapp ? (
                      <><Phone className="w-3.5 h-3.5 text-gray-400" />{client.phone || client.whatsapp}</>
                    ) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tipo</p>
                  <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    {TYPE_LABELS[client.clientType] ?? client.clientType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${client.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {client.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>
            <Separator />
            {/* Datas */}
            <div>
              <h3 className="text-sm font-semibold text-pink-600 flex items-center gap-1.5 mb-3">
                <Calendar className="w-4 h-4" /> Datas
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Cadastrado em</p>
                  <p className="text-gray-900">{new Date(client.createdAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Última Atualização</p>
                  <p className="text-gray-900">{new Date(client.updatedAt).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
            </div>
            <Separator />
            {/* Endereço */}
            <div>
              <h3 className="text-sm font-semibold text-pink-600 flex items-center gap-1.5 mb-3">
                <MapPin className="w-4 h-4" /> Endereço de Entrega
              </h3>
              {client.addressStreet ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">CEP</p>
                    <p className="text-gray-900">{client.addressZipCode || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Rua / Avenida</p>
                    <p className="text-gray-900">{client.addressStreet}, {client.addressNumber}</p>
                  </div>
                  {client.addressComplement && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Complemento</p>
                      <p className="text-gray-900">{client.addressComplement}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Bairro</p>
                    <p className="text-gray-900">{client.addressNeighborhood || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Cidade / UF</p>
                    <p className="text-gray-900">{client.addressCity} — {client.addressState}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Endereço não cadastrado</p>
              )}
            </div>
            <Separator />
            {/* Histórico de Pedidos */}
            <div>
              <h3 className="text-sm font-semibold text-pink-600 flex items-center gap-1.5 mb-3">
                <ShoppingBag className="w-4 h-4" /> Histórico de Pedidos ({orders.length})
              </h3>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhum pedido encontrado</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                      <div>
                        <p className="font-medium text-gray-900">#{order.orderNumber || order.id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                          {order.paymentMethod && ` · ${order.paymentMethod}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                        <span className="font-semibold text-gray-900">
                          R$ {Number(order.totalPrice || 0).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ClientesBalcao() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, refetch } = trpc.crm.adminListBalcaoClients.useQuery({
    search: search || undefined,
    clientType: "balcao",
    limit: 100,
    offset: 0,
  });

  const deleteClient = trpc.crm.adminDeleteBalcaoClient.useMutation({
    onSuccess: () => { toast.success("Cliente excluído com sucesso!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const togglePickup = trpc.crm.adminToggleBalcaoPickup.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.allow ? "Retirada na loja liberada!" : "Retirada na loja revogada!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const clients = data?.clients ?? [];
  const total = data?.total ?? 0;
  const activeCount = clients.filter((c: any) => c.isActive).length;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-500" />
                  Clientes Balcão
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">Clientes cadastrados pelo operador / balcão</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", value: total, icon: Users, color: "blue" },
              { label: "Ativos", value: activeCount, icon: UserCheck, color: "green" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${color}-100`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Busca */}
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setSearch(searchInput)}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isLoading ? "Carregando..." : `${total} clientes encontrados`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-400">Carregando...</div>
              ) : clients.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhum cliente encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Contato</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Cadastro</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Retirada</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {clients.map((client: any) => (
                        <tr key={client.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{client.name}</div>
                            {client.cpfCnpj && <div className="text-xs text-gray-500">{client.cpfCnpj}</div>}
                          </td>
                          <td className="px-4 py-3">
                            {client.phone ? (
                              <div className="flex items-center gap-1 text-gray-600">
                                <Phone className="w-3.5 h-3.5" />{client.phone}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">Não informado</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-gray-700">{client.email || "—"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${client.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {client.isActive ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="px-4 py-3">
                            {client.allowStorePickup ? (
                              <Button
                                variant="outline" size="sm"
                                className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs"
                                onClick={() => togglePickup.mutate({ clientId: client.id, allow: false })}
                                disabled={togglePickup.isPending}
                              >
                                <Store className="w-3.5 h-3.5 mr-1" /> Liberado
                              </Button>
                            ) : (
                              <Button
                                variant="outline" size="sm"
                                className="text-gray-400 border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-xs"
                                onClick={() => togglePickup.mutate({ clientId: client.id, allow: true })}
                                disabled={togglePickup.isPending}
                              >
                                <StoreIcon className="w-3.5 h-3.5 mr-1" /> Liberar
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline" size="sm"
                                className="text-pink-600 border-pink-200 hover:bg-pink-50 text-xs"
                                onClick={() => { setSelectedClientId(client.id); setDetailOpen(true); }}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline" size="sm"
                                    className="text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs"
                                    disabled={deleteClient.isPending}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Você está prestes a excluir <strong>{client.name}</strong>. Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                      onClick={() => deleteClient.mutate({ clientId: client.id })}
                                    >
                                      Sim, excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ClientDetailModal
        clientId={selectedClientId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedClientId(null); }}
      />
    </AdminLayout>
  );
}
