import { useState } from "react";
import { Pencil, Plus, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { trpc } from "@/lib/trpc";

type SellerForm = {
  name: string;
  email: string;
  password: string;
  commissionRate: string;
  allowStorePickupPayment: boolean;
};

const blank: SellerForm = {
  name: "",
  email: "",
  password: "",
  commissionRate: "0",
  allowStorePickupPayment: false,
};

export default function AdminSellers() {
  const { adminUser } = useAdminAuth();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.sellers.admin.list.useQuery(undefined, { enabled: adminUser?.role === "superadmin" });
  const create = trpc.sellers.admin.create.useMutation();
  const update = trpc.sellers.admin.update.useMutation();
  const remove = trpc.sellers.admin.delete.useMutation();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [form, setForm] = useState<SellerForm>(blank);

  const reload = () => utils.sellers.admin.list.invalidate();

  const saveCreate = async () => {
    try {
      const result = await create.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        commissionRate: Number(form.commissionRate),
        allowStorePickupPayment: form.allowStorePickupPayment,
      });
      await reload();
      setCreateOpen(false);
      setForm(blank);
      toast.success(result.linkedExistingAccount ? "Conta convertida e vinculada" : "Vendedor criado", {
        description: form.allowStorePickupPayment
          ? `${form.name} já pode vender e usar pagamento na retirada.`
          : `${form.name} já pode acessar a Central do Vendedor.`,
        position: "top-right",
        duration: 3500,
      });
    } catch (error: any) {
      toast.error("Não foi possível salvar o vendedor", { description: error?.message });
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await update.mutateAsync({
        id: editing.id,
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        commissionRate: Number(form.commissionRate),
        status: editing.status,
        allowStorePickupPayment: form.allowStorePickupPayment,
      });
      await reload();
      setEditing(null);
      setForm(blank);
      toast.success("Dados do vendedor atualizados", {
        description: "Dados comerciais, credenciais e permissão de retirada foram salvos.",
        position: "top-right",
        duration: 3500,
      });
    } catch (error: any) {
      toast.error("Não foi possível atualizar o vendedor", { description: error?.message });
    }
  };

  const togglePickupPayment = async (seller: any) => {
    try {
      const allowStorePickupPayment = !seller.allowStorePickupPayment;
      await update.mutateAsync({ id: seller.id, status: seller.status, allowStorePickupPayment });
      await reload();
      toast.success(allowStorePickupPayment ? "Pagamento na retirada liberado" : "Pagamento na retirada bloqueado", {
        description: `${seller.name} foi atualizado.`,
        position: "top-right",
        duration: 3500,
      });
    } catch (error: any) {
      toast.error("Não foi possível atualizar a liberação", { description: error?.message });
    }
  };

  const deleteSeller = async () => {
    if (!deleting) return;
    try {
      await remove.mutateAsync({ id: deleting.id });
      await reload();
      setDeleting(null);
      toast.success("Vendedor excluído", {
        description: "O acesso comercial e os dados sem histórico financeiro foram removidos.",
        position: "top-right",
        duration: 3500,
      });
    } catch (error: any) {
      toast.error("Não foi possível excluir o vendedor", { description: error?.message });
    }
  };

  const openEdit = (seller: any) => {
    setEditing({ ...seller });
    setForm({
      name: seller.name,
      email: seller.email,
      password: "",
      commissionRate: String(seller.commissionRate),
      allowStorePickupPayment: Boolean(seller.allowStorePickupPayment),
    });
  };

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (open) setForm(blank);
  };

  const fields = (passwordLabel: string) => <>
    <div><Label>Nome</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
    <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
    <div><Label>{passwordLabel}</Label><Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={passwordLabel.includes("nova") ? "Opcional: deixe em branco para manter" : "Mínimo de 8 caracteres"} /></div>
    <div><Label>Percentual de comissão</Label><Input type="number" min="0" max="100" step="0.01" value={form.commissionRate} onChange={(event) => setForm({ ...form, commissionRate: event.target.value })} /></div>
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
      <div><p className="text-sm font-medium text-slate-900">Pagamento na retirada</p><p className="text-xs text-slate-500">Permite concluir vendas para pagamento no balcão.</p></div>
      <Switch checked={form.allowStorePickupPayment} onCheckedChange={(checked) => setForm({ ...form, allowStorePickupPayment: checked })} aria-label="Liberar pagamento na retirada" />
    </div>
  </>;

  if (adminUser && adminUser.role !== "superadmin") {
    return <AdminLayout><div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-bold text-amber-950">Acesso restrito</h1><p className="mt-2 text-sm text-amber-900">Apenas o Superadmin pode cadastrar, alterar senhas, editar e excluir vendedores.</p></div></AdminLayout>;
  }

  return <AdminLayout><div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-wide text-pink-600">Comercial</p><h1 className="text-2xl font-bold text-slate-900">Vendedores</h1><p className="mt-1 text-sm text-slate-500">Gestão exclusiva de contas comerciais, vendas e comissões.</p></div>
      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogTrigger asChild><Button className="bg-pink-600 hover:bg-pink-700"><Plus className="mr-2 h-4 w-4" />Novo vendedor</Button></DialogTrigger>
        <DialogContent><DialogHeader><DialogTitle>Cadastrar vendedor</DialogTitle><DialogDescription>Use uma conta exclusiva. Se o e-mail já existir, ela será convertida para o acesso comercial do vendedor.</DialogDescription></DialogHeader><div className="space-y-3">{fields("Senha inicial")}</div><Button className="mt-4 w-full bg-pink-600 hover:bg-pink-700" disabled={create.isPending} onClick={saveCreate}>{create.isPending ? "Salvando..." : "Criar vendedor"}</Button></DialogContent>
      </Dialog>
    </div>

    <div className="space-y-3 md:hidden">{isLoading ? <Card><CardContent className="p-6 text-center text-sm text-slate-500">Carregando vendedores...</CardContent></Card> : data?.length ? data.map((seller: any) => <Card key={seller.id}><CardContent className="space-y-4 p-4"><div><p className="font-semibold text-slate-900">{seller.name}</p><p className="mt-1 text-sm text-slate-500">{seller.email}</p></div><div className="grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-500">Comissão</p><p className="mt-1 font-semibold text-slate-900">{Number(seller.commissionRate).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</p></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-500">Retirada</p><Badge className="mt-1" variant={seller.allowStorePickupPayment ? "default" : "secondary"}>{seller.allowStorePickupPayment ? "Liberado" : "Bloqueado"}</Badge></div><div className="rounded-lg bg-slate-50 p-2"><p className="text-slate-500">Acesso</p><Badge className="mt-1" variant={seller.status === "active" ? "default" : "secondary"}>{seller.status === "active" ? "Ativo" : "Inativo"}</Badge></div></div><div className="grid grid-cols-3 gap-2"><Button variant="outline" size="sm" className={seller.allowStorePickupPayment ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"} disabled={update.isPending} onClick={() => togglePickupPayment(seller)}>{seller.allowStorePickupPayment ? "Bloquear" : "Liberar"}</Button><Button variant="outline" size="sm" onClick={() => openEdit(seller)}>Editar</Button><Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setDeleting(seller)}>Excluir</Button></div></CardContent></Card>) : <Card><CardContent className="p-8 text-center"><UsersRound className="mx-auto mb-2 h-6 w-6 text-slate-400" /><p className="text-sm text-slate-500">Nenhum vendedor cadastrado.</p></CardContent></Card>}</div>

    <Card className="hidden md:block"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-4">Vendedor</th><th className="p-4">E-mail</th><th className="p-4">Comissão</th><th className="p-4">Pagamento na retirada</th><th className="p-4">Situação</th><th className="p-4 text-right">Ações</th></tr></thead><tbody>
      {isLoading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Carregando vendedores...</td></tr> : data?.length ? data.map((seller: any) => <tr className="border-t border-slate-100" key={seller.id}><td className="p-4 font-medium">{seller.name}</td><td className="p-4 text-slate-600">{seller.email}</td><td className="p-4">{Number(seller.commissionRate).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%</td><td className="p-4"><Badge variant={seller.allowStorePickupPayment ? "default" : "secondary"}>{seller.allowStorePickupPayment ? "Liberado" : "Bloqueado"}</Badge></td><td className="p-4"><Badge variant={seller.status === "active" ? "default" : "secondary"}>{seller.status === "active" ? "Ativo" : "Inativo"}</Badge></td><td className="p-4 text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" className={seller.allowStorePickupPayment ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"} disabled={update.isPending} onClick={() => togglePickupPayment(seller)}>{seller.allowStorePickupPayment ? "Bloquear retirada" : "Liberar retirada"}</Button><Button variant="outline" size="sm" onClick={() => openEdit(seller)}><Pencil className="mr-2 h-3.5 w-3.5" />Editar</Button><Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setDeleting(seller)}><Trash2 className="mr-2 h-3.5 w-3.5" />Excluir</Button></div></td></tr>) : <tr><td colSpan={6} className="p-10 text-center"><UsersRound className="mx-auto mb-2 h-6 w-6 text-slate-400" /><p className="text-slate-500">Nenhum vendedor cadastrado.</p></td></tr>}
    </tbody></table></div></CardContent></Card>

    <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Editar vendedor</DialogTitle><DialogDescription>O percentual atualizado vale para novas comissões. Valores já registrados permanecem congelados.</DialogDescription></DialogHeader><div className="space-y-3">{fields("Nova senha")}{editing && <div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Acesso à Central do Vendedor</p><p className="text-xs text-slate-500">Desativar encerra as sessões comerciais atuais.</p></div><Switch checked={editing.status === "active"} onCheckedChange={(checked) => setEditing({ ...editing, status: checked ? "active" : "inactive" })} /></div>}</div><Button className="mt-4 w-full bg-pink-600 hover:bg-pink-700" disabled={update.isPending} onClick={saveEdit}>{update.isPending ? "Salvando..." : "Salvar alterações"}</Button></DialogContent></Dialog>

    <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && !remove.isPending && setDeleting(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir vendedor permanentemente?</AlertDialogTitle><AlertDialogDescription>{deleting ? `O acesso de ${deleting.name} e seus dados sem histórico financeiro serão removidos. Caso existam comissões, a exclusão será bloqueada para preservar a auditoria.` : ""}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={remove.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" disabled={remove.isPending} onClick={(event) => { event.preventDefault(); void deleteSeller(); }}>{remove.isPending ? "Excluindo..." : "Excluir permanentemente"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div></AdminLayout>;
}
