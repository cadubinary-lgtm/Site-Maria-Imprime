import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, Truck, MapPin, Zap, Store } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CartItem {
  productId: number;
  quantity: number;
  shippingMethod?: string;
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
  preSelectedMethod?: string;
  onMethodSelected: (method: ShippingMethod, zipCode: string) => void;
  disabled?: boolean;
}

const PICKUP_METHOD: ShippingMethod = {
  id: "retirada",
  name: "Retirar na Loja",
  description: "Retire seu pedido diretamente em nossa loja. Gratuito!",
  price: 0,
  estimatedDays: 0,
  estimatedHours: 0,
  initialStatus: "awaiting_pickup",
};

export function ShippingMethodSelector({
  cartItems,
  preSelectedMethod,
  onMethodSelected,
  disabled = false,
}: ShippingMethodSelectorProps) {
  // Pré-carregar CEP do localStorage (salvo na página do produto)
  const savedCep = typeof window !== "undefined" ? localStorage.getItem("checkout_cep") ?? "" : "";
  const [zipCode, setZipCode] = useState(savedCep);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [deliveryMethods, setDeliveryMethods] = useState<ShippingMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  const hasCartItems = cartItems && cartItems.length > 0;
  const calculateMutation = trpc.logistics.shipping.calculate.useMutation();

  // Se há CEP salvo, calcular automaticamente ao montar
  useEffect(() => {
    if (savedCep && savedCep.length === 8 && hasCartItems) {
      handleCalculateShipping(savedCep);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Verificar se o item do carrinho já tem método pré-selecionado
  const preSelectedFromCart = cartItems?.[0]?.shippingMethod;
  useEffect(() => {
    const methodToUse = preSelectedFromCart || preSelectedMethod;
    if (methodToUse === "pickup" || methodToUse === "retirada") {
      setSelectedMethod("retirada");
      // Confirmar automaticamente como retirada
      setTimeout(() => {
        onMethodSelected(PICKUP_METHOD, "");
      }, 100);
    }
  }, [preSelectedFromCart, preSelectedMethod]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCalculateShipping = async (cepOverride?: string) => {
    const cepToUse = (cepOverride ?? zipCode).replace(/\D/g, "");
    if (!hasCartItems) {
      setError("Carrinho vazio. Adicione produtos antes de calcular o frete.");
      return;
    }
    if (!cepToUse || cepToUse.length < 8) {
      setError("CEP inválido. Digite 8 dígitos.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const quotes = await calculateMutation.mutateAsync({
        destinationCep: cepToUse,
        weight: 1,
        height: 5,
        width: 30,
        length: 40,
      });

      const rawQuotes = quotes as any;
      const quotesArray = Array.isArray(rawQuotes) ? rawQuotes : (rawQuotes.quotes ?? []);

      // Montar métodos de entrega (transportadoras) — sem retirada na loja (ela é fixa)
      const methods: ShippingMethod[] = quotesArray
        .filter((q: any) => q.fixedType !== "pickup" && q.id !== "retirada")
        .map((q: any) => {
          const displayName = (!q.company || q.company === q.name || q.name.includes(q.company))
            ? q.name
            : `${q.company} — ${q.name}`;
          return {
            id: String(q.id),
            name: displayName,
            description: q.deliveryDays === 0
              ? "Entrega no mesmo dia"
              : `Entrega em ${q.deliveryDays} dia${q.deliveryDays !== 1 ? "s" : ""} úteis`,
            price: q.price,
            estimatedDays: q.deliveryDays,
            estimatedHours: 0,
            initialStatus: "awaiting_shipment",
          };
        });

      setDeliveryMethods(methods);
      setHasCalculated(true);
      // Salvar CEP no localStorage
      localStorage.setItem("checkout_cep", cepToUse);
    } catch (err: any) {
      setError(err.message || "Erro ao calcular frete. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMethod = () => {
    if (!selectedMethod) {
      setError("Selecione um método de entrega.");
      return;
    }

    if (selectedMethod === "retirada") {
      onMethodSelected(PICKUP_METHOD, "");
      return;
    }

    const method = deliveryMethods.find((m) => m.id === selectedMethod);
    if (method) {
      onMethodSelected(method, zipCode.replace(/\D/g, ""));
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const getMethodIcon = (methodId: string) => {
    if (methodId === "retirada" || methodId === "pickup") return <Store className="w-5 h-5 text-orange-500" />;
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
          {!hasCartItems && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Seu carrinho está vazio. Adicione produtos para continuar.</AlertDescription>
            </Alert>
          )}

          {/* ─── Opção fixa: Retirada na Loja ─── */}
          <div
            onClick={() => {
              if (disabled) return;
              setSelectedMethod("retirada");
              // Confirmar automaticamente ao selecionar retirada
              onMethodSelected(PICKUP_METHOD, "");
            }}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedMethod === "retirada"
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 hover:border-orange-300 bg-white"
            }`}
          >
            <div className="mt-0.5">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "retirada" ? "border-orange-500" : "border-gray-400"
              }`}>
                {selectedMethod === "retirada" && (
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Store className="w-5 h-5 text-orange-500" />
                <span className="font-semibold text-gray-800">Retirar na Loja</span>
                <span className="ml-auto text-sm font-bold text-green-600">Grátis</span>
              </div>
              <p className="text-sm text-gray-500">Retire seu pedido diretamente em nossa loja. Você será avisado quando estiver pronto.</p>
            </div>
          </div>

          {/* ─── Separador ─── */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou calcule o frete</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* ─── CEP Input ─── */}
          <div className="space-y-2">
            <Label htmlFor="zipCodeShipping">CEP de Entrega</Label>
            <div className="flex gap-2">
              <Input
                id="zipCodeShipping"
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
                type="button"
                onClick={() => handleCalculateShipping()}
                disabled={disabled || isLoading || zipCode.replace(/\D/g, "").length < 8 || !hasCartItems}
                variant="default"
              >
                {isLoading ? "Calculando..." : "Calcular"}
              </Button>
            </div>
            {savedCep && !hasCalculated && (
              <p className="text-xs text-blue-600">CEP {savedCep.slice(0,5)}-{savedCep.slice(5)} carregado automaticamente</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ─── Opções de entrega calculadas ─── */}
          {hasCalculated && deliveryMethods.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Opções de entrega para {zipCode.slice(0,5)}-{zipCode.slice(5)}:</p>
              <RadioGroup
                value={selectedMethod ?? ""}
                onValueChange={(v) => {
                  if (v !== "retirada") setSelectedMethod(v);
                }}
              >
                {deliveryMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 bg-white"
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        {getMethodIcon(method.id)}
                        <span className="font-semibold">{method.name}</span>
                        <span className="ml-auto text-sm font-bold text-gray-800">{formatPrice(method.price)}</span>
                      </div>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {hasCalculated && deliveryMethods.length === 0 && (
            <p className="text-sm text-center text-gray-500 py-2">
              Nenhuma transportadora disponível para este CEP. Selecione "Retirar na Loja" ou tente outro CEP.
            </p>
          )}

          {/* ─── Botão Confirmar ─── */}
          <Button
            type="button"
            onClick={handleConfirmMethod}
            disabled={!selectedMethod || disabled}
            className="w-full"
            size="lg"
          >
            Confirmar Entrega
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
