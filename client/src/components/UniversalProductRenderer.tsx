/**
 * ========================================
 * RENDERIZADOR UNIVERSAL DE PRODUTOS
 * ========================================
 * Renderiza QUALQUER produto dinamicamente
 * baseado em atributos vinculados no admin
 * 
 * Não há código manual por produto.
 * Tudo é dinâmico e reutilizável.
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const [selectedAttributes, setSelectedAttributes] = useState<Map<number, any>>(new Map());
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
    attributeId: 0, // Carregar todos
  });

  // Carregar regras do produto
  const { data: productRules } = trpc.attributes.getProductRules.useQuery(
    productId as any,
    { enabled: !!product }
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

  // Calcular preço total
  const totalPrice = useMemo(() => {
    let price = typeof product?.price === 'string' ? parseFloat(product.price) : (product?.price || 0);

    selectedAttributes.forEach((attr) => {
      if (attr.priceModifier) {
        price += attr.priceModifier;
      }
    });

    return price * quantity;
  }, [product?.price, selectedAttributes, quantity]);

  // Calcular prazo
  const totalDeadline = useMemo(() => {
    let deadline = 3; // Prazo padrão

    selectedAttributes.forEach((attr) => {
      if (attr.timeModifier) {
        deadline += attr.timeModifier;
      }
    });

    return Math.max(1, deadline);
  }, [selectedAttributes]);

  // Validar seleções obrigatórias
  const isValid = useMemo(() => {
    return attributesToRender.every((attr: any) => {
      if (attr.isRequired) {
        return selectedAttributes.has(attr.attributeId);
      }
      return true;
    });
  }, [attributesToRender, selectedAttributes]);

  const handleAttributeSelect = (attributeId: number, value: any) => {
    const newSelected = new Map(selectedAttributes);
    newSelected.set(attributeId, value);
    setSelectedAttributes(newSelected);
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
        attributes: Object.fromEntries(selectedAttributes),
        deadline: totalDeadline,
        uploadedFiles,
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
          <CardTitle className="text-2xl">{product.name}</CardTitle>
          <CardDescription>{product.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Preço Base</p>
              <p className="text-2xl font-bold text-orange-600">
                R$ {(typeof product.price === 'string' ? parseFloat(product.price) : product.price)?.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Prazo Padrão</p>
              <p className="text-2xl font-bold">3 dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Atributos Dinâmicos */}
      {attributesToRender.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Produto</CardTitle>
            <CardDescription>
              Selecione as opções desejadas. {attributesToRender.filter((a: any) => a.isRequired).length} campo(s) obrigatório(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {attributesToRender.map((attribute: any) => (
              <div key={attribute.attributeId}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-lg capitalize">{attribute.attribute?.name || 'Atributo'}</h3>
                  {attribute.isRequired && (
                    <Badge variant="destructive" className="text-xs">
                      Obrigatório
                    </Badge>
                  )}
                </div>

                <DynamicAttributeRenderer
                  attribute={{
                    ...attribute.attribute,
                    values: attribute.values,
                  } as any}
                  onSelect={(value) => handleAttributeSelect(attribute.attributeId, value)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Este produto não possui atributos configuráveis. Vincule atributos no painel admin.
          </AlertDescription>
        </Alert>
      )}

      {/* Quantidade */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quantidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              max="10000"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="border rounded-lg px-4 py-2 w-24 font-semibold"
            />
            <span className="text-sm text-gray-600">unidades</span>
          </div>
        </CardContent>
      </Card>

      {/* Resumo de Preço */}
      <Card className="border-2 border-orange-500">
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Orçamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Preço Unitário</span>
            <span>R$ {(totalPrice / quantity).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantidade</span>
            <span>{quantity.toLocaleString("pt-BR")} un</span>
          </div>
          <div className="flex justify-between">
            <span>Prazo de Entrega</span>
            <span>{totalDeadline} dias úteis</span>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-orange-600">R$ {totalPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Validação */}
      {!isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Por favor, preencha todos os campos obrigatórios antes de adicionar ao carrinho
          </AlertDescription>
        </Alert>
      )}

      {/* Botão Adicionar ao Carrinho */}
      <Button
        size="lg"
        className="w-full bg-orange-600 hover:bg-orange-700"
        onClick={handleAddToCart}
        disabled={isProcessing || !isValid}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Adicionar ao Carrinho
          </>
        )}
      </Button>
    </div>
  );
}
