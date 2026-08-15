/**
 * Página /admin/usuarios — Gestão de Operadores e Permissões
 * Usa a tabela adminAccounts. NÃO tem relação com o CRM de clientes.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  UserPlus, KeyRound, Power, Pencil, ShieldCheck, Shield, Wrench,
  Loader2, Users, Lock, RefreshCw, ShieldAlert,
} from "lucide-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// ─── Definição da árvore de permissões (espelha o AdminLayout) ────────────────
const PERMISSION_TREE = [
  { key: "VENDAS", label: "VENDAS", children: [] },
  {
    key: "LINHA_PRODUCAO", label: "LINHA DE PRODUÇÃO",
    children: [
      { key: "LINHA_PRODUCAO.PRE_IMPRESSAO", label: "Pré-Impressão" },
      { key: "LINHA_PRODUCAO.STATUS_PRODUCAO", label: "Status de Produção" },
      { key: "LINHA_PRODUCAO.KANBAN", label: "Produção Kanban" },
      { key: "LINHA_PRODUCAO.VALIDACAO", label: "Validação de Arquivos" },
    ],
  },
  {
    key: "FINANCEIRO", label: "FINANCEIRO",
    children: [
      { key: "FINANCEIRO.GERENCIADOR", label: "Gerenciador Financeiro" },
      { key: "FINANCEIRO.FISCAL", label: "Gestão Fiscal" },
    ],
  },
  { key: "LOGISTICA", label: "LOGÍSTICA", children: [] },
  { key: "API_PAGAMENTOS", label: "API PAGAMENTOS", children: [] },
  {
    key: "PRODUTOS", label: "PRODUTOS",
    children: [
      { key: "PRODUTOS.LISTA", label: "Todos os Produtos" },
      { key: "PRODUTOS.VARIACOES", label: "Variações" },
      { key: "PRODUTOS.SEGMENTOS", label: "Segmentos" },
    ],
  },
  {
    key: "CRM", label: "CRM - CLIENTES",
    children: [
      { key: "CRM.SITE", label: "Clientes Site" },
      { key: "CRM.BALCAO", label: "Clientes Balcão" },
    ],
  },
  { key: "RELATORIOS", label: "RELATÓRIOS", children: [] },
  {
    key: "SISTEMA", label: "SISTEMA",
    children: [
      { key: "SISTEMA.USUARIOS", label: "Usuários" },
      { key: "SISTEMA.INTEGRACOES", label: "Integrações" },
    ],
  },
  {
    key: "BACKOFFICE", label: "BACKOFFICE",
    children: [
      { key: "BACKOFFICE.PERFIL", label: "Meu Perfil" },
      { key: "BACKOFFICE.ADMINS", label: "Administradores" },
      { key: "BACKOFFICE.LOGS", label: "Logs de Auditoria" },
    ],
  },
];

const roleLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  superadmin: { label: "Superadmin", icon: <ShieldCheck className="h-3 w-3" />, color: "bg-orange-100 text-orange-700 border-orange-200" },
  admin: { label: "Admin", icon: <Shield className="h-3 w-3" />, color: "bg-blue-100 text-blue-700 border-blue-200" },
  production: { label: "Produção", icon: <Wrench className="h-3 w-3" />, color: "bg-gray-100 text-gray-700 border-gray-200" },
};

// ─── Componente de Checkboxes de Permissões ───────────────────────────────────
function PermissionsPanel({
  value,
  onChange,
}: {
  value: string[] | null;
  onChange: (v: string[] | null) => void;
}) {
  const allKeys = PERMISSION_TREE.flatMap((g) => [g.key, ...g.children.map((c) => c.key)]);
  const isAll = value === null;

  const toggle = (key: string) => {
    if (isAll) {
      onChange(allKeys.filter((k) => k !== key));
      return;
    }
    const next = value.includes(key) ? value.filter((k) => k !== key) : [...value, key];
    onChange(next.length === allKeys.length ? null : next);
  };

  const toggleParent = (parentKey: string, children: { key: string }[]) => {
    const childKeys = children.map((c) => c.key);
    const allSelected = isAll || ([parentKey, ...childKeys].every((k) => (value ?? []).includes(k)));
    if (allSelected) {
      const next = isAll
        ? allKeys.filter((k) => k !== parentKey && !childKeys.includes(k))
        : (value ?? []).filter((k) => k !== parentKey && !childKeys.includes(k));
      onChange(next);
    } else {
      const existing = isAll ? allKeys : (value ?? []);
      const next = Array.from(new Set([...existing, parentKey, ...childKeys]));
      onChange(next.length === allKeys.length ? null : next);
    }
  };

  const isChecked = (key: string) => isAll || (value ?? []).includes(key);

  // Estado de accordion por grupo (fechado por padrão)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const toggleGroup = (key: string) => setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="max-h-[350px] overflow-y-auto pr-3 space-y-1">
      {/* Acesso Total */}
      <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-pink-50 border border-pink-100 mb-2">
        <Checkbox
          id="perm-all"
          checked={isAll}
          onCheckedChange={(checked) => onChange(checked ? null : [])}
        />
        <label htmlFor="perm-all" className="text-sm font-semibold text-pink-600 cursor-pointer flex-1">
          Acesso Total (Liberar Tudo)
        </label>
      </div>

      {/* Grupos com Accordion */}
      {PERMISSION_TREE.map((group) => {
        const parentChecked = isChecked(group.key);
        const hasChildren = group.children.length > 0;
        const isOpen = !!openGroups[group.key];
        // Conta filhos marcados
        const checkedChildCount = group.children.filter((c) => isChecked(c.key)).length;

        return (
          <div key={group.key} className="rounded-lg border border-gray-100 overflow-hidden">
            {/* Cabeçalho do grupo */}
            <div className="flex items-center gap-3 px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors">
              <Checkbox
                id={`perm-${group.key}`}
                checked={parentChecked}
                onCheckedChange={() => toggleParent(group.key, group.children)}
              />
              <label htmlFor={`perm-${group.key}`} className="text-sm font-semibold text-gray-800 cursor-pointer flex-1">
                {group.label}
              </label>
              {hasChildren && (
                <div className="flex items-center gap-1.5">
                  {checkedChildCount > 0 && !isAll && (
                    <span className="text-[10px] font-medium bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">
                      {checkedChildCount}/{group.children.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {isOpen
                      ? <ChevronDown className="w-3.5 h-3.5" />
                      : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
            {/* Subitens (colapsáveis) */}
            {hasChildren && isOpen && (
              <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 space-y-2">
                {group.children.map((child) => (
                  <div key={child.key} className="flex items-center gap-3 ml-6">
                    <Checkbox
                      id={`perm-${child.key}`}
                      checked={isChecked(child.key)}
                      onCheckedChange={() => toggle(child.key)}
                    />
                    <label htmlFor={`perm-${child.key}`} className="text-xs text-gray-600 cursor-pointer">
                      {child.label}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AdminUsuarios() {
  const { adminUser } = useAdminAuth();
  const isSuperAdmin = adminUser?.role === "superadmin";

  const { data: admins = [], isLoading, refetch } = trpc.adminAuth.listAdminsWithPermissions.useQuery();

  // Estados do formulário de criação
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: "admin" as "superadmin" | "admin" | "production" });
  const [createPermissions, setCreatePermissions] = useState<string[] | null>(null);

  // Estados do painel de permissões
  const [permOpen, setPermOpen] = useState(false);
  const [permTarget, setPermTarget] = useState<{ id: number; name: string } | null>(null);
  const [permValue, setPermValue] = useState<string[] | null>(null);

  // Estados de reset de senha
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Estados de edição
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: 0, name: "", email: "", role: "admin" as "superadmin" | "admin" | "production" });
  const [editPermissions, setEditPermissions] = useState<string[] | null>(null);

  const createAdmin = trpc.adminAuth.createAdmin.useMutation({
    onSuccess: async (data: any) => {
      // Se não é superadmin e há permissões definidas, salvar
      if (createForm.role !== "superadmin" && createPermissions !== null) {
        try {
          await updatePermissions.mutateAsync({ id: data?.id ?? 0, permissions: createPermissions });
        } catch (_) {}
      }
      toast.success("Operador criado com sucesso!");
      refetch();
      setCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", role: "admin" });
      setCreatePermissions(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const updatePermissions = trpc.adminAuth.updateAdminPermissions.useMutation({
    onSuccess: () => { toast.success("Permissões salvas!"); refetch(); setPermOpen(false); setEditOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateAdmin = trpc.adminAuth.updateAdmin.useMutation({
    onSuccess: async () => {
      if (editForm.role !== "superadmin") {
        try { await updatePermissions.mutateAsync({ id: editForm.id, permissions: editPermissions }); } catch (_) {}
      }
      toast.success("Operador atualizado com sucesso!");
      refetch();
      setEditOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (admin: any) => {
    setEditForm({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });
    setEditPermissions(admin.permissions ?? null);
    setEditOpen(true);
  };

  const toggleStatus = trpc.adminAuth.toggleAdminStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const resetPassword = trpc.adminAuth.resetAdminPassword.useMutation({
    onSuccess: () => { toast.success("Senha redefinida!"); refetch(); setResetOpen(false); setNewPassword(""); },
    onError: (e) => toast.error(e.message),
  });

  const openPermissions = (admin: any) => {
    setPermTarget({ id: admin.id, name: admin.name });
    setPermValue(admin.permissions ?? null);
    setPermOpen(true);
  };

  return (
    <AdminLayout>
      <div className="admin-visual-system min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-pink-500" />
                Usuários e Permissões
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Gerencie operadores e controle de acesso por menu</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
              </Button>
              {isSuperAdmin && (
                <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white" onClick={() => setCreateOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" /> Novo Operador
                </Button>
              )}
            </div>
          </div>

          {/* Aviso para não-superadmin */}
          {!isSuperAdmin && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              Apenas superadmin pode criar operadores ou alterar permissões.
            </div>
          )}

          {/* Tabela */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isLoading ? "Carregando..." : `${admins.length} operador(es) cadastrado(s)`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Operador</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">E-mail</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Perfil</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Permissões</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Último Login</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {admins.map((admin: any) => {
                        const rl = roleLabels[admin.role] ?? roleLabels.admin;
                        return (
                          <tr key={admin.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3 font-medium text-gray-900">{admin.name}</td>
                            <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${rl.color}`}>
                                {rl.icon}{rl.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${admin.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {admin.status === "active" ? "Ativo" : "Inativo"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {admin.role === "superadmin" ? (
                                <span className="text-xs text-orange-600 font-medium">Acesso Total</span>
                              ) : admin.permissions === null ? (
                                <span className="text-xs text-green-600 font-medium">Acesso Total</span>
                              ) : admin.permissions.length === 0 ? (
                                <span className="text-xs text-red-500 font-medium">Sem acesso</span>
                              ) : (
                                <span className="text-xs text-blue-600 font-medium">{admin.permissions.length} permissão(ões)</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              {admin.lastLogin ? new Date(admin.lastLogin).toLocaleDateString("pt-BR") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {/* Editar */}
                                {isSuperAdmin && (
                                  <Button
                                    variant="outline" size="sm"
                                    className="text-gray-600 border-gray-200 hover:bg-gray-50 text-xs"
                                    onClick={() => openEdit(admin)}
                                  >
                                    <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                                  </Button>
                                )}
                                {/* Reset Senha */}
                                {isSuperAdmin && (
                                  <Button
                                    variant="outline" size="sm"
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs"
                                    onClick={() => { setResetTarget({ id: admin.id, name: admin.name }); setResetOpen(true); }}
                                  >
                                    <KeyRound className="w-3.5 h-3.5 mr-1" /> Senha
                                  </Button>
                                )}
                                {/* Ativar/Desativar */}
                                {isSuperAdmin && admin.id !== adminUser?.id && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline" size="sm"
                                        className={`text-xs ${admin.status === "active" ? "text-red-600 border-red-200 hover:bg-red-50" : "text-green-600 border-green-200 hover:bg-green-50"}`}
                                      >
                                        <Power className="w-3.5 h-3.5 mr-1" />
                                        {admin.status === "active" ? "Desativar" : "Ativar"}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>{admin.status === "active" ? "Desativar" : "Ativar"} operador?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {admin.status === "active"
                                            ? `${admin.name} perderá acesso ao sistema imediatamente.`
                                            : `${admin.name} voltará a ter acesso ao sistema.`}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          className={admin.status === "active" ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                                          onClick={() => toggleStatus.mutate({ id: admin.id, status: admin.status === "active" ? "inactive" : "active" })}
                                        >
                                          Confirmar
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Criar Operador */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="admin-visual-system max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-600">
              <UserPlus className="w-5 h-5" /> Novo Operador
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            {/* Coluna esquerda: dados do operador */}
            <div className="space-y-4">
              <div className="pb-2 border-b border-gray-100">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Dados do Operador</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Nome completo</Label>
                <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: João Silva" className="mt-1.5 focus:border-pink-400 focus:ring-pink-400" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">E-mail</Label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="joao@empresa.com" className="mt-1.5 focus:border-pink-400 focus:ring-pink-400" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Senha <span className="text-gray-400 font-normal">(mín. 8 caracteres)</span></Label>
                <Input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" className="mt-1.5 focus:border-pink-400 focus:ring-pink-400" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Perfil de Acesso</Label>
                <Select value={createForm.role} onValueChange={(v) => {
                  setCreateForm((f) => ({ ...f, role: v as any }));
                  if (v === "superadmin") setCreatePermissions(null);
                }}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">
                      <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> Superadmin (acesso total)</span>
                    </SelectItem>
                    <SelectItem value="admin">
                      <span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-blue-500" /> Admin</span>
                    </SelectItem>
                    <SelectItem value="production">
                      <span className="flex items-center gap-2"><Wrench className="w-3.5 h-3.5 text-gray-500" /> Produção</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Coluna direita: permissões */}
            <div className="space-y-3">
              <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Permissões de Menu</p>
                {createForm.role === "superadmin" && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Acesso Total</span>
                )}
              </div>
              {createForm.role === "superadmin" ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
                  <ShieldCheck className="w-10 h-10 mb-2 text-orange-300" />
                  <p className="text-sm">Superadmin tem acesso irrestrito a todos os módulos do sistema.</p>
                </div>
              ) : (
                <PermissionsPanel value={createPermissions} onChange={setCreatePermissions} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={createAdmin.isPending}
              onClick={() => createAdmin.mutate({ ...createForm })}
            >
              {createAdmin.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Operador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Permissões */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>

      {/* Dialog: Editar Operador */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="admin-visual-system max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-800">
              <Pencil className="w-5 h-5 text-pink-500" /> Editar Operador
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            <div className="space-y-4">
              <div className="pb-2 border-b border-gray-100">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Dados do Operador</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Nome completo</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">E-mail</Label>
                <Input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Perfil de Acesso</Label>
                <Select value={editForm.role} onValueChange={(v) => {
                  setEditForm((f) => ({ ...f, role: v as any }));
                  if (v === "superadmin") setEditPermissions(null);
                }}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin"><span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-orange-500" /> Superadmin</span></SelectItem>
                    <SelectItem value="admin"><span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-blue-500" /> Admin</span></SelectItem>
                    <SelectItem value="production"><span className="flex items-center gap-2"><Wrench className="w-3.5 h-3.5 text-gray-500" /> Produção</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 italic">Para redefinir a senha, use o botão "Senha" na listagem.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="pb-2 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Permissões de Menu</p>
                {editForm.role === "superadmin" && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Acesso Total</span>}
              </div>
              {editForm.role === "superadmin" ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
                  <ShieldCheck className="w-10 h-10 mb-2 text-orange-300" />
                  <p className="text-sm">Superadmin tem acesso irrestrito a todos os módulos.</p>
                </div>
              ) : (
                <PermissionsPanel value={editPermissions} onChange={setEditPermissions} />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={updateAdmin.isPending}
              onClick={() => updateAdmin.mutate({ id: editForm.id, name: editForm.name, email: editForm.email, role: editForm.role })}
            >
              {updateAdmin.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        <DialogContent className="admin-visual-system max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-600">
              <Lock className="w-5 h-5" /> Permissões — {permTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-xs text-gray-500 mb-3">Marque os menus que este operador pode acessar. Deixe "Acesso Total" marcado para liberar tudo.</p>
            <PermissionsPanel value={permValue} onChange={setPermValue} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermOpen(false)}>Cancelar</Button>
            <Button
              className="bg-pink-600 hover:bg-pink-700 text-white"
              disabled={updatePermissions.isPending}
              onClick={() => permTarget && updatePermissions.mutate({ id: permTarget.id, permissions: permValue })}
            >
              {updatePermissions.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Permissões
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reset Senha */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="admin-visual-system max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <KeyRound className="w-5 h-5" /> Redefinir Senha — {resetTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Nova senha (mín. 8 caracteres)</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancelar</Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={resetPassword.isPending || newPassword.length < 8}
              onClick={() => resetTarget && resetPassword.mutate({ id: resetTarget.id, newPassword })}
            >
              {resetPassword.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
