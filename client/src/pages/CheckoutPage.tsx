import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, ShoppingBag, MapPin, ClipboardList, CheckCircle2, Loader2 } from "lucide-react";

type Step = "dados" | "endereco" | "revisao";

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "dados", label: "Dados", icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "endereco", label: "Endereço", icon: <MapPin className="w-4 h-4" /> },
  { id: "revisao", label: "Revisão", icon: <ClipboardList className="w-4 h-4" /> },
];

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("dados");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados do cliente
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Endereço
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Observações
  const [notes, setNotes] = useState("");

  const { data: cartItems, isLoading: cartLoading } = trpc.cart.getItems.useQuery();
  const createOrderMutation = trpc.checkout.createOrder.useMutation();

  const totalPrice = cartItems?.reduce(
    (sum: number, item: any) => sum + parseFloat(item.priceAtCart) * item.quantity,
    0
  ) ?? 0;

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const handleCepBlur = async () => {
    const cep = zipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setNeighborhood(data.bairro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } catch {
      // silencioso
    }
  };

  const validateDados = () => {
    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error("Informe seu nome completo");
      return false;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
      toast.error("Informe um telefone válido");
      return false;
    }
    return true;
  };

  const validateEndereco = () => {
    if (!zipCode.replace(/\D/g, "") || zipCode.replace(/\D/g, "").length < 8) {
      toast.error("Informe um CEP válido");
      return false;
    }
    if (!street.trim()) { toast.error("Informe a rua"); return false; }
    if (!number.trim()) { toast.error("Informe o número"); return false; }
    if (!neighborhood.trim()) { toast.error("Informe o bairro"); return false; }
    if (!city.trim()) { toast.error("Informe a cidade"); return false; }
    if (!state.trim() || state.length !== 2) { toast.error("Informe o estado (UF)"); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === "dados" && !validateDados()) return;
    if (step === "endereco" && !validateEndereco()) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };

  const handleBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev.id);
  };

  const handleFinalize = async () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("Seu carrinho está vazio");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createOrderMutation.mutateAsync({
        deliveryFullName: fullName,
        deliveryPhone: phone,
        deliveryStreet: street,
        deliveryNumber: number,
        deliveryComplement: complement || undefined,
        deliveryNeighborhood: neighborhood,
        deliveryCity: city,
        deliveryState: state,
        deliveryZipCode: zipCode.replace(/\D/g, ""),
        notes: notes || undefined,
      });
      toast.success(`Pedido ${result.orderNumber} criado com sucesso!`);
      setLocation(`/pedido/${result.orderId}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao finalizar pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="w-16 h-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">Seu carrinho está vazio</h2>
        <Button onClick={() => setLocation("/catalogo")} className="bg-orange-500 hover:bg-orange-600">
          Ver Produtos
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
          <p className="text-gray-500 mt-1">Complete as informações para confirmar seu pedido</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  s.id === step
                    ? "bg-orange-500 text-white"
                    : i < stepIndex
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i < stepIndex ? <CheckCircle2 className="w-4 h-4" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {STEPS[stepIndex].icon}
                  {step === "dados" && "Dados para Entrega"}
                  {step === "endereco" && "Endereço de Entrega"}
                  {step === "revisao" && "Revisão do Pedido"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* ETAPA 1: Dados */}
                {step === "dados" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input
                        id="fullName"
                        placeholder="Seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações (opcional)</Label>
                      <textarea
                        id="notes"
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows={3}
                        placeholder="Instruções especiais, referências de entrega..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* ETAPA 2: Endereço */}
                {step === "endereco" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input
                        id="zipCode"
                        placeholder="00000-000"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        onBlur={handleCepBlur}
                        maxLength={9}
                      />
                      <p className="text-xs text-gray-500">Digite o CEP para preencher o endereço automaticamente</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="street">Rua / Avenida *</Label>
                        <Input
                          id="street"
                          placeholder="Nome da rua"
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number">Número *</Label>
                        <Input
                          id="number"
                          placeholder="123"
                          value={number}
                          onChange={(e) => setNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        placeholder="Apto, sala, bloco..."
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input
                        id="neighborhood"
                        placeholder="Bairro"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="city">Cidade *</Label>
                        <Input
                          id="city"
                          placeholder="Cidade"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">UF *</Label>
                        <Input
                          id="state"
                          placeholder="SP"
                          value={state}
                          onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))}
                          maxLength={2}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ETAPA 3: Revisão */}
                {step === "revisao" && (
                  <div className="space-y-4">
                    {/* Dados do cliente */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Dados para Entrega</h3>
                      <p className="text-sm text-gray-600">{fullName}</p>
                      <p className="text-sm text-gray-600">{phone}</p>
                      {notes && <p className="text-sm text-gray-500 mt-1">Obs: {notes}</p>}
                    </div>

                    {/* Endereço */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Endereço de Entrega</h3>
                      <p className="text-sm text-gray-600">
                        {street}, {number}{complement ? `, ${complement}` : ""}
                      </p>
                      <p className="text-sm text-gray-600">{neighborhood}</p>
                      <p className="text-sm text-gray-600">{city} - {state}</p>
                      <p className="text-sm text-gray-600">CEP: {zipCode}</p>
                    </div>

                    {/* Itens */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Itens do Pedido</h3>
                      <div className="space-y-3">
                        {cartItems.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            {item.productImage && (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{item.productName}</p>
                              <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">
                              R$ {(parseFloat(item.priceAtCart) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Aviso de pagamento */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-800 font-medium">💡 Forma de Pagamento</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Após confirmar o pedido, entraremos em contato via WhatsApp para combinar a forma de pagamento.
                      </p>
                    </div>
                  </div>
                )}

                {/* Botões de navegação */}
                <div className="flex justify-between pt-4">
                  {stepIndex > 0 ? (
                    <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Voltar
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={() => setLocation("/carrinho")}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Carrinho
                    </Button>
                  )}

                  {step !== "revisao" ? (
                    <Button onClick={handleNext} className="bg-orange-500 hover:bg-orange-600">
                      Continuar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinalize}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processando...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" />Confirmar Pedido</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo lateral */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      R$ {(parseFloat(item.priceAtCart) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-orange-600">R$ {totalPrice.toFixed(2)}</span>
                </div>
                <Badge variant="outline" className="w-full justify-center text-xs text-gray-500">
                  Frete a combinar
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
