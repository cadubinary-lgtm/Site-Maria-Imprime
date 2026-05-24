import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, ShoppingCart } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Variation {
  type: string;
  name: string;
  priceModifier: number;
}

interface VariationSelectorProps {
  productName: string;
  basePrice: number;
  variations: Variation[];
  onAddToCart: (data: {
    productName: string;
    quantity: number;
    selectedVariations: Record<string, string>;
    totalPrice: number;
  }) => void;
  isLoading?: boolean;
}

export function VariationSelector({
  productName,
  basePrice,
  variations,
  onAddToCart,
  isLoading = false,
}: VariationSelectorProps) {
  // Agrupar variações por tipo
  const variationsByType = variations.reduce(
    (acc, variation) => {
      if (!acc[variation.type]) {
        acc[variation.type] = [];
      }
      acc[variation.type].push(variation);
      return acc;
    },
    {} as Record<string, Variation[]>
  );

  const [quantity, setQuantity] = useState("1");
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Calcular preço total
  const calculateTotalPrice = () => {
    let total = basePrice * parseInt(quantity || "1");
    
    // Adicionar modificadores de preço das variações selecionadas
    Object.values(selectedVariations).forEach((variationName) => {
      const variation = variations.find((v) => v.name === variationName);
      if (variation) {
        total += variation.priceModifier * parseInt(quantity || "1");
      }
    });

    return total;
  };

  const handleVariationChange = (type: string, value: string) => {
    setSelectedVariations({
      ...selectedVariations,
      [type]: value,
    });
    // Limpar erros ao selecionar
    setErrors(errors.filter((e) => !e.includes(type)));
  };

  const handleAddToCart = () => {
    const newErrors: string[] = [];

    // Validar quantidade
    const qty = parseInt(quantity);
    if (!quantity || qty < 1) {
      newErrors.push("Quantidade deve ser maior que 0");
    }

    // Validar variações obrigatórias
    Object.keys(variationsByType).forEach((type) => {
      if (!selectedVariations[type]) {
        newErrors.push(`Selecione uma opção de ${type}`);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const totalPrice = calculateTotalPrice();

    onAddToCart({
      productName,
      quantity: qty,
      selectedVariations,
      totalPrice,
    });
  };

  const totalPrice = calculateTotalPrice();
  const hasVariations = Object.keys(variationsByType).length > 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl">{productName}</CardTitle>
        <CardDescription className="text-orange-100">
          Selecione as opções desejadas e adicione ao carrinho
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Exibir erros */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Variações */}
        {hasVariations && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Opções de Produto</h3>
            {Object.entries(variationsByType).map(([type, typeVariations]) => (
              <div key={type}>
                <Label htmlFor={type} className="capitalize font-medium">
                  {type === "printingType"
                    ? "Tipo de Impressão"
                    : type === "material"
                    ? "Material"
                    : type === "finish"
                    ? "Acabamento"
                    : type === "format"
                    ? "Formato"
                    : type === "printColor"
                    ? "Cor de Impressão"
                    : type}
                </Label>
                <Select
                  value={selectedVariations[type] || ""}
                  onValueChange={(value) => handleVariationChange(type, value)}
                >
                  <SelectTrigger id={type} className="mt-2">
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeVariations.map((variation) => (
                      <SelectItem key={variation.name} value={variation.name}>
                        {variation.name}
                        {variation.priceModifier > 0 && (
                          <span className="ml-2 text-green-600">
                            +R$ {variation.priceModifier.toFixed(2)}
                          </span>
                        )}
                        {variation.priceModifier < 0 && (
                          <span className="ml-2 text-red-600">
                            R$ {variation.priceModifier.toFixed(2)}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {/* Quantidade */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="font-medium">
            Quantidade
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Resumo de Preço */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Preço Base:</span>
            <span>R$ {basePrice.toFixed(2)}</span>
          </div>

          {Object.entries(selectedVariations).length > 0 && (
            <div className="flex justify-between text-sm">
              <span>Modificadores:</span>
              <span>
                R${" "}
                {Object.values(selectedVariations)
                  .reduce((sum, varName) => {
                    const variation = variations.find((v) => v.name === varName);
                    return sum + (variation?.priceModifier || 0);
                  }, 0)
                  .toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span>Quantidade:</span>
            <span>{quantity}</span>
          </div>

          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span className="text-orange-600">R$ {totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Botão Adicionar ao Carrinho */}
        <Button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 text-lg"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {isLoading ? "Adicionando..." : "Adicionar ao Carrinho"}
        </Button>
      </CardContent>
    </Card>
  );
}
