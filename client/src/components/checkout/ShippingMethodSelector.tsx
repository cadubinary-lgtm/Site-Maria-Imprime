import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Truck, MapPin, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CartItem {
  productId: number;
  quantity: number;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  estimatedHours: number;
  initialStatus: string;
  carrierId?: number;
}

interface ShippingMethodSelectorProps {
  cartItems: CartItem[];
  preSelectedMethod?: string; // Método pré-selecionado do produto
  onMethodSelected: (method: ShippingMethod, zipCode: string) => void;
  disabled?: boolean;
}

export function ShippingMethodSelector({
  cartItems,
  preSelectedMethod,
  onMethodSelected,
  disabled = false,
}: ShippingMethodSelectorProps) {
  const [zipCode, setZipCode] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(preSelectedMethod || null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Validar se carrinho tem itens
  const hasCartItems = cartItems && cartItems.length > 0;

  const calculateShippingMutation = trpc.logistics.checkout.calculateShippingMethods.useQuery(
    { zipCode, cartItems: cartItems || [] },
    { enabled: false }
  );

  // Se método pré-selecionado é "retirada", confirmar automaticamente
  useEffect(() => {
    if (preSelectedMethod === "pickup" || preSelectedMethod === "retirada") {
      // Criar objeto de método retirada
      const pickupMethod: ShippingMethod = {
        id: "pickup",
        name: "Retirar na Loja",
        description: "Retire seu pedido diretamente em nossa loja",
        price: 0,
        estimatedDays: 0,
        estimatedHours: 0,
        initialStatus: "awaiting_pickup",
      };
      setSelectedMethod("pickup");
      setShippingMethods([pickupMethod]);
      // Confirmar automaticamente
      setTimeout(() => {
        onMethodSelected(pickupMethod, "");
      }, 100);
    }
  }, [preSelectedMethod]);

  const handleCalculateShipping = async () => {
    // Validar carrinho
    if (!hasCartItems) {
      setError("Carrinho vazio. Adicione produtos antes de calcular o frete.");
      return;
    }

    if (!zipCode || zipCode.length < 8) {
      setError("CEP inválido. Digite 8 dígitos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("[ShippingMethodSelector] Calculando frete para CEP:", zipCode);
      console.log("[ShippingMethodSelector] CartItems:", cartItems);
      
      const result = await calculateShippingMutation.refetch();
      
      console.log("[ShippingMethodSelector] Resultado completo:", result);
      
      // Verificar se há erro
      if (result.error) {
        console.error("[ShippingMethodSelector] Erro na query:", result.error);
        setError(result.error.message || "Erro ao calcular frete. Tente novamente.");
        return;
      }
      
      // Verificar se há dados
      if (result.data) {
        const shippingData = result.data;
        console.log("[ShippingMethodSelector] Dados de frete:", shippingData);
        
        if (shippingData.shippingMethods && shippingData.shippingMethods.length > 0) {
          console.log("[ShippingMethodSelector] Métodos encontrados:", shippingData.shippingMethods.length);
          setShippingMethods(shippingData.shippingMethods);
          setHasCalculated(true);
          // Pré-selecionar primeiro método se houver pré-seleção
          if (!selectedMethod && shippingData.shippingMethods.length > 0) {
            setSelectedMethod(shippingData.shippingMethods[0].id);
          }
        } else {
          console.log("[ShippingMethodSelector] Nenhum método disponível");
          setError("Nenhum método de entrega disponível para este CEP.");
        }
      } else {
        console.log("[ShippingMethodSelector] Nenhum dado retornado");
        setError("Erro ao calcular frete.");
      }
    } catch (err: any) {
      console.error("[ShippingMethodSelector] Erro na execução:", err);
      setError(err.message || "Erro ao calcular frete. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMethod = () => {
    if (!selectedMethod) {
      setError("Selecione um método de entrega.");
      return;
    }

    const method = shippingMethods.find((m) => m.id === selectedMethod);
    if (method) {
      onMethodSelected(method, zipCode);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const getMethodIcon = (methodId: string) => {
    if (methodId === "pickup") return <MapPin className="w-5 h-5" />;
    if (methodId === "moto_express") return <Zap className="w-5 h-5" />;
    return <Truck className="w-5 h-5" />;
  };

  // Se pré-selecionado é retirada, não mostrar nada (será confirmado automaticamente)
  if (preSelectedMethod === "pickup" || preSelectedMethod === "retirada") {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Escolha sua forma de entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validação de Carrinho */}
          {!hasCartItems && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Seu carrinho está vazio. Adicione produtos para continuar.</AlertDescription>
            </Alert>
          )}

          {/* CEP Input */}
          <div className="space-y-2">
            <Label htmlFor="zipCode">CEP de Entrega</Label>
            <div className="flex gap-2">
              <Input
                id="zipCode"
                type="text"
                placeholder="00000-000"
                value={zipCode.length > 5 ? `${zipCode.slice(0, 5)}-${zipCode.slice(5)}` : zipCode}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  setZipCode(cleaned);
                }}
                maxLength={9}
                disabled={disabled || isLoading || !hasCartItems}
                className="flex-1"
              />
              <Button
                onClick={handleCalculateShipping}
                disabled={disabled || isLoading || zipCode.length < 8 || !hasCartItems}
                variant="default"
              >
                {isLoading ? "Calculando..." : "Calcular"}
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Shipping Methods */}
          {shippingMethods.length > 0 && (
            <div className="space-y-3">
              <RadioGroup value={selectedMethod || ""} onValueChange={setSelectedMethod}>
                {shippingMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                    <Label
                      htmlFor={method.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getMethodIcon(method.id)}
                        <span className="font-semibold">{method.name}</span>
                      </div>
                      <p className="text-sm text-gray-600">{method.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-medium">
                          {formatPrice(method.price)}
                        </span>
                        {method.estimatedDays > 0 && (
                          <span className="text-xs text-gray-500">
                            {method.estimatedDays} dia{method.estimatedDays > 1 ? "s" : ""} úteis
                          </span>
                        )}
                        {method.estimatedHours > 0 && (
                          <span className="text-xs text-gray-500">
                            até {method.estimatedHours}h
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button
                onClick={handleSelectMethod}
                disabled={!selectedMethod || disabled}
                className="w-full"
                size="lg"
              >
                Confirmar Entrega
              </Button>
            </div>
          )}

          {/* Empty State */}
          {zipCode && !isLoading && shippingMethods.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum método de entrega disponível</p>
            </div>
          )}

          {/* Initial State */}
          {!zipCode && (
            <div className="text-center py-8 text-gray-500">
              <p>Digite seu CEP para ver as opções de entrega</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
