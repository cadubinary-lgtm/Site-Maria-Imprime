import AdminLayout from "@/components/AdminLayout";
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft, Search, Users, CheckCircle, AlertCircle, Ban, UserCheck,
  Loader2, RefreshCw, Mail, Phone, Trash2, Store, StoreIcon, Eye, Plus,
  MapPin, CreditCard, ShoppingBag, Lock, Calendar, Clock, Shield, Pencil,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

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

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  in_production: "Em Produção",
  ready: "Pronto",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  in_production: "bg-orange-100 text-orange-700",
  ready: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

function CustomerDetailModal({
  customerId,
  open,
  onClose,
  onRefetch,
}: {
  customerId: number | null;
  open: boolean;
  onClose: () => void;
  onRefetch: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { data, isLoading, refetch: refetchDetail } = trpc.customerAuth.adminGetCustomerDetail.useQuery(
    { customerId: customerId! },
    { enabled: !!customerId && open }
  );

  const setPassword = trpc.customerAuth.adminSetCustomerPassword.useMutation({
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setNewPassword("");
      setShowPasswordForm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePriceTier = trpc.customerAuth.adminUpdateCustomerPriceTier.useMutation({
    onSuccess: async () => {
      await refetchDetail();
      onRefetch();
      toast.success("Tabela de preços atualizada");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSetPassword = () => {
    if (!customerId) return;
    if (newPassword.length < 8) {
      toast.error("Senha deve ter ao menos 8 caracteres");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Senha deve conter ao menos uma letra maiúscula");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error("Senha deve conter ao menos um número");
      return;
    }
    setPassword.mutate({ customerId, newPassword });
  };

  const customer = data?.customer;
  const orders = data?.orders || [];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-pink-600" aria-hidden="true" />
            Detalhes do Cliente
          </DialogTitle>
          <DialogDescription>
            Informações completas e histórico de pedidos
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando detalhes do cliente" />
          </div>
        ) : !customer ? (
          <div className="text-center py-8 text-gray-500">Cliente não encontrado</div>
        ) : (
          <div className="space-y-5">

            {/* Informações Pessoais */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                <UserCheck className="w-4 h-4 text-pink-600" aria-hidden="true" />
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Nome Completo</p>
                  <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">CPF / CNPJ</p>
                  <p className="font-medium text-gray-900">
                    {customer.cpfCnpj || <span className="text-gray-400 italic">Não informado</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">E-mail</p>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-900">{customer.email}</span>
                    {customer.emailVerified ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500"  />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-yellow-500"  />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Telefone / WhatsApp</p>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-900">
                      {customer.phone || <span className="text-gray-400 italic">Não informado</span>}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[customer.status || "active"]}`}>
                    {STATUS_LABELS[customer.status || "active"]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Retirada na Loja</p>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${customer.allowStorePickup ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {customer.allowStorePickup ? "Liberado" : "Não liberado"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tabela de Preços</p>
                  <Select
                    value={customer.priceTier || "final"}
                    onValueChange={(priceTier) => updatePriceTier.mutate({ customerId: customer.id, priceTier: priceTier as "final" | "reseller" })}
                    disabled={updatePriceTier.isPending}
                  >
                  <SelectTrigger className="h-8 text-xs" aria-label={`Tabela de preços de ${customer.firstName} ${customer.lastName}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="final">Cliente final</SelectItem>
                      <SelectItem value="reseller">Revendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Datas e Acesso */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                <Calendar className="w-4 h-4 text-pink-600" aria-hidden="true" />
                Datas e Acesso
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Membro desde</p>
                  <p className="text-gray-900">{new Date(customer.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Último Login</p>
                  <p className="text-gray-900">
                    {customer.lastLogin
                      ? new Date(customer.lastLogin).toLocaleString("pt-BR")
                      : <span className="text-gray-400 italic">Nunca</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Última Atualização</p>
                  <p className="text-gray-900">{customer.updatedAt ? new Date(customer.updatedAt).toLocaleString("pt-BR") : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tentativas de Login Falhas</p>
                  <p className={`font-medium ${(customer.loginAttempts || 0) >= 3 ? "text-red-600" : "text-gray-900"}`}>
                    {customer.loginAttempts || 0}
                    {customer.lockedUntil && customer.lockedUntil > Date.now() && (
                      <span className="ml-2 text-xs text-red-500">
                        (bloqueado até {new Date(customer.lockedUntil).toLocaleTimeString("pt-BR")})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Endereço */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                <MapPin className="w-4 h-4 text-pink-600" aria-hidden="true" />
                Endereço de Entrega
              </h3>
              {customer.addressStreet ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">CEP</p>
                    <p className="text-gray-900">{customer.addressZipCode || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Rua / Avenida</p>
                    <p className="text-gray-900">{customer.addressStreet}, {customer.addressNumber}</p>
                  </div>
                  {customer.addressComplement && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Complemento</p>
                      <p className="text-gray-900">{customer.addressComplement}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Bairro</p>
                    <p className="text-gray-900">{customer.addressNeighborhood || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Cidade / UF</p>
                    <p className="text-gray-900">{customer.addressCity} — {customer.addressState}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Endereço não cadastrado</p>
              )}
            </div>

            <Separator />

            {/* Redefinir Senha */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                <Lock className="w-4 h-4 text-pink-600" aria-hidden="true" />
                Segurança
              </h3>
              {!showPasswordForm ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordForm(true)}
                  className="text-pink-600 border-pink-200 hover:bg-pink-50"
                >
                  <Lock className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  Redefinir Senha do Cliente
                </Button>
              ) : (
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <label htmlFor="customer-reset-password" className="sr-only">Nova senha do cliente</label>
                    <Input
                      id="customer-reset-password"
                      type="text"
                      placeholder="Nova senha (mín. 8 chars, 1 maiúscula, 1 número)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Mínimo 8 caracteres, 1 letra maiúscula e 1 número
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSetPassword}
                    disabled={setPassword.isPending}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    aria-busy={setPassword.isPending}
                  >
                    {setPassword.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : "Salvar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowPasswordForm(false); setNewPassword(""); }}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Histórico de Pedidos */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                <ShoppingBag className="w-4 h-4 text-pink-600" aria-hidden="true" />
                Histórico de Pedidos ({orders.length})
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
                          {order.paymentMethod && ` · ${order.paymentMethod.toUpperCase()}`}
                          {order.shippingLabel && ` · ${order.shippingLabel}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
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

function CustomerEditDialog({ customer, open, onClose, onSaved }: { customer: any | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", cpfCnpj: "", newPassword: "", confirmPassword: "", priceTier: "final" as "final" | "reseller", accountType: "customer" as "customer" | "reseller" | "agency", addressZipCode: "", addressStreet: "", addressNumber: "", addressComplement: "", addressNeighborhood: "", addressCity: "", addressState: "" });
  const updateCustomer = trpc.customerAuth.adminUpdateCustomer.useMutation({
    onSuccess: (result) => {
      toast.success(result.emailVerificationSent ? "Cliente atualizado. Uma confirmação foi enviada ao novo e-mail." : "Cliente atualizado com sucesso.");
      onSaved();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (!customer) return;
    setForm({
      firstName: customer.firstName || "", lastName: customer.lastName || "", email: customer.email || "", phone: customer.phone || "", cpfCnpj: customer.cpfCnpj || "", newPassword: "", confirmPassword: "", priceTier: customer.priceTier === "reseller" ? "reseller" : "final", accountType: customer.accountType === "reseller" || customer.accountType === "agency" ? customer.accountType : "customer",
      addressZipCode: customer.addressZipCode || "", addressStreet: customer.addressStreet || "", addressNumber: customer.addressNumber || "", addressComplement: customer.addressComplement || "", addressNeighborhood: customer.addressNeighborhood || "", addressCity: customer.addressCity || "", addressState: customer.addressState || "",
    });
  }, [customer]);

  const field = (key: keyof typeof form, label: string, placeholder: string, className = "", type = "text") => (
    <label className={`grid gap-1.5 text-sm font-medium text-gray-700 ${className}`}>
      <span>{label}</span>
      <Input type={type} placeholder={placeholder} value={form[key] as string} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Cliente</DialogTitle><DialogDescription>Atualize os dados cadastrais sem alterar o acesso do cliente.</DialogDescription></DialogHeader>
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (form.newPassword && form.newPassword !== form.confirmPassword) { toast.error("As senhas não coincidem."); return; } if (customer) { const { confirmPassword, ...payload } = form; updateCustomer.mutate({ customerId: customer.id, ...payload }); } }}>
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4"><h3 className="font-semibold text-gray-900">Dados Pessoais</h3><p className="text-xs text-gray-500">Dados cadastrados e informações de acesso do cliente.</p></div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {field("firstName", "Nome *", "Nome")}{field("lastName", "Sobrenome *", "Sobrenome")}
              {field("email", "E-mail *", "email@exemplo.com", "md:col-span-2", "email")}{field("phone", "Telefone / WhatsApp", "(00) 00000-0000")}{field("cpfCnpj", "CPF / CNPJ", "000.000.000-00")}
              {field("newPassword", "Nova senha (opcional)", "Deixe em branco para manter a atual", "", "password")}{field("confirmPassword", "Confirmar nova senha", "Repita a nova senha", "", "password")}
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Tipo de cliente</span><Select value={form.accountType} onValueChange={(value: "customer" | "reseller" | "agency") => setForm({ ...form, accountType: value })}><SelectTrigger aria-label="Tipo de cliente"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="customer">Cliente site</SelectItem><SelectItem value="reseller">Revendedor</SelectItem><SelectItem value="agency">Agência</SelectItem></SelectContent></Select></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Tabela de Preços</span><Select value={form.priceTier} onValueChange={(value: "final" | "reseller") => setForm({ ...form, priceTier: value })}><SelectTrigger aria-label="Tabela de preços"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="final">Cliente final</SelectItem><SelectItem value="reseller">Revendedor</SelectItem></SelectContent></Select></label>
            </div>
          </section>
          <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="mb-4"><h3 className="font-semibold text-gray-900">Endereço de Entrega</h3><p className="text-xs text-gray-500">Usado para preencher o checkout quando disponível.</p></div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {field("addressZipCode", "CEP", "00000-000", "md:col-span-2")}{field("addressStreet", "Rua / Avenida", "Nome da rua")}{field("addressNumber", "Número", "123")}
              {field("addressComplement", "Complemento", "Apto, sala, bloco...", "md:col-span-2")}{field("addressNeighborhood", "Bairro", "Bairro", "md:col-span-2")}{field("addressCity", "Cidade", "Cidade")}{field("addressState", "UF", "SP")}
            </div>
          </section>
          <div className="flex gap-2"><Button type="submit" disabled={updateCustomer.isPending}>Salvar alterações</Button><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminCustomers() {
  const searchParams = useSearch();
  const partnerType = new URLSearchParams(searchParams).get("tipo") === "revendedor"
    ? "reseller"
    : new URLSearchParams(searchParams).get("tipo") === "agencia"
      ? "agency"
      : undefined;
  const newCustomerMode = new URLSearchParams(searchParams).get("novo") === "cliente";
  const forcedClientType = partnerType === "reseller" ? "revendedor" : partnerType === "agency" ? "agencia" : undefined;
  const pageTitle = partnerType === "reseller" ? "Revendedores" : partnerType === "agency" ? "Agências" : "Clientes Cadastrados";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "blocked">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [showPartnerForm, setShowPartnerForm] = useState(newCustomerMode);
  const [creationClientType, setCreationClientType] = useState<"site" | "balcao" | "revendedor" | "agencia">(forcedClientType ?? "site");
  const [partnerForm, setPartnerForm] = useState({ firstName: "", lastName: "", email: "", phone: "", cpfCnpj: "", password: "", confirmPassword: "", addressZipCode: "", addressStreet: "", addressNumber: "", addressComplement: "", addressNeighborhood: "", addressCity: "", addressState: "" });
  const isBalcaoCreation = creationClientType === "balcao";
  const accountTypeForCreation = creationClientType === "revendedor" ? "reseller" : creationClientType === "agencia" ? "agency" : "customer";
  const resetCreationForm = () => setPartnerForm({ firstName: "", lastName: "", email: "", phone: "", cpfCnpj: "", password: "", confirmPassword: "", addressZipCode: "", addressStreet: "", addressNumber: "", addressComplement: "", addressNeighborhood: "", addressCity: "", addressState: "" });

  const { data, isLoading, refetch } = trpc.customerAuth.adminListCustomers.useQuery({
    search: search || undefined,
    status: statusFilter,
    accountType: partnerType,
    limit: 100,
    offset: 0,
  });

  const updateStatus = trpc.customerAuth.adminUpdateCustomerStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado com sucesso!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteCustomer = trpc.customerAuth.adminDeleteCustomer.useMutation({
    onSuccess: () => { toast.success("Cliente excluído com sucesso!"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const toggleStorePickup = trpc.customerAuth.adminToggleStorePickup.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.allow ? "Retirada na loja liberada!" : "Retirada na loja revogada!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const updatePriceTier = trpc.customerAuth.adminUpdateCustomerPriceTier.useMutation({
    onSuccess: () => { toast.success("Tabela de preços atualizada"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const createPartner = trpc.customerAuth.adminCreatePartnerAccount.useMutation({
    onSuccess: () => {
      toast.success("Cliente criado com sucesso", { description: creationClientType === "site" ? "Acesso do cliente do site criado e e-mail de definição de senha enviado." : `Cadastro de ${creationClientType === "revendedor" ? "revendedor" : "agência"} criado e acesso enviado.`, position: "top-right", duration: 3500, id: `create-customer-account-${creationClientType}` });
      resetCreationForm();
      setShowPartnerForm(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });
  const createBalcao = trpc.crm.createClient.useMutation({
    onSuccess: () => {
      toast.success("Cliente de balcão criado com sucesso", { description: "O cadastro já está disponível em Todos os Clientes e no dashboard.", position: "top-right", duration: 3500, id: "create-customer-balcao" });
      resetCreationForm();
      setShowPartnerForm(false);
      refetch();
    },
    onError: (err) => toast.error(`Não foi possível criar o cliente de balcão: ${err.message}`),
  });
  const resendPartnerInvite = trpc.customerAuth.adminResendPartnerInvite.useMutation({
    onSuccess: () => toast.success("Novo link para definição de senha enviado por e-mail."),
    onError: (err) => toast.error(err.message),
  });

  const customers = data?.customers || [];
  const total = data?.total || 0;
  const activeCount = customers.filter((c) => c.status === "active").length;
  const blockedCount = customers.filter((c) => c.status === "blocked").length;
  const unverifiedCount = customers.filter((c) => !c.emailVerified).length;
  const isCreatingCustomer = createPartner.isPending || createBalcao.isPending;

  const handleCreateCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!partnerForm.firstName.trim() || !partnerForm.lastName.trim()) {
      toast.error("Informe nome e sobrenome do cliente.");
      return;
    }
    if (isBalcaoCreation) {
      await createBalcao.mutateAsync({
        name: `${partnerForm.firstName.trim()} ${partnerForm.lastName.trim()}`,
        email: partnerForm.email,
        phone: partnerForm.phone,
        whatsapp: partnerForm.phone,
        cpfCnpj: partnerForm.cpfCnpj,
        addressZipCode: partnerForm.addressZipCode,
        addressStreet: partnerForm.addressStreet,
        addressNumber: partnerForm.addressNumber,
        addressComplement: partnerForm.addressComplement,
        addressNeighborhood: partnerForm.addressNeighborhood,
        addressCity: partnerForm.addressCity,
        addressState: partnerForm.addressState,
        clientType: "balcao",
      });
      return;
    }
    if (!partnerForm.email.trim() || partnerForm.password.length < 8 || partnerForm.password !== partnerForm.confirmPassword) {
      toast.error("Informe um e-mail e uma senha temporária válida de ao menos 8 caracteres.");
      return;
    }
    const { confirmPassword, ...payload } = partnerForm;
    await createPartner.mutateAsync({ ...payload, accountType: accountTypeForCreation });
  };

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
                  <Users className="w-6 h-6 text-pink-600" aria-hidden="true" />
                  {pageTitle}
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">{partnerType ? `Gerenciamento de contas de ${partnerType === "reseller" ? "revendedores" : "agências"}` : "Gerenciamento de contas de clientes da loja"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white" onClick={() => setShowPartnerForm((open) => !open)}><Plus className="w-4 h-4 mr-2" aria-hidden="true" />Novo Cliente</Button>
              <Button variant="outline" size="sm" onClick={() => refetch()} aria-busy={isLoading}><RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />Atualizar</Button>
            </div>
          </div>

          {showPartnerForm && (
            <Card className="mb-6 border-pink-100"><CardHeader><CardTitle className="text-base text-gray-900">Novo cliente</CardTitle><p className="text-sm text-gray-500">Escolha o tipo antes de criar. O cadastro será refletido na lista unificada e nos indicadores de clientes.</p></CardHeader><CardContent><form onSubmit={handleCreateCustomer} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2"><label htmlFor="creation-client-type" className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de cliente *</label><Select value={creationClientType} onValueChange={(value: "site" | "balcao" | "revendedor" | "agencia") => setCreationClientType(value)} disabled={Boolean(forcedClientType)}><SelectTrigger id="creation-client-type" aria-label="Tipo de cliente para o novo cadastro"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="site">Cliente site</SelectItem><SelectItem value="balcao">Cliente balcão</SelectItem><SelectItem value="revendedor">Revendedor</SelectItem><SelectItem value="agencia">Agência</SelectItem></SelectContent></Select><p className="mt-1 text-xs text-gray-500">{isBalcaoCreation ? "Cliente de balcão não recebe acesso ao site; os dados ficam disponíveis no CRM." : "Este tipo terá acesso ao site e receberá um e-mail para definir a senha."}</p></div>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Nome *</span><Input value={partnerForm.firstName} onChange={(e) => setPartnerForm({ ...partnerForm, firstName: e.target.value })} required /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Sobrenome *</span><Input value={partnerForm.lastName} onChange={(e) => setPartnerForm({ ...partnerForm, lastName: e.target.value })} required /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700 md:col-span-2"><span>E-mail{isBalcaoCreation ? "" : " *"}</span><Input type="email" value={partnerForm.email} onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })} required={!isBalcaoCreation} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Telefone</span><Input value={partnerForm.phone} onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>CPF/CNPJ</span><Input value={partnerForm.cpfCnpj} onChange={(e) => setPartnerForm({ ...partnerForm, cpfCnpj: e.target.value })} /></label>
              {!isBalcaoCreation && <><label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Senha temporária *</span><Input type="password" minLength={8} value={partnerForm.password} onChange={(e) => setPartnerForm({ ...partnerForm, password: e.target.value })} required /></label><label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Confirmar senha *</span><Input type="password" minLength={8} value={partnerForm.confirmPassword} onChange={(e) => setPartnerForm({ ...partnerForm, confirmPassword: e.target.value })} required /></label></>}
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>CEP</span><Input value={partnerForm.addressZipCode} onChange={(e) => setPartnerForm({ ...partnerForm, addressZipCode: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Rua / Avenida</span><Input value={partnerForm.addressStreet} onChange={(e) => setPartnerForm({ ...partnerForm, addressStreet: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Número</span><Input value={partnerForm.addressNumber} onChange={(e) => setPartnerForm({ ...partnerForm, addressNumber: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Complemento</span><Input value={partnerForm.addressComplement} onChange={(e) => setPartnerForm({ ...partnerForm, addressComplement: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Bairro</span><Input value={partnerForm.addressNeighborhood} onChange={(e) => setPartnerForm({ ...partnerForm, addressNeighborhood: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>Cidade</span><Input value={partnerForm.addressCity} onChange={(e) => setPartnerForm({ ...partnerForm, addressCity: e.target.value })} /></label>
              <label className="grid gap-1.5 text-sm font-medium text-gray-700"><span>UF</span><Input maxLength={2} value={partnerForm.addressState} onChange={(e) => setPartnerForm({ ...partnerForm, addressState: e.target.value.toUpperCase() })} /></label>
              <div className="flex gap-2 pt-2 md:col-span-2"><Button type="submit" disabled={isCreatingCustomer} aria-busy={isCreatingCustomer}>{isCreatingCustomer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}{isBalcaoCreation ? "Criar cliente de balcão" : "Criar e enviar acesso"}</Button><Button type="button" variant="outline" onClick={() => { resetCreationForm(); setShowPartnerForm(false); }}>Cancelar</Button></div>
            </form></CardContent></Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total", value: total, icon: Users, color: "blue" },
              { label: "Ativos", value: activeCount, icon: UserCheck, color: "green" },
              { label: "Não verificados", value: unverifiedCount, icon: AlertCircle, color: "yellow" },
              { label: "Bloqueados", value: blockedCount, icon: Ban, color: "red" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${color}-600`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <label htmlFor="admin-customers-search" className="sr-only">Buscar clientes</label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
                  <Input
                    id="admin-customers-search"
                    placeholder="Buscar por nome, email ou telefone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
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
                  <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando clientes" />
                </div>
              ) : customers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum cliente encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="customer-list-standard w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Contato</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Cadastro</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Tabela de Preços</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Retirada</th>
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
                                <CheckCircle className="w-3.5 h-3.5 text-green-500"  />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-yellow-500"  />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[customer.status || "active"] || "bg-gray-100 text-gray-600"}`}>
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
                            <Select value={customer.priceTier || "final"} onValueChange={(priceTier: "final" | "reseller") => updatePriceTier.mutate({ customerId: customer.id, priceTier })} disabled={updatePriceTier.isPending}>
                              <SelectTrigger className="h-8 min-w-28 text-xs" aria-label={`Tabela de preços de ${customer.firstName} ${customer.lastName}`}><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="final">Cliente final</SelectItem><SelectItem value="reseller">Revendedor</SelectItem></SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            {customer.allowStorePickup ? (
                              <Button
                                variant="outline" size="sm"
                                className="text-green-700 border-green-200 hover:bg-green-50 text-xs"
                                onClick={() => toggleStorePickup.mutate({ customerId: customer.id, allow: false })}
                                disabled={toggleStorePickup.isPending}
                                aria-busy={toggleStorePickup.isPending}
                                aria-label={`Revogar retirada na loja para ${customer.firstName} ${customer.lastName}`}
                              >
                                <Store className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                                Liberado
                              </Button>
                            ) : (
                              <Button
                                variant="outline" size="sm"
                                className="text-gray-500 border-gray-200 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200 text-xs"
                                onClick={() => toggleStorePickup.mutate({ customerId: customer.id, allow: true })}
                                disabled={toggleStorePickup.isPending}
                                aria-busy={toggleStorePickup.isPending}
                                aria-label={`Liberar retirada na loja para ${customer.firstName} ${customer.lastName}`}
                              >
                                <StoreIcon className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                                Liberar
                              </Button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div data-customer-actions>
                              {/* Ver Detalhes */}
                              <Button
                                variant="outline" size="sm"
                                className="text-pink-600 border-pink-200 hover:bg-pink-50 text-xs"
                                onClick={() => { setSelectedCustomerId(customer.id); setDetailOpen(true); }}
                                aria-label={`Ver detalhes de ${customer.firstName} ${customer.lastName}`}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                                Ver
                              </Button>
                              <Button
                                variant="outline" size="sm"
                                className="text-pink-600 border-pink-200 hover:bg-pink-50 text-xs"
                                onClick={() => setEditingCustomer(customer)}
                                aria-label={`Editar ${customer.firstName} ${customer.lastName}`}
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" aria-hidden="true" />Editar
                              </Button>
                              {partnerType && (
                                <Button variant="outline" size="sm" className="text-pink-600 border-pink-200 hover:bg-pink-50 text-xs" onClick={() => resendPartnerInvite.mutate({ customerId: customer.id })} disabled={resendPartnerInvite.isPending} aria-busy={resendPartnerInvite.isPending} aria-label={`Reenviar acesso para ${customer.firstName} ${customer.lastName}`}>
                                  <Mail className="w-3.5 h-3.5 mr-1" aria-hidden="true" />Reenviar acesso
                                </Button>
                              )}

                              {/* Bloquear / Ativar */}
                              {customer.status !== "blocked" ? (
                                <Button
                                  variant="outline" size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                  onClick={() => updateStatus.mutate({ customerId: customer.id, status: "blocked" })}
                                  disabled={updateStatus.isPending}
                                >
                                  <Ban className="w-3.5 h-3.5 mr-1" />
                                  Bloquear
                                </Button>
                              ) : (
                                <Button
                                  variant="outline" size="sm"
                                  className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
                                  onClick={() => updateStatus.mutate({ customerId: customer.id, status: "active" })}
                                  disabled={updateStatus.isPending}
                                >
                                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                                  Ativar
                                </Button>
                              )}

                              {/* Excluir */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline" size="sm"
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

      {/* Modal de Detalhes */}
      <CustomerDetailModal
        customerId={selectedCustomerId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedCustomerId(null); }}
        onRefetch={refetch}
      />
      <CustomerEditDialog customer={editingCustomer} open={!!editingCustomer} onClose={() => setEditingCustomer(null)} onSaved={refetch} />
    </AdminLayout>
  );
}
