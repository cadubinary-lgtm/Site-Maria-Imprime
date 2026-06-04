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
  onMethodSelected: (method: ShippingMethod, zipCode: string) => void;
  disabled?: boolean;
}

export function ShippingMethodSelector({
  cartItems,
  onMethodSelected,
  disabled = false,
}: ShippingMethodSelectorProps) {
  const [zipCode, setZipCode] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateShippingMutation = trpc.logistics.checkout.calculateShippingMethods.useQuery(
    { zipCode, cartItems },
    { enabled: false }
  );

  const handleCalculateShipping = async () => {
    if (!zipCode || zipCode.length < 8) {
      setError("CEP inválido. Digite 8 dígitos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await calculateShippingMutation.refetch();
      if (result.data?.shippingMethods) {
        setShippingMethods(result.data.shippingMethods);
        if (result.data.shippingMethods.length === 0) {
          setError("Nenhum método de entrega disponível para este CEP.");
        }
      }
    } catch (err: any) {
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
          {/* CEP Input */}
          <div className="space-y-2">
            <Label htmlFor="zipCode">CEP de Entrega</Label>
            <div className="flex gap-2">
              <Input
                id="zipCode"
                type="text"
                placeholder="00000-000"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                disabled={disabled || isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleCalculateShipping}
                disabled={disabled || isLoading || zipCode.length < 8}
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
