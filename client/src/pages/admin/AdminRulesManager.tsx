import AdminLayout from "@/components/AdminLayout";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Copy, Trash2, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

type RuleCondition = {
  attributeId: number;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "in";
  value: string;
};

type RuleAction = {
  targetAttributeId: number;
  action: "show" | "hide" | "enable" | "disable" | "setPrice" | "addPrice";
  value?: string;
};

interface RuleFormData {
  name: string;
  description: string;
  isActive: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
}

const emptyRuleForm = (): RuleFormData => ({
  name: "",
  description: "",
  isActive: true,
  conditions: [],
  actions: [],
});

export default function AdminRulesManager() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [ruleToDelete, setRuleToDelete] = useState<any>(null);
  const [formData, setFormData] = useState<RuleFormData>(emptyRuleForm);
  const utils = trpc.useUtils();

  const { data: products, isLoading: productsLoading } = trpc.products.getAll.useQuery();
  const { data: rules, isLoading: rulesLoading } = trpc.attributes.getProductRulesForAdmin.useQuery(selectedProductId || 0, { enabled: !!selectedProductId });
  const { data: productAttributes, isLoading: productAttributesLoading } = trpc.attributes.getProductAttributes.useQuery(selectedProductId || 0, { enabled: !!selectedProductId });

  const invalidateRules = async () => {
    if (selectedProductId) await utils.attributes.getProductRulesForAdmin.invalidate(selectedProductId);
  };

  const createRuleMutation = trpc.attributes.createAttributeRule.useMutation({
    onSuccess: async () => {
      await invalidateRules();
      toast.success("Regra criada com sucesso.", { id: "attribute-rule-save" });
      setIsDialogOpen(false);
      setEditingRuleId(null);
      setFormData(emptyRuleForm());
    },
    onError: (error) => toast.error(`Não foi possível criar a regra: ${error.message}`, { id: "attribute-rule-save" }),
  });

  const updateRuleMutation = trpc.attributes.updateAttributeRule.useMutation({
    onSuccess: async () => {
      await invalidateRules();
      toast.success("Regra atualizada com sucesso.", { id: "attribute-rule-save" });
      setIsDialogOpen(false);
      setEditingRuleId(null);
      setFormData(emptyRuleForm());
    },
    onError: (error) => toast.error(`Não foi possível atualizar a regra: ${error.message}`, { id: "attribute-rule-save" }),
  });

  const deleteRuleMutation = trpc.attributes.deleteAttributeRule.useMutation({
    onSuccess: async () => {
      await invalidateRules();
      toast.success("Regra excluída com sucesso.", { id: "attribute-rule-delete" });
      setRuleToDelete(null);
    },
    onError: (error) => toast.error(`Não foi possível excluir a regra: ${error.message}`, { id: "attribute-rule-delete" }),
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const query = productSearch.trim().toLowerCase();
    return query ? products.filter((product: any) => product.name.toLowerCase().includes(query)) : products;
  }, [products, productSearch]);

  const selectedProduct = useMemo(
    () => products?.find((product: any) => product.id === selectedProductId),
    [products, selectedProductId]
  );
  const isSaving = createRuleMutation.isPending || updateRuleMutation.isPending;

  const resetRuleForm = () => {
    setEditingRuleId(null);
    setFormData(emptyRuleForm());
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    setExpandedRuleId(null);
    setIsDialogOpen(false);
    resetRuleForm();
  };

  const handleAddCondition = () => setFormData((previous) => ({
    ...previous,
    conditions: [...previous.conditions, { attributeId: 0, operator: "equals", value: "" }],
  }));

  const handleRemoveCondition = (index: number) => setFormData((previous) => ({
    ...previous,
    conditions: previous.conditions.filter((_, itemIndex) => itemIndex !== index),
  }));

  const handleAddAction = () => setFormData((previous) => ({
    ...previous,
    actions: [...previous.actions, { targetAttributeId: 0, action: "show", value: "" }],
  }));

  const handleRemoveAction = (index: number) => setFormData((previous) => ({
    ...previous,
    actions: previous.actions.filter((_, itemIndex) => itemIndex !== index),
  }));

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => setFormData((previous) => ({
    ...previous,
    conditions: previous.conditions.map((condition, itemIndex) => itemIndex === index ? { ...condition, ...updates } : condition),
  }));

  const updateAction = (index: number, updates: Partial<RuleAction>) => setFormData((previous) => ({
    ...previous,
    actions: previous.actions.map((action, itemIndex) => itemIndex === index ? { ...action, ...updates } : action),
  }));

  const openNewRule = () => {
    resetRuleForm();
    setIsDialogOpen(true);
  };

  const openRuleEditor = (rule: any) => {
    setEditingRuleId(rule.id);
    setFormData({
      name: rule.name ?? "",
      description: rule.description ?? "",
      isActive: rule.isActive,
      conditions: (rule.conditions ?? []).map((condition: RuleCondition) => ({ ...condition })),
      actions: (rule.actions ?? []).map((action: RuleAction) => ({ ...action })),
    });
    setIsDialogOpen(true);
  };

  const handleDuplicateRule = (rule: any) => {
    setEditingRuleId(null);
    setFormData({
      name: `${rule.name} (cópia)`,
      description: rule.description ?? "",
      isActive: true,
      conditions: (rule.conditions ?? []).map((condition: RuleCondition) => ({ ...condition })),
      actions: (rule.actions ?? []).map((action: RuleAction) => ({ ...action })),
    });
    setIsDialogOpen(true);
  };

  const handleSaveRule = () => {
    if (!selectedProductId || !formData.name.trim()) {
      toast.error("Informe o nome da regra.", { id: "attribute-rule-save" });
      return;
    }
    if (formData.conditions.length === 0 || formData.conditions.some((condition) => !condition.attributeId || !condition.value.trim())) {
      toast.error("Complete ao menos uma condição com atributo e valor.", { id: "attribute-rule-save" });
      return;
    }
    if (formData.actions.length === 0 || formData.actions.some((action) => !action.targetAttributeId || ((action.action === "setPrice" || action.action === "addPrice") && !action.value?.trim()))) {
      toast.error("Complete ao menos uma ação. Valores de preço são obrigatórios quando aplicáveis.", { id: "attribute-rule-save" });
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      isActive: formData.isActive,
      conditions: formData.conditions.map((condition) => ({ ...condition, value: condition.value.trim() })),
      actions: formData.actions.map((action) => ({ ...action, value: action.value?.trim() || undefined })),
    };

    if (editingRuleId) {
      updateRuleMutation.mutate({ id: editingRuleId, ...payload });
      return;
    }
    createRuleMutation.mutate({ productId: selectedProductId, ...payload });
  };

  return (
    <AdminLayout>
      <div className="container mx-auto space-y-6 px-4 py-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-950">Gerenciador de regras de atributos</h1>
          <p className="mt-2 text-gray-600">Crie condições que adaptam a disponibilidade e a precificação dos atributos do produto.</p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1" aria-labelledby="rules-products-title">
            <Card>
              <CardHeader>
                <CardTitle id="rules-products-title">Produtos</CardTitle>
                <CardDescription>Escolha o produto cujas regras serão mantidas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Label htmlFor="rules-product-search" className="sr-only">Buscar produto</Label>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <Input id="rules-product-search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Buscar produto..." className="pl-9 pr-10 focus-visible:ring-pink-500" />
                  {productSearch && <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-500 hover:text-pink-700" onClick={() => setProductSearch("")} aria-label="Limpar busca de produtos"><X className="h-4 w-4" aria-hidden="true" /></Button>}
                </div>
                {productsLoading ? <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-pink-600" aria-label="Carregando produtos" /></div> : (
                  <div aria-live="polite" aria-label={`${filteredProducts.length} produto${filteredProducts.length !== 1 ? "s" : ""} encontrado${filteredProducts.length !== 1 ? "s" : ""}`}>
                    {filteredProducts.length > 0 ? <ul className="max-h-[32rem] space-y-2 overflow-y-auto pr-1" aria-labelledby="rules-products-title">
                      {filteredProducts.map((product: any) => <li key={product.id}><Button type="button" variant="outline" className={`w-full justify-start border-gray-200 text-left hover:border-pink-300 hover:bg-pink-50 hover:text-pink-800 focus-visible:ring-pink-500 ${selectedProductId === product.id ? "border-pink-600 bg-pink-600 text-white hover:bg-pink-700 hover:text-white" : ""}`} onClick={() => handleProductSelect(product.id)} aria-pressed={selectedProductId === product.id}>{product.name}</Button></li>)}
                    </ul> : <p className="text-sm text-gray-500">Nenhum produto encontrado.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>

          <main className="space-y-6 lg:col-span-3" aria-live="polite">
            {!selectedProductId ? <Card><CardContent className="py-12 text-center text-gray-500">Selecione um produto para visualizar e criar suas regras.</CardContent></Card> : <>
              <Card className="border-pink-100 bg-pink-50/50">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
                  <div><p className="text-sm font-medium text-pink-700">Produto selecionado</p><p className="text-lg font-semibold text-gray-950">{selectedProduct?.name}</p></div>
                  <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetRuleForm(); }}>
                    <DialogTrigger asChild><Button type="button" className="bg-pink-600 hover:bg-pink-700" onClick={openNewRule}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Nova regra</Button></DialogTrigger>
                    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
                      <DialogHeader><DialogTitle>{editingRuleId ? "Editar regra" : "Criar nova regra"}</DialogTitle><DialogDescription>Defina as condições e os efeitos aplicados ao configurador deste produto.</DialogDescription></DialogHeader>
                      <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); handleSaveRule(); }}>
                        <div className="space-y-4">
                          <div><Label htmlFor="rule-name">Nome da regra <span aria-hidden="true">*</span></Label><Input id="rule-name" value={formData.name} onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))} placeholder="Ex.: Lona requer ilhós" className="focus-visible:ring-pink-500" /></div>
                          <div><Label htmlFor="rule-description">Descrição</Label><Textarea id="rule-description" value={formData.description} onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))} placeholder="Explique quando esta regra deve ser aplicada." className="focus-visible:ring-pink-500" /></div>
                          <div className="flex items-center gap-2"><Checkbox id="rule-active" checked={formData.isActive} onCheckedChange={(checked) => setFormData((previous) => ({ ...previous, isActive: checked === true }))} /><Label htmlFor="rule-active" className="cursor-pointer">Ativar esta regra assim que ela for salva</Label></div>
                        </div>

                        <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4"><legend className="px-1 text-base font-semibold">Condições <span aria-hidden="true">*</span></legend><p className="text-sm text-gray-500">Defina o que deve acontecer antes de aplicar a regra.</p>
                          {formData.conditions.map((condition, index) => <div key={`${index}-${condition.attributeId}`} className="grid gap-3 rounded-lg border border-gray-100 p-3 md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)_auto] md:items-end">
                            <div><Label htmlFor={`condition-attribute-${index}`}>Atributo da condição</Label><Select value={condition.attributeId ? String(condition.attributeId) : undefined} onValueChange={(value) => updateCondition(index, { attributeId: Number(value) })}><SelectTrigger id={`condition-attribute-${index}`} className="focus:ring-pink-500"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{productAttributes?.map((attribute: any) => <SelectItem key={attribute.attributeId} value={String(attribute.attributeId)}>{attribute.attribute?.name}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label htmlFor={`condition-operator-${index}`}>Operador</Label><Select value={condition.operator} onValueChange={(value) => updateCondition(index, { operator: value as RuleCondition["operator"] })}><SelectTrigger id={`condition-operator-${index}`} className="focus:ring-pink-500"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="equals">É igual</SelectItem><SelectItem value="contains">Contém</SelectItem><SelectItem value="greaterThan">Maior que</SelectItem><SelectItem value="lessThan">Menor que</SelectItem><SelectItem value="in">Está em</SelectItem></SelectContent></Select></div>
                            <div><Label htmlFor={`condition-value-${index}`}>Valor</Label><Input id={`condition-value-${index}`} value={condition.value} onChange={(event) => updateCondition(index, { value: event.target.value })} placeholder="Ex.: Lona" className="focus-visible:ring-pink-500" /></div>
                            <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleRemoveCondition(index)} aria-label={`Remover condição ${index + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                          </div>)}
                          <Button type="button" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={handleAddCondition}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Adicionar condição</Button>
                        </fieldset>

                        <fieldset className="space-y-4 rounded-xl border border-gray-200 p-4"><legend className="px-1 text-base font-semibold">Ações <span aria-hidden="true">*</span></legend><p className="text-sm text-gray-500">Defina o efeito que será aplicado quando as condições forem atendidas.</p>
                          {formData.actions.map((action, index) => <div key={`${index}-${action.targetAttributeId}`} className="grid gap-3 rounded-lg border border-gray-100 p-3 md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)_auto] md:items-end">
                            <div><Label htmlFor={`action-attribute-${index}`}>Atributo afetado</Label><Select value={action.targetAttributeId ? String(action.targetAttributeId) : undefined} onValueChange={(value) => updateAction(index, { targetAttributeId: Number(value) })}><SelectTrigger id={`action-attribute-${index}`} className="focus:ring-pink-500"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{productAttributes?.map((attribute: any) => <SelectItem key={attribute.attributeId} value={String(attribute.attributeId)}>{attribute.attribute?.name}</SelectItem>)}</SelectContent></Select></div>
                            <div><Label htmlFor={`action-type-${index}`}>Efeito</Label><Select value={action.action} onValueChange={(value) => updateAction(index, { action: value as RuleAction["action"] })}><SelectTrigger id={`action-type-${index}`} className="focus:ring-pink-500"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="show">Mostrar</SelectItem><SelectItem value="hide">Ocultar</SelectItem><SelectItem value="enable">Habilitar</SelectItem><SelectItem value="disable">Desabilitar</SelectItem><SelectItem value="setPrice">Definir preço</SelectItem><SelectItem value="addPrice">Adicionar preço</SelectItem></SelectContent></Select></div>
                            <div>{action.action === "setPrice" || action.action === "addPrice" ? <><Label htmlFor={`action-value-${index}`}>Valor em R$</Label><Input id={`action-value-${index}`} type="number" min="0" step="0.01" inputMode="decimal" value={action.value ?? ""} onChange={(event) => updateAction(index, { value: event.target.value })} placeholder="0,00" className="focus-visible:ring-pink-500" /></> : <p className="pb-2 text-sm text-gray-500">Sem valor adicional.</p>}</div>
                            <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleRemoveAction(index)} aria-label={`Remover ação ${index + 1}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button>
                          </div>)}
                          <Button type="button" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50" onClick={handleAddAction}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Adicionar ação</Button>
                        </fieldset>

                        {productAttributesLoading ? <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin text-pink-600" aria-hidden="true" />Carregando atributos vinculados ao produto...</p> : productAttributes?.length === 0 ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Vincule atributos a este produto antes de criar regras.</p> : null}
                        <div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button><Button type="submit" className="bg-pink-600 hover:bg-pink-700" disabled={isSaving || productAttributesLoading || !productAttributes?.length} aria-busy={isSaving}>{isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Salvando...</> : editingRuleId ? "Atualizar regra" : "Criar regra"}</Button></div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {rulesLoading ? <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-pink-600" aria-label="Carregando regras do produto" /></div> : rules && rules.length > 0 ? <section className="space-y-4" aria-labelledby="rules-list-title"><h2 id="rules-list-title" className="sr-only">Regras de {selectedProduct?.name}</h2>{rules.map((rule: any) => <Card key={rule.id} className={!rule.isActive ? "border-gray-200 bg-gray-50" : "border-pink-100"}>
                <CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><CardTitle className="flex flex-wrap items-center gap-2 text-lg"><span>{rule.name}</span><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rule.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-700"}`}>{rule.isActive ? "Ativa" : "Inativa"}</span></CardTitle>{rule.description && <CardDescription className="mt-1">{rule.description}</CardDescription>}</div><div className="flex flex-wrap gap-1"><Button type="button" variant="ghost" size="sm" onClick={() => setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)} aria-expanded={expandedRuleId === rule.id} aria-controls={`rule-details-${rule.id}`} aria-label={`${expandedRuleId === rule.id ? "Ocultar" : "Exibir"} detalhes da regra ${rule.name}`}>{expandedRuleId === rule.id ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}</Button><Button type="button" variant="ghost" size="sm" className="text-pink-700 hover:bg-pink-50 hover:text-pink-800" onClick={() => updateRuleMutation.mutate({ id: rule.id, isActive: !rule.isActive })} disabled={updateRuleMutation.isPending} aria-busy={updateRuleMutation.isPending}>{rule.isActive ? "Desativar" : "Ativar"}</Button><Button type="button" variant="ghost" size="icon" className="text-gray-600 hover:bg-pink-50 hover:text-pink-700" onClick={() => openRuleEditor(rule)} aria-label={`Editar regra ${rule.name}`}><Copy className="h-4 w-4 rotate-180" aria-hidden="true" /></Button><Button type="button" variant="ghost" size="icon" className="text-gray-600 hover:bg-pink-50 hover:text-pink-700" onClick={() => handleDuplicateRule(rule)} aria-label={`Duplicar regra ${rule.name}`}><Copy className="h-4 w-4" aria-hidden="true" /></Button><Button type="button" variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setRuleToDelete(rule)} aria-label={`Excluir regra ${rule.name}`}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button></div></div></CardHeader>
                {expandedRuleId === rule.id && <CardContent id={`rule-details-${rule.id}`} className="grid gap-4 border-t pt-4 md:grid-cols-2"><div><h3 className="mb-2 font-semibold">Quando</h3><ul className="space-y-2 text-sm">{rule.conditions?.map((condition: RuleCondition, index: number) => <li key={`${condition.attributeId}-${index}`} className="rounded-md bg-gray-50 px-3 py-2">Atributo #{condition.attributeId} <strong>{condition.operator}</strong> “{condition.value}”</li>)}</ul></div><div><h3 className="mb-2 font-semibold">Então</h3><ul className="space-y-2 text-sm">{rule.actions?.map((action: RuleAction, index: number) => <li key={`${action.targetAttributeId}-${index}`} className="rounded-md bg-pink-50 px-3 py-2"><strong>{action.action}</strong> no atributo #{action.targetAttributeId}{action.value ? ` — ${action.value}` : ""}</li>)}</ul></div></CardContent>}
              </Card>)}</section> : <Card><CardContent className="py-12 text-center text-gray-500">Nenhuma regra criada para este produto. Use “Nova regra” para começar.</CardContent></Card>}
            </>}
          </main>
        </div>
      </div>

      <AlertDialog open={Boolean(ruleToDelete)} onOpenChange={(open) => !open && setRuleToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir a regra “{ruleToDelete?.name}”?</AlertDialogTitle><AlertDialogDescription>As condições e ações ligadas a esta regra também serão removidas. Essa ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleteRuleMutation.isPending}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" disabled={deleteRuleMutation.isPending} aria-busy={deleteRuleMutation.isPending} onClick={(event) => { event.preventDefault(); if (ruleToDelete) deleteRuleMutation.mutate(ruleToDelete.id); }}>{deleteRuleMutation.isPending ? "Excluindo..." : "Excluir regra"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </AdminLayout>
  );
}
