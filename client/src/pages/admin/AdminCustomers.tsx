import AdminLayout from "@/components/AdminLayout";
import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  Ban,
  UserCheck,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  Trash2,
  Store,
  StoreIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  blocked: "Bloqueado",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  blocked: "bg-red-100 text-red-700",
};

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");

  const { data, isLoading, refetch } = trpc.customerAuth.adminListCustomers.useQuery({
    search: search || undefined,
    status: statusFilter,
    limit: 100,
    offset: 0,
  });

  const updateStatus = trpc.customerAuth.adminUpdateCustomerStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCustomer = trpc.customerAuth.adminDeleteCustomer.useMutation({
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleStorePickup = trpc.customerAuth.adminToggleStorePickup.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.allow ? "Retirada na loja liberada!" : "Retirada na loja revogada!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;

  const activeCount = customers.filter((c) => c.status === "active").length;
  const blockedCount = customers.filter((c) => c.status === "blocked").length;
  const unverifiedCount = customers.filter((c) => !c.emailVerified).length;

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-500" />
                Clientes Cadastrados
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                Gerenciamento de contas de clientes da loja
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                  <p className="text-xs text-gray-500">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{unverifiedCount}</p>
                  <p className="text-xs text-gray-500">Não verificados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{blockedCount}</p>
                  <p className="text-xs text-gray-500">Bloqueados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as any)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="blocked">Bloqueados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {customers.length} cliente{customers.length !== 1 ? "s" : ""} encontrado{customers.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Pagamento na Retirada</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {customer.firstName} {customer.lastName}
                          </div>
                          {customer.cpfCnpj && (
                            <div className="text-xs text-gray-500">{customer.cpfCnpj}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {customer.phone ? (
                            <div className="flex items-center gap-1 text-gray-600">
                              <Phone className="w-3.5 h-3.5" />
                              {customer.phone}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Não informado</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-gray-700">{customer.email}</span>
                            {customer.emailVerified ? (
                              <span title="Email verificado">
                                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                              </span>
                            ) : (
                              <span title="Email não verificado">
                                <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              STATUS_COLORS[customer.status || "active"] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABELS[customer.status || "active"] || customer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                          {customer.lastLogin && (
                            <div className="text-gray-400">
                              Último login: {new Date(customer.lastLogin).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {customer.allowStorePickup ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs"
                              onClick={() => toggleStorePickup.mutate({ customerId: customer.id, allow: false })}
                              disabled={toggleStorePickup.isPending}
                              title="Revogar permissão de retirada na loja"
                            >
                              <Store className="w-3.5 h-3.5 mr-1" />
                              Liberado
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-400 border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-xs"
                              onClick={() => toggleStorePickup.mutate({ customerId: customer.id, allow: true })}
                              disabled={toggleStorePickup.isPending}
                              title="Liberar pagamento na retirada da loja"
                            >
                              <StoreIcon className="w-3.5 h-3.5 mr-1" />
                              Liberar
                            </Button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {customer.status !== "blocked" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                onClick={() =>
                                  updateStatus.mutate({ customerId: customer.id, status: "blocked" })
                                }
                                disabled={updateStatus.isPending}
                              >
                                <Ban className="w-3.5 h-3.5 mr-1" />
                                Bloquear
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                                onClick={() =>
                                  updateStatus.mutate({ customerId: customer.id, status: "active" })
                                }
                                disabled={updateStatus.isPending}
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-1" />
                                Ativar
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs"
                                  disabled={deleteCustomer.isPending}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                                  Excluir
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Você está prestes a excluir permanentemente a conta de{" "}
                                    <strong>{customer.firstName} {customer.lastName}</strong> ({customer.email}).
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                    onClick={() => deleteCustomer.mutate({ customerId: customer.id })}
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
    </AdminLayout>
  );
}
