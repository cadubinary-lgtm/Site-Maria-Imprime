/**
 * ========================================
 * RENDERIZADOR UNIVERSAL DE PRODUTOS
 * ========================================
 * Renderiza QUALQUER produto dinamicamente
 * baseado em atributos vinculados no admin
 * 
 * Não há código manual por produto.
 * Tudo é dinâmico e reutilizável.
 * 
 * COM PRECIFICAÇÃO DINÂMICA INTEGRADA
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, ShoppingCart } from "lucide-react";
import DynamicAttributeRenderer from "./DynamicAttributeRenderer";
import { trpc } from "@/lib/trpc";

interface UniversalProductRendererProps {
  productId: number;
  onAddToCart?: (cartItem: any) => void;
}

export default function UniversalProductRenderer({
  productId,
  onAddToCart,
}: UniversalProductRendererProps) {
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<number[]>([]);
  const [selectedAttributesMap, setSelectedAttributesMap] = useState<Map<number, any>>(new Map());
  const [quantity, setQuantity] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Carregar produto
  const { data: product, isLoading: productLoading } = trpc.products.getById.useQuery({
    id: productId,
  });

  // Carregar atributos do produto
  const { data: productAttributes, isLoading: attributesLoading } =
    trpc.attributes.getProductAttributes.useQuery(
      productId,
      { enabled: !!product }
    );

  // Carregar valores de atributos
  const { data: attributeValues } = trpc.attributes.listAttributeValues.useQuery({
    attributeId: 0,
  });

  // Carregar regras do produto
  const { data: productRules } = trpc.attributes.getProductRules.useQuery(
    productId as any,
    { enabled: !!product }
  );

  // Calcular preço com precificação dinâmica
  const { data: pricingData } = trpc.pricing.calculatePrice.useQuery(
    {
      productId,
      basePrice: product?.price ? parseFloat(product.price.toString()) : 0,
      selectedAttributeIds,
      quantity,
    },
    { enabled: !!product && selectedAttributeIds.length > 0 }
  );

  // Processar atributos para renderização
  const attributesToRender = useMemo(() => {
    if (!productAttributes) return [];

    return productAttributes
      .map((pa: any) => ({
        ...pa,
        values: attributeValues?.filter((av: any) => av.attributeId === pa.attributeId) || [],
      }))
      .filter((attr: any) => attr.values.length > 0);
  }, [productAttributes, attributeValues]);

  // Calcular preço total (fallback se pricing não retornar)
  const totalPrice = useMemo(() => {
    if (pricingData?.success && pricingData.pricing) {
      return pricingData.pricing.finalPrice;
    }

    let price = product?.price ? parseFloat(product.price.toString()) : 0;
    selectedAttributesMap.forEach((attr) => {
      if (attr.priceModifier) {
        price += parseFloat(attr.priceModifier.toString());
      }
    });

    return price * quantity;
  }, [pricingData, product?.price, selectedAttributesMap, quantity]);

  // Calcular prazo
  const totalDeadline = useMemo(() => {
    if (pricingData?.success && pricingData.pricing) {
      return pricingData.pricing.deadlineModifier || 3;
    }

    let deadline = 3;
    selectedAttributesMap.forEach((attr) => {
      if (attr.timeModifier) {
        deadline += attr.timeModifier;
      }
    });

    return Math.max(1, deadline);
  }, [pricingData, selectedAttributesMap]);

  // Validar seleções obrigatórias
  const isValid = useMemo(() => {
    return attributesToRender.every((attr: any) => {
      if (attr.isRequired) {
        return selectedAttributeIds.includes(attr.attributeId);
      }
      return true;
    });
  }, [attributesToRender, selectedAttributeIds]);

  const handleAttributeSelect = (attributeId: number, value: any) => {
    // Adicionar attributeId à lista
    if (!selectedAttributeIds.includes(value.id)) {
      setSelectedAttributeIds([...selectedAttributeIds, value.id]);
    }

    // Atualizar mapa de atributos selecionados
    const newSelected = new Map(selectedAttributesMap);
    newSelected.set(attributeId, value);
    setSelectedAttributesMap(newSelected);
  };

  const handleRemoveAttribute = (attributeId: number) => {
    const newSelected = new Map(selectedAttributesMap);
    const removedAttr = newSelected.get(attributeId);
    newSelected.delete(attributeId);
    setSelectedAttributesMap(newSelected);

    if (removedAttr) {
      setSelectedAttributeIds(selectedAttributeIds.filter(id => id !== removedAttr.id));
    }
  };

  const handleAddToCart = async () => {
    if (!isValid) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsProcessing(true);

    try {
      const cartItem = {
        productId,
        productName: product?.name,
        quantity,
        basePrice: product?.price,
        finalPrice: totalPrice,
        attributes: Object.fromEntries(selectedAttributesMap),
        attributeIds: selectedAttributeIds,
        deadline: totalDeadline,
        uploadedFiles,
        pricing: pricingData?.pricing,
      };

      onAddToCart?.(cartItem);
      alert("Produto adicionado ao carrinho!");
    } catch (error) {
      alert("Erro ao adicionar ao carrinho");
    } finally {
      setIsProcessing(false);
    }
  };

  if (productLoading || attributesLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Produto não encontrado</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações do Produto */}
      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>{product.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Preço Base */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Preço Base:</span>
              <span className="text-2xl font-bold text-orange-600">
                R$ {product.price ? parseFloat(product.price.toString()).toFixed(2) : "0.00"}
              </span>
            </div>

            {/* Atributos Selecionados */}
            {selectedAttributesMap.size > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Atributos Selecionados:</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedAttributesMap.entries()).map(([attrId, value]) => (
                    <Badge key={attrId} variant="secondary" className="flex items-center gap-2">
                      {value.value}
                      {value.priceModifier > 0 && (
                        <span className="text-xs">+R$ {parseFloat(value.priceModifier.toString()).toFixed(2)}</span>
                      )}
                      <button
                        onClick={() => handleRemoveAttribute(attrId)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo de Preços */}
            {pricingData?.success && pricingData.pricing && (
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {pricingData.pricing.priceWithModifiers.toFixed(2)}</span>
                </div>
                {pricingData.pricing.volumeDiscount.discountPercentage > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto por Volume ({pricingData.pricing.volumeDiscount.discountPercentage}%):</span>
                    <span>-R$ {pricingData.pricing.volumeDiscount.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Impostos:</span>
                  <span>R$ {pricingData.pricing.taxes.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-orange-600">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Prazo de Entrega */}
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-900">
                📅 Prazo de Entrega: <strong>{totalDeadline} dias úteis</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atributos Dinâmicos */}
      {attributesToRender.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Opções do Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {attributesToRender.map((attr: any) => (
              <div key={attr.attributeId} className="space-y-2">
                <label className="font-semibold">
                  {attr.name}
                  {attr.isRequired && <span className="text-red-600 ml-1">*</span>}
                </label>
                <DynamicAttributeRenderer
                  attribute={attr}
                  selectedValues={selectedAttributeIds}
                  onSelect={(attributeId: number, valueIds: number[]) => {
                    const selectedValue = attr.values.find((v: any) => valueIds.includes(v.id));
                    if (selectedValue) {
                      handleAttributeSelect(attr.attributeId, selectedValue);
                    }
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quantidade */}
      <Card>
        <CardHeader>
          <CardTitle>Quantidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 border rounded hover:bg-gray-100"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-3 py-2 border rounded text-center"
              min="1"
            />
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-2 border rounded hover:bg-gray-100"
            >
              +
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Botão Adicionar ao Carrinho */}
      <Button
        onClick={handleAddToCart}
        disabled={!isValid || isProcessing}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg font-semibold"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5 mr-2" />
            Adicionar ao Carrinho - R$ {totalPrice.toFixed(2)}
          </>
        )}
      </Button>

      {/* Validação */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Por favor, preencha todos os campos obrigatórios</AlertDescription>
        </Alert>
      )}

      {isValid && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Produto pronto para adicionar ao carrinho</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
