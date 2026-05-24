import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Edit2, Copy, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface RuleFormData {
  name: string;
  description: string;
  productId: number;
  isActive: boolean;
  conditions: Array<{
    attributeId: number;
    operator: "equals" | "contains" | "greaterThan" | "lessThan" | "in";
    value: string;
  }>;
  actions: Array<{
    targetAttributeId: number;
    action: "show" | "hide" | "enable" | "disable" | "setPrice" | "addPrice";
    value?: string;
  }>;
}

export default function AdminRulesManager() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    description: "",
    productId: 0,
    isActive: true,
    conditions: [],
    actions: [],
  });

  // Carregar produtos
  const { data: products, isLoading: productsLoading } = trpc.products.getAll.useQuery();

  // Carregar regras do produto selecionado
  const { data: rules, isLoading: rulesLoading, refetch: refetchRules } = trpc.attributes.getProductRules.useQuery(
    selectedProductId || 0,
    { enabled: !!selectedProductId }
  );

  // Carregar atributos do produto
  const { data: productAttributes } = trpc.attributes.getProductAttributes.useQuery(
    selectedProductId || 0,
    { enabled: !!selectedProductId }
  );

  const handleAddCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          attributeId: 0,
          operator: "equals" as const,
          value: "",
        },
      ],
    }));
  };

  const handleRemoveCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const handleAddAction = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          targetAttributeId: 0,
          action: "show" as const,
          value: "",
        },
      ],
    }));
  };

  const handleRemoveAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const handleSaveRule = async () => {
    if (!formData.name || !selectedProductId) {
      toast.error("Nome da regra e produto são obrigatórios");
      return;
    }

    if (formData.conditions.length === 0) {
      toast.error("Adicione pelo menos uma condição");
      return;
    }

    if (formData.actions.length === 0) {
      toast.error("Adicione pelo menos uma ação");
      return;
    }

    try {
      // TODO: Implementar chamada tRPC para salvar regra
      toast.success("Regra salva com sucesso!");
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        productId: 0,
        isActive: true,
        conditions: [],
        actions: [],
      });
      setEditingRuleId(null);
      refetchRules();
    } catch (error) {
      toast.error("Erro ao salvar regra");
      console.error(error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm("Tem certeza que deseja deletar esta regra?")) return;

    try {
      // TODO: Implementar chamada tRPC para deletar regra
      toast.success("Regra deletada com sucesso!");
      refetchRules();
    } catch (error) {
      toast.error("Erro ao deletar regra");
      console.error(error);
    }
  };

  const handleDuplicateRule = async (rule: any) => {
    setFormData({
      name: `${rule.name} (Cópia)`,
      description: rule.description,
      productId: selectedProductId || 0,
      isActive: true,
      conditions: rule.conditions || [],
      actions: rule.actions || [],
    });
    setEditingRuleId(null);
    setIsDialogOpen(true);
  };

  const handleToggleRuleStatus = async (ruleId: number, currentStatus: boolean) => {
    try {
      // TODO: Implementar chamada tRPC para alternar status
      toast.success(`Regra ${currentStatus ? "desativada" : "ativada"} com sucesso!`);
      refetchRules();
    } catch (error) {
      toast.error("Erro ao alterar status da regra");
      console.error(error);
    }
  };

  if (productsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciador de Regras de Atributos</h1>
        <p className="text-gray-600">Crie e gerencie regras dinâmicas para compatibilidade de atributos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Coluna Esquerda - Seleção de Produto */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {products?.map((product) => (
                <Button
                  key={product.id}
                  variant={selectedProductId === product.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedProductId(product.id)}
                >
                  {product.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Regras e Formulário */}
        <div className="md:col-span-3 space-y-6">
          {selectedProductId && (
            <>
              {/* Botão para Criar Nova Regra */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Regra
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingRuleId ? "Editar Regra" : "Criar Nova Regra"}</DialogTitle>
                    <DialogDescription>
                      Configure as condições e ações para esta regra de compatibilidade
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Nome e Descrição */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rule-name">Nome da Regra *</Label>
                        <Input
                          id="rule-name"
                          placeholder="Ex: Lona requer ilhós"
                          value={formData.name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="rule-description">Descrição</Label>
                        <Textarea
                          id="rule-description"
                          placeholder="Descrição da regra..."
                          value={formData.description}
                          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rule-active"
                          checked={formData.isActive}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({ ...prev, isActive: checked as boolean }))
                          }
                        />
                        <Label htmlFor="rule-active" className="cursor-pointer">
                          Regra ativa
                        </Label>
                      </div>
                    </div>

                    {/* Condições */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Condições *</Label>
                        <Button variant="outline" size="sm" onClick={handleAddCondition}>
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      {formData.conditions.map((condition, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <Select
                            value={condition.attributeId.toString()}
                            onValueChange={(value) => {
                              const newConditions = [...formData.conditions];
                              newConditions[index].attributeId = Number(value);
                              setFormData((prev) => ({ ...prev, conditions: newConditions }));
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione atributo" />
                            </SelectTrigger>
                            <SelectContent>
                              {productAttributes?.map((attr) => (
                                <SelectItem key={attr.attributeId} value={attr.attributeId.toString()}>
                                  {attr.attribute?.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={condition.operator}
                            onValueChange={(value: any) => {
                              const newConditions = [...formData.conditions];
                              newConditions[index].operator = value;
                              setFormData((prev) => ({ ...prev, conditions: newConditions }));
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Igual</SelectItem>
                              <SelectItem value="contains">Contém</SelectItem>
                              <SelectItem value="greaterThan">Maior que</SelectItem>
                              <SelectItem value="lessThan">Menor que</SelectItem>
                              <SelectItem value="in">Em</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            placeholder="Valor"
                            value={condition.value}
                            onChange={(e) => {
                              const newConditions = [...formData.conditions];
                              newConditions[index].value = e.target.value;
                              setFormData((prev) => ({ ...prev, conditions: newConditions }));
                            }}
                            className="flex-1"
                          />

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveCondition(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Ações */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label className="text-base font-semibold">Ações *</Label>
                        <Button variant="outline" size="sm" onClick={handleAddAction}>
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      {formData.actions.map((action, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <Select
                            value={action.targetAttributeId.toString()}
                            onValueChange={(value) => {
                              const newActions = [...formData.actions];
                              newActions[index].targetAttributeId = Number(value);
                              setFormData((prev) => ({ ...prev, actions: newActions }));
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione atributo" />
                            </SelectTrigger>
                            <SelectContent>
                              {productAttributes?.map((attr) => (
                                <SelectItem key={attr.attributeId} value={attr.attributeId.toString()}>
                                  {attr.attribute?.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={action.action}
                            onValueChange={(value: any) => {
                              const newActions = [...formData.actions];
                              newActions[index].action = value;
                              setFormData((prev) => ({ ...prev, actions: newActions }));
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="show">Mostrar</SelectItem>
                              <SelectItem value="hide">Ocultar</SelectItem>
                              <SelectItem value="enable">Habilitar</SelectItem>
                              <SelectItem value="disable">Desabilitar</SelectItem>
                              <SelectItem value="setPrice">Definir Preço</SelectItem>
                              <SelectItem value="addPrice">Adicionar Preço</SelectItem>
                            </SelectContent>
                          </Select>

                          {(action.action === "setPrice" || action.action === "addPrice") && (
                            <Input
                              placeholder="Valor"
                              type="number"
                              value={action.value || ""}
                              onChange={(e) => {
                                const newActions = [...formData.actions];
                                newActions[index].value = e.target.value;
                                setFormData((prev) => ({ ...prev, actions: newActions }));
                              }}
                              className="w-24"
                            />
                          )}

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveAction(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveRule}>
                        {editingRuleId ? "Atualizar" : "Criar"} Regra
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Lista de Regras */}
              {rulesLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : rules && rules.length > 0 ? (
                <div className="space-y-4">
                  {rules.map((rule: any) => (
                    <Card key={rule.id} className={!rule.isActive ? "opacity-50" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              {rule.name}
                              {!rule.isActive && <span className="text-xs bg-gray-200 px-2 py-1 rounded">Inativa</span>}
                            </CardTitle>
                            <CardDescription>{rule.description}</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)}
                            >
                              {expandedRuleId === rule.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleRuleStatus(rule.id, rule.isActive)}
                            >
                              {rule.isActive ? "Desativar" : "Ativar"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDuplicateRule(rule)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedRuleId === rule.id && (
                        <CardContent className="pt-0 space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Condições:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {rule.conditions?.map((cond: any, idx: number) => (
                                <li key={idx}>
                                  {cond.attributeId} {cond.operator} {cond.value}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Ações:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {rule.actions?.map((action: any, idx: number) => (
                                <li key={idx}>
                                  {action.action} {action.targetAttributeId} {action.value && `(${action.value})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-gray-500">
                    Nenhuma regra criada para este produto. Clique em "Nova Regra" para começar.
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!selectedProductId && (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                Selecione um produto para gerenciar suas regras
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
