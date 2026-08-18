import AdminLayout from "@/components/AdminLayout";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Copy, Edit2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export function AdminPricingRules() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    basePrice: 0,
    calculationType: "fixed" as const,
    isActive: true,
  });

  // Queries
  const { data: rules = [], refetch: refetchRules } = trpc.pricingRules.list.useQuery({
    includeInactive: true,
  });
  const { data: categories = [] } = trpc.pricingRules.listCategories.useQuery();

  // Mutations
  const createMutation = trpc.pricingRules.create.useMutation({
    onSuccess: () => {
      refetchRules();
      resetForm();
      setIsCreating(false);
    },
  });

  const updateMutation = trpc.pricingRules.update.useMutation({
    onSuccess: () => {
      refetchRules();
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = trpc.pricingRules.delete.useMutation({
    onSuccess: () => {
      refetchRules();
      setRuleToDelete(null);
      toast.success("Regra de precificação excluída.", { id: "pricing-rule-delete" });
    },
    onError: (error) => toast.error(`Não foi possível excluir a regra: ${error.message}`, { id: "pricing-rule-delete" }),
  });

  const duplicateMutation = trpc.pricingRules.duplicate.useMutation({
    onSuccess: () => refetchRules(),
  });

  // Agrupar regras por categoria
  const groupedRules = useMemo(() => {
    const grouped: Record<string, typeof rules> = {};
    rules.forEach((rule: any) => {
      if (!grouped[rule.category]) {
        grouped[rule.category] = [];
      }
      grouped[rule.category].push(rule);
    });
    return grouped;
  }, [rules]);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      description: "",
      basePrice: 0,
      calculationType: "fixed",
      isActive: true,
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Nome e categoria são obrigatórios.", { id: "pricing-rule-save" });
      return;
    }

    if (editingId) {
      await updateMutation.mutateAsync({
        id: editingId,
        ...formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleEdit = (rule: any) => {
    setFormData(rule);
    setEditingId(rule.id);
    setIsCreating(true);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleConfirmDelete = () => {
    if (ruleToDelete) deleteMutation.mutate({ id: ruleToDelete.id });
  };

  return (
    <AdminLayout>
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Regras de Precificação</h1>
          <p className="text-gray-500 mt-1">
            Gerencie itens de precificação reutilizáveis para seus produtos
          </p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar Nova Regra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Regra" : "Criar Nova Regra"}
              </DialogTitle>
              <DialogDescription>
                Defina um item de precificação reutilizável
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  placeholder="Ex: Couchê 300g"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Categoria *</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou crie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Descrição opcional"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Valor (R$) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tipo de Cálculo</label>
                  <Select
                    value={formData.calculationType}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, calculationType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixo</SelectItem>
                      <SelectItem value="percentage">Percentual</SelectItem>
                      <SelectItem value="multiplier">Multiplicador</SelectItem>
                      <SelectItem value="per_sqm">Por m²</SelectItem>
                      <SelectItem value="per_quantity">Por Quantidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm">Ativo</label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Regras agrupadas por categoria */}
      <div className="space-y-4">
        {Object.entries(groupedRules).map(([category, categoryRules]: any) => (
          <Card key={category} className="overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                {expandedCategories.has(category) ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{category}</h3>
                  <p className="text-sm text-gray-500">
                    {categoryRules.length} item{categoryRules.length !== 1 ? "ns" : ""}
                  </p>
                </div>
              </div>
            </button>

            {expandedCategories.has(category) && (
              <div className="border-t divide-y">
                {categoryRules.map((rule: any) => (
                  <div
                    key={rule.id}
                    className="p-4 flex justify-between items-center hover:bg-gray-50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          onChange={async (e) => {
                            await updateMutation.mutateAsync({
                              id: rule.id,
                              isActive: e.target.checked,
                            });
                          }}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          {rule.description && (
                            <p className="text-sm text-gray-500">
                              {rule.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mr-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          R$ {parseFloat(rule.basePrice).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {rule.calculationType === "fixed" && "Fixo"}
                          {rule.calculationType === "percentage" && "Percentual"}
                          {rule.calculationType === "multiplier" && "Multiplicador"}
                          {rule.calculationType === "per_sqm" && "Por m²"}
                          {rule.calculationType === "per_quantity" && "Por Qtd"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const newName = prompt(
                            "Nome da cópia:",
                            `${rule.name} (Cópia)`
                          );
                          if (newName) {
                            await duplicateMutation.mutateAsync({
                              id: rule.id,
                              newName,
                            });
                          }
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => setRuleToDelete(rule)}
                        aria-label={`Excluir regra ${rule.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {rules.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-500 mb-4">Nenhuma regra de precificação criada</p>
          <Button onClick={() => setIsCreating(true)}>
            Criar Primeira Regra
          </Button>
        </Card>
      )}
      <AlertDialog open={Boolean(ruleToDelete)} onOpenChange={(open) => !open && setRuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a regra “{ruleToDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação remove a regra de precificação e não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending} aria-busy={deleteMutation.isPending} onClick={(event) => { event.preventDefault(); handleConfirmDelete(); }}>
              {deleteMutation.isPending ? "Excluindo..." : "Excluir regra"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </AdminLayout>
  );
}
