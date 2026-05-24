import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus } from "lucide-react";

interface FormCardDynamicProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

interface Variation {
  id: string;
  type: string; // "printingType", "material", "finish", "format", "printColor"
  name: string;
  priceModifier: number;
}

interface PricingTier {
  id: string;
  quantityMin: number;
  quantityMax?: number;
  pricePerUnit: number;
}

export function FormCardDynamic({ onSubmit, isLoading = false }: FormCardDynamicProps) {
  // Dados base do produto
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [calculationType, setCalculationType] = useState("m2"); // "unidade", "m2", "metro_linear", "pacote"

  // Variações
  const [variations, setVariations] = useState<Variation[]>([]);
  const [newVariationType, setNewVariationType] = useState("");
  const [newVariationName, setNewVariationName] = useState("");
  const [newVariationPrice, setNewVariationPrice] = useState("");

  // Preços progressivos
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [newTierMinQty, setNewTierMinQty] = useState("");
  const [newTierMaxQty, setNewTierMaxQty] = useState("");
  const [newTierPrice, setNewTierPrice] = useState("");

  // Configurações da calculadora
  const [materialCost, setMaterialCost] = useState("");
  const [printingCost, setPrintingCost] = useState("");
  const [finishingCost, setFinishingCost] = useState("");
  const [profitMargin, setProfitMargin] = useState("30");
  const [minimumArea, setMinimumArea] = useState("1");
  const [productionDays, setProductionDays] = useState("5");
  const [shippingType, setShippingType] = useState("transportadora");

  // Funções para gerenciar variações
  const addVariation = () => {
    if (!newVariationType || !newVariationName) {
      alert("Preencha tipo e nome da variação");
      return;
    }

    const newVariation: Variation = {
      id: Date.now().toString(),
      type: newVariationType,
      name: newVariationName,
      priceModifier: parseFloat(newVariationPrice) || 0,
    };

    setVariations([...variations, newVariation]);
    setNewVariationType("");
    setNewVariationName("");
    setNewVariationPrice("");
  };

  const removeVariation = (id: string) => {
    setVariations(variations.filter((v) => v.id !== id));
  };

  // Funções para gerenciar preços progressivos
  const addPricingTier = () => {
    if (!newTierMinQty || !newTierPrice) {
      alert("Preencha quantidade mínima e preço");
      return;
    }

    const newTier: PricingTier = {
      id: Date.now().toString(),
      quantityMin: parseInt(newTierMinQty),
      quantityMax: newTierMaxQty ? parseInt(newTierMaxQty) : undefined,
      pricePerUnit: parseFloat(newTierPrice),
    };

    setPricingTiers([...pricingTiers, newTier]);
    setNewTierMinQty("");
    setNewTierMaxQty("");
    setNewTierPrice("");
  };

  const removePricingTier = (id: string) => {
    setPricingTiers(pricingTiers.filter((t) => t.id !== id));
  };

  // Função para submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName || !basePrice) {
      alert("Preencha nome do produto e preço base");
      return;
    }

    const formData = {
      name: productName,
      description,
      basePrice: parseFloat(basePrice),
      calculationType,
      variations,
      pricingTiers,
      calculatorConfig: {
        materialCost: parseFloat(materialCost) || 0,
        printingCost: parseFloat(printingCost) || 0,
        finishingCost: parseFloat(finishingCost) || 0,
        profitMarginPercent: parseFloat(profitMargin),
        minimumAreaSqm: parseFloat(minimumArea),
        productionDays: parseInt(productionDays),
        shippingType,
      },
    };

    onSubmit(formData);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
          <CardTitle className="text-2xl">📋 Form Card Dinâmico - Produtos Gráficos</CardTitle>
          <CardDescription className="text-orange-100">
            Configure um produto gráfico com variações, preços progressivos e cálculo automático
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="variations">Variações</TabsTrigger>
                <TabsTrigger value="pricing">Preços</TabsTrigger>
                <TabsTrigger value="calculator">Calculadora</TabsTrigger>
              </TabsList>

              {/* TAB 1: DADOS BÁSICOS */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="productName">Nome do Produto *</Label>
                    <Input
                      id="productName"
                      placeholder="Ex: Adesivo Vinil Brilho"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="calculationType">Tipo de Cálculo *</Label>
                    <Select value={calculationType} onValueChange={setCalculationType}>
                      <SelectTrigger id="calculationType" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unidade">Unidade</SelectItem>
                        <SelectItem value="m2">Metro Quadrado (m²)</SelectItem>
                        <SelectItem value="metro_linear">Metro Linear</SelectItem>
                        <SelectItem value="pacote">Pacote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o produto..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="basePrice">Preço Base (R$) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </TabsContent>

              {/* TAB 2: VARIAÇÕES */}
              <TabsContent value="variations" className="space-y-4 mt-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Adicionar Variação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <Label htmlFor="varType" className="text-sm">
                        Tipo
                      </Label>
                      <Select value={newVariationType} onValueChange={setNewVariationType}>
                        <SelectTrigger id="varType" className="mt-1 text-sm">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="printingType">Tipo de Impressão</SelectItem>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="finish">Acabamento</SelectItem>
                          <SelectItem value="format">Formato</SelectItem>
                          <SelectItem value="printColor">Cor de Impressão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="varName" className="text-sm">
                        Nome
                      </Label>
                      <Input
                        id="varName"
                        placeholder="Ex: UV"
                        value={newVariationName}
                        onChange={(e) => setNewVariationName(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="varPrice" className="text-sm">
                        Preço Adicional (R$)
                      </Label>
                      <Input
                        id="varPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newVariationPrice}
                        onChange={(e) => setNewVariationPrice(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addVariation}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Variação
                  </Button>
                </div>

                {variations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Variações Adicionadas:</h3>
                    {variations.map((variation) => (
                      <div
                        key={variation.id}
                        className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {variation.type} - {variation.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Adicional: R$ {variation.priceModifier.toFixed(2)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariation(variation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: PREÇOS PROGRESSIVOS */}
              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-green-900 mb-3">Adicionar Faixa de Preço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <Label htmlFor="tierMin" className="text-sm">
                        Qtd. Mínima
                      </Label>
                      <Input
                        id="tierMin"
                        type="number"
                        placeholder="100"
                        value={newTierMinQty}
                        onChange={(e) => setNewTierMinQty(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tierMax" className="text-sm">
                        Qtd. Máxima (opcional)
                      </Label>
                      <Input
                        id="tierMax"
                        type="number"
                        placeholder="500"
                        value={newTierMaxQty}
                        onChange={(e) => setNewTierMaxQty(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tierPrice" className="text-sm">
                        Preço Unitário (R$)
                      </Label>
                      <Input
                        id="tierPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newTierPrice}
                        onChange={(e) => setNewTierPrice(e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addPricingTier}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Faixa
                  </Button>
                </div>

                {pricingTiers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Faixas de Preço:</h3>
                    {pricingTiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {tier.quantityMin} - {tier.quantityMax || "∞"} unidades
                          </p>
                          <p className="text-xs text-gray-600">
                            R$ {tier.pricePerUnit.toFixed(2)} por unidade
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePricingTier(tier.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: CALCULADORA */}
              <TabsContent value="calculator" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="materialCost">Custo de Material (R$)</Label>
                    <Input
                      id="materialCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="printingCost">Custo de Impressão (R$)</Label>
                    <Input
                      id="printingCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={printingCost}
                      onChange={(e) => setPrintingCost(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="finishingCost">Custo de Acabamento (R$)</Label>
                    <Input
                      id="finishingCost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={finishingCost}
                      onChange={(e) => setFinishingCost(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="profitMargin">Margem de Lucro (%)</Label>
                    <Input
                      id="profitMargin"
                      type="number"
                      step="0.01"
                      placeholder="30"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimumArea">Área Mínima de Cobrança (m²)</Label>
                    <Input
                      id="minimumArea"
                      type="number"
                      step="0.01"
                      placeholder="1"
                      value={minimumArea}
                      onChange={(e) => setMinimumArea(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="productionDays">Prazo de Produção (dias)</Label>
                    <Input
                      id="productionDays"
                      type="number"
                      placeholder="5"
                      value={productionDays}
                      onChange={(e) => setProductionDays(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="shippingType">Tipo de Envio</Label>
                    <Select value={shippingType} onValueChange={setShippingType}>
                      <SelectTrigger id="shippingType" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retirada">Retirada na Loja</SelectItem>
                        <SelectItem value="entrega_propria">Entrega Própria</SelectItem>
                        <SelectItem value="transportadora">Transportadora</SelectItem>
                        <SelectItem value="correios">Correios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* BOTÃO DE SUBMISSÃO */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 text-lg"
            >
              {isLoading ? "Salvando..." : "💾 Salvar Produto"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
