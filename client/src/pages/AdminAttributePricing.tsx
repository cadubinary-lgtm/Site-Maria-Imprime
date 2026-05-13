import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Edit2, Trash2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminAttributePricing() {
  const [selectedAttribute, setSelectedAttribute] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Carregar todos os atributos
  const { data: attributes, isLoading: attributesLoading } = trpc.attributes.listAttributes.useQuery();

  // Carregar valores do atributo selecionado
  const { data: attributeValues, isLoading: valuesLoading } = trpc.attributes.listAttributeValues.useQuery(
    { attributeId: selectedAttribute || 0 },
    { enabled: !!selectedAttribute }
  );

  const handleEditValue = (value: any) => {
    setEditingValue({ ...value });
    setIsDialogOpen(true);
  };

  const handleSaveValue = async () => {
    if (!editingValue) return;

    try {
      // TODO: Implementar mutation para atualizar valor de atributo
      toast.success("Valor de atributo atualizado com sucesso!");
      setIsDialogOpen(false);
      setEditingValue(null);
    } catch (error) {
      toast.error("Erro ao atualizar valor de atributo");
    }
  };

  if (attributesLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Preços de Atributos</h1>
        <p className="text-gray-600 mt-2">Edite os valores e modificadores de preço de cada atributo</p>
      </div>

      {/* Seleção de Atributo */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Atributo</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAttribute?.toString() || ""} onValueChange={(val) => setSelectedAttribute(parseInt(val))}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um atributo..." />
            </SelectTrigger>
            <SelectContent>
              {attributes?.map((attr: any) => (
                <SelectItem key={attr.id} value={attr.id.toString()}>
                  {attr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabela de Valores */}
      {selectedAttribute && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Valores do Atributo</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Valor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingValue?.id ? "Editar Valor" : "Novo Valor"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome do Valor</Label>
                      <Input
                        value={editingValue?.value || ""}
                        onChange={(e) => setEditingValue({ ...editingValue, value: e.target.value })}
                        placeholder="Ex: Couchê 300g"
                      />
                    </div>

                    <div>
                      <Label>Tipo de Cálculo</Label>
                      <Select
                        value={editingValue?.calculationType || "fixed"}
                        onValueChange={(val) => setEditingValue({ ...editingValue, calculationType: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                          <SelectItem value="percentage">Percentual (%)</SelectItem>
                          <SelectItem value="multiplier">Multiplicador (x)</SelectItem>
                          <SelectItem value="per_sqm">Por m² (R$/m²)</SelectItem>
                          <SelectItem value="per_quantity">Por Quantidade (R$/un)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Modificador de Preço</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingValue?.priceModifier || 0}
                        onChange={(e) => setEditingValue({ ...editingValue, priceModifier: parseFloat(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label>Modificador de Prazo (horas)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editingValue?.timeModifier || 0}
                        onChange={(e) => setEditingValue({ ...editingValue, timeModifier: parseFloat(e.target.value) })}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label>Modificador de Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingValue?.weightModifier || 0}
                        onChange={(e) => setEditingValue({ ...editingValue, weightModifier: parseFloat(e.target.value) })}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveValue} className="flex-1">
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {valuesLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Valor</TableHead>
                      <TableHead>Tipo de Cálculo</TableHead>
                      <TableHead>Modificador de Preço</TableHead>
                      <TableHead>Modificador de Prazo</TableHead>
                      <TableHead>Modificador de Peso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributeValues?.map((value: any) => (
                      <TableRow key={value.id}>
                        <TableCell className="font-medium">{value.value}</TableCell>
                        <TableCell>{value.calculationType || "fixed"}</TableCell>
                        <TableCell>
                          {value.calculationType === "percentage" 
                            ? `${value.priceModifier ?? 0}%` 
                            : `R$ ${(value.priceModifier ?? 0).toFixed(2)}`}
                        </TableCell>
                        <TableCell>{value.timeModifier ?? 0}h</TableCell>
                        <TableCell>{value.weightModifier ?? 0}kg</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditValue(value)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações de Ajuda */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">ℹ️ Tipos de Cálculo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>Valor Fixo:</strong> Adiciona um valor fixo em reais ao preço</p>
          <p><strong>Percentual:</strong> Adiciona um percentual do preço base</p>
          <p><strong>Multiplicador:</strong> Multiplica o preço por um fator</p>
          <p><strong>Por m²:</strong> Calcula baseado na área do produto</p>
          <p><strong>Por Quantidade:</strong> Calcula baseado na quantidade solicitada</p>
        </CardContent>
      </Card>
    </div>
  );
}
