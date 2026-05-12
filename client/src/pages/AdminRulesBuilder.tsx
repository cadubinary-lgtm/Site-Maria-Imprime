import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

interface RuleCondition {
  attributeId: number;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "in" | "notEquals";
  value: string;
  logicalOperator?: "AND" | "OR";
}

interface RuleAction {
  targetAttributeId: number;
  action: "show" | "hide" | "enable" | "disable" | "setPrice" | "addPrice" | "setTime" | "addTime";
  value?: string;
}

export default function AdminRulesBuilder() {
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { attributeId: 0, operator: "equals", value: "", logicalOperator: "AND" },
  ]);
  const [actions, setActions] = useState<RuleAction[]>([
    { targetAttributeId: 0, action: "show" },
  ]);

  // Carregar produtos
  const { data: products, isLoading: productsLoading } = trpc.products.getAll.useQuery();

  // Carregar atributos
  const { data: attributes, isLoading: attributesLoading } = trpc.attributes.listAttributes.useQuery();

  // Carregar regras do produto
  const { data: rules } = trpc.attributes.getProductRules.useQuery(
    selectedProductId || 0,
    { enabled: !!selectedProductId }
  );

  const resetForm = () => {
    setRuleName("");
    setRuleDescription("");
    setConditions([{ attributeId: 0, operator: "equals", value: "", logicalOperator: "AND" }]);
    setActions([{ targetAttributeId: 0, action: "show" }]);
  };

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { attributeId: 0, operator: "equals", value: "", logicalOperator: "AND" },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleAddAction = () => {
    setActions([...actions, { targetAttributeId: 0, action: "show" }]);
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSaveRule = () => {
    if (!selectedProductId || !ruleName || conditions.length === 0 || actions.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // TODO: Implementar mutation para salvar regra
    toast.success("Regra criada com sucesso!");
    resetForm();
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Construtor de Regras Dinâmicas</h1>
        <p className="text-gray-600 mt-2">
          Crie regras condicionais para controlar a visibilidade e comportamento dos atributos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1 - Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
            <CardDescription>Selecione um produto</CardDescription>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <div className="space-y-2">
                {products?.map((product: any) => (
                  <Button
                    key={product.id}
                    variant={selectedProductId === product.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedProductId(product.id)}
                  >
                    {product.name}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coluna 2 - Regras Existentes */}
        <Card>
          <CardHeader>
            <CardTitle>Regras Existentes</CardTitle>
            <CardDescription>
              {selectedProductId ? "Regras deste produto" : "Selecione um produto"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rules && rules.length > 0 ? (
              <div className="space-y-2">
                {rules.map((rule: any) => (
                  <div key={rule.id} className="border rounded p-2 text-sm">
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-xs text-gray-500">{rule.conditions?.length || 0} condições</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma regra cadastrada</p>
            )}
          </CardContent>
        </Card>

        {/* Coluna 3 - Criar Nova Regra */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Regra</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={!selectedProductId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Regra Condicional</DialogTitle>
                  <DialogDescription>
                    Configure as condições e ações para esta regra
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <div>
                      <Label>Nome da Regra *</Label>
                      <Input
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        placeholder="Ex: Lona - Mostrar ilhós"
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Input
                        value={ruleDescription}
                        onChange={(e) => setRuleDescription(e.target.value)}
                        placeholder="Descrição opcional"
                      />
                    </div>
                  </div>

                  {/* Condições */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Condições *</Label>
                      <Button size="sm" variant="outline" onClick={handleAddCondition}>
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    {conditions.map((condition, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={condition.attributeId.toString()}
                            onValueChange={(val) => {
                              const newConditions = [...conditions];
                              newConditions[index].attributeId = Number(val);
                              setConditions(newConditions);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Atributo" />
                            </SelectTrigger>
                            <SelectContent>
                              {attributes?.map((attr: any) => (
                                <SelectItem key={attr.id} value={attr.id.toString()}>
                                  {attr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={condition.operator}
                            onValueChange={(val) => {
                              const newConditions = [...conditions];
                              newConditions[index].operator = val as any;
                              setConditions(newConditions);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equals">Igual</SelectItem>
                              <SelectItem value="notEquals">Diferente</SelectItem>
                              <SelectItem value="contains">Contém</SelectItem>
                              <SelectItem value="greaterThan">Maior que</SelectItem>
                              <SelectItem value="lessThan">Menor que</SelectItem>
                              <SelectItem value="in">Em lista</SelectItem>
                            </SelectContent>
                          </Select>

                          <Input
                            value={condition.value}
                            onChange={(e) => {
                              const newConditions = [...conditions];
                              newConditions[index].value = e.target.value;
                              setConditions(newConditions);
                            }}
                            placeholder="Valor"
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          {index < conditions.length - 1 && (
                            <Select
                              value={condition.logicalOperator || "AND"}
                              onValueChange={(val) => {
                                const newConditions = [...conditions];
                                newConditions[index].logicalOperator = val as any;
                                setConditions(newConditions);
                              }}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AND">E</SelectItem>
                                <SelectItem value="OR">OU</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveCondition(index)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ações */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-semibold">Ações *</Label>
                      <Button size="sm" variant="outline" onClick={handleAddAction}>
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>

                    {actions.map((action, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={action.targetAttributeId.toString()}
                            onValueChange={(val) => {
                              const newActions = [...actions];
                              newActions[index].targetAttributeId = Number(val);
                              setActions(newActions);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Atributo Alvo" />
                            </SelectTrigger>
                            <SelectContent>
                              {attributes?.map((attr: any) => (
                                <SelectItem key={attr.id} value={attr.id.toString()}>
                                  {attr.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={action.action}
                            onValueChange={(val) => {
                              const newActions = [...actions];
                              newActions[index].action = val as any;
                              setActions(newActions);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="show">Mostrar</SelectItem>
                              <SelectItem value="hide">Ocultar</SelectItem>
                              <SelectItem value="enable">Habilitar</SelectItem>
                              <SelectItem value="disable">Desabilitar</SelectItem>
                              <SelectItem value="setPrice">Definir Preço</SelectItem>
                              <SelectItem value="addPrice">Adicionar Preço</SelectItem>
                              <SelectItem value="setTime">Definir Tempo</SelectItem>
                              <SelectItem value="addTime">Adicionar Tempo</SelectItem>
                            </SelectContent>
                          </Select>

                          {(action.action.includes("Price") || action.action.includes("Time")) && (
                            <Input
                              type="number"
                              value={action.value || ""}
                              onChange={(e) => {
                                const newActions = [...actions];
                                newActions[index].value = e.target.value;
                                setActions(newActions);
                              }}
                              placeholder="Valor"
                            />
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveAction(index)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveRule}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Regra
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
