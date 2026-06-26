import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ShippingMethodSelector } from "@/components/checkout/ShippingMethodSelector";
import {
  ChevronRight, ChevronLeft, ShoppingBag, MapPin,
  ClipboardList, CheckCircle2, Loader2, Truck, CreditCard,
  QrCode, Copy, Check, Store,
} from "lucide-react";

type Step = "dados" | "endereco" | "entrega" | "pagamento" | "revisao";
type PaymentMethod = "pix" | "cartao" | "retirada_loja";

interface FreteOption {
  id: string;
  name: string;
  description: string;
  price: number;
  days: string;
  highlight?: string;
  logo?: string;
}

const FRETE_OPTIONS: FreteOption[] = [
  { id: "retirada",        name: "Retirar na Loja",   description: "Retire seu pedido diretamente em nossa loja", price: 0,    days: "Conforme produção",    logo: "🏪" },
  { id: "motoboy",         name: "Moto Express",      description: "Entrega rápida via motoboy",                  price: 15,   days: "Entrega no mesmo dia*", highlight: "Entrega no mesmo dia*", logo: "🛵" },
  { id: "uber",            name: "Uber Entrega",      description: "Entrega via Uber Flash",                      price: 20,   days: "Entrega no mesmo dia*", highlight: "Entrega no mesmo dia*", logo: "🚗" },
  { id: "jadlog",          name: "Jadlog",            description: "Entrega via transportadora Jadlog",           price: 25.9, days: "3 a 5 dias úteis",      logo: "📦" },
  { id: "correios_sedex",  name: "Correios SEDEX",    description: "Entrega via Correios SEDEX",                  price: 18.5, days: "2 a 4 dias úteis",      logo: "📮" },
  { id: "correios_pac",    name: "Correios PAC",      description: "Entrega via Correios PAC",                    price: 12.3, days: "5 a 8 dias úteis",      logo: "📮" },
  { id: "transportadora",  name: "Transportadora",    description: "Entrega via transportadora parceira",         price: 35,   days: "5 a 10 dias úteis",     logo: "🚛" },
];

const STEPS: { id: Step; label: string; icon: React.ReactNode }[] = [
  { id: "dados",     label: "Dados",     icon: <ShoppingBag className="w-4 h-4" /> },
  { id: "entrega",   label: "Entrega",   icon: <Truck className="w-4 h-4" /> },
  { id: "endereco",  label: "Endereço",  icon: <MapPin className="w-4 h-4" /> },
  { id: "pagamento", label: "Pagamento", icon: <CreditCard className="w-4 h-4" /> },
  { id: "revisao",   label: "Revisão",   icon: <ClipboardList className="w-4 h-4" /> },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

// PIX simulado
const SIMULATED_PIX_KEY = "00020126580014BR.GOV.BCB.PIX0136grafica-ponto-digital@pix.com.br5204000053039865802BR5925Grafica Ponto Digital6009SAO PAULO62070503***6304ABCD";

export default function CheckoutPage() {
  const [location, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("dados");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // Dados do cliente
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Endereço
  const [zipCode, setZipCode] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUF, setStateUF] = useState("");

  // Frete
  const [selectedFrete, setSelectedFrete] = useState<FreteOption | null>(null);

  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  // Cartão
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardInstallments, setCardInstallments] = useState("1");

  // Convidado / conta opcional
  const [guestEmail, setGuestEmail] = useState("");
  const [createAccountPassword, setCreateAccountPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { data: cartItems, isLoading: cartLoading } = trpc.cart.getItems.useQuery();
  const { data: customerProfile } = trpc.customerAuth.getProfile.useQuery();
  const createOrderMutation = trpc.checkout.createOrder.useMutation();
  const trpcUtils = trpc.useUtils();

  const handleShippingMethodSelected = (method: any, zipCodeUsed: string) => {
    const isPickup = method.id === "retirada" || method.id === "pickup";
    const freteOption: FreteOption = {
      id: method.id,
      name: method.name,
      description: method.description,
      price: method.price,
      days: method.estimatedDays > 0
        ? `${method.estimatedDays} dia${method.estimatedDays > 1 ? 's' : ''} uteis`
        : method.estimatedHours > 0
        ? `ate ${method.estimatedHours}h`
        : "Conforme producao",
      logo: isPickup ? "🏪" : method.id === "moto_express" ? "🛵" : "📦",
    };
    setSelectedFrete(freteOption);
    if (!isPickup) setZipCode(zipCodeUsed);
    // Retirada na loja: pular endereço e ir direto para pagamento
    setStep(isPickup ? "pagamento" : "endereco");
  };

  // Pré-selecionar frete via query string (?freteId=motoboy)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const freteId = params.get("freteId");
    if (freteId) {
      const found = FRETE_OPTIONS.find((f) => f.id === freteId);
      if (found) setSelectedFrete(found);
    }
  }, []);

  // Pré-preencher com dados do perfil do cliente quando carregarem
  useEffect(() => {
    if (!customerProfile) return;
    const { firstName, lastName, phone: cPhone, addressZipCode, addressStreet, addressNumber, addressComplement, addressNeighborhood, addressCity, addressState } = customerProfile;
    if (firstName || lastName) setFullName(`${firstName ?? ""} ${lastName ?? ""}`.trim());
    if (cPhone) setPhone(cPhone);
    if (addressZipCode) {
      const z = addressZipCode.replace(/\D/g, "");
      setZipCode(z.length === 8 ? `${z.slice(0, 5)}-${z.slice(5)}` : z);
    }
    if (addressStreet) setStreet(addressStreet);
    if (addressNumber) setNumber(addressNumber);
    if (addressComplement) setComplement(addressComplement);
    if (addressNeighborhood) setNeighborhood(addressNeighborhood);
    if (addressCity) setCity(addressCity);
    if (addressState) setStateUF(addressState);
  }, [customerProfile]);

  const subtotal = cartItems?.reduce(
    (sum: number, item: any) => sum + parseFloat(item.priceAtCart) * item.quantity,
    0
  ) ?? 0;

  // Usa frete selecionado na etapa Entrega, ou frete já salvo no carrinho (selecionado na página do produto)
  const cartShippingPrice = cartItems?.[0]?.shippingPrice != null ? Number(cartItems[0].shippingPrice) : 0;
  const fretePrice = selectedFrete != null ? selectedFrete.price : cartShippingPrice;
  const totalPrice = subtotal + fretePrice;

  const isStorePickupSelected = selectedFrete?.id === "retirada" || selectedFrete?.id === "pickup";

  // Retirada na loja: ocultar Endereço da barra. Outras entregas: mostrar Endereço.
  // Antes de selecionar frete (selectedFrete null): mostrar todos os steps
  const visibleSteps = isStorePickupSelected
    ? STEPS.filter((s) => s.id !== "endereco")
    : STEPS;
  const stepIndex = STEPS.findIndex((s) => s.id === step);
  // Para a barra: quando retirada na loja e está no step endereco (não deveria acontecer), mapear para entrega
  const visibleStepForBar = (step === "endereco" && isStorePickupSelected) ? "entrega" : step;
  const visibleStepIndex = visibleSteps.findIndex((s) => s.id === visibleStepForBar);

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
        setStateUF(data.uf || "");
      }
    } catch { /* silencioso */ }
  };

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const validateDados = () => {
    if (!fullName.trim() || fullName.trim().length < 3) { toast.error("Informe seu nome completo"); return false; }
    if (!phone.trim() || phone.replace(/\D/g, "").length < 8) { toast.error("Informe um telefone válido"); return false; }
    if (!customerProfile) {
      if (!guestEmail.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(guestEmail.trim())) { toast.error("Informe um e-mail válido"); return false; }
      if (createAccountPassword && createAccountPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return false; }
    }
    return true;
  };

  const validateEndereco = () => {
    if (zipCode.replace(/\D/g, "").length < 8) { toast.error("Informe um CEP válido"); return false; }
    if (!street.trim()) { toast.error("Informe a rua"); return false; }
    if (!number.trim()) { toast.error("Informe o número"); return false; }
    if (!neighborhood.trim()) { toast.error("Informe o bairro"); return false; }
    if (!city.trim()) { toast.error("Informe a cidade"); return false; }
    if (!stateUF.trim() || stateUF.length !== 2) { toast.error("Informe o estado (UF)"); return false; }
    return true;
  };

  const validateEntrega = () => {
    if (!selectedFrete) { toast.error("Selecione uma opção de entrega"); return false; }
    return true;
  };

  const validatePagamento = () => {
    if (!paymentMethod) { toast.error("Selecione uma forma de pagamento"); return false; }
    if (paymentMethod === "retirada_loja" && !customerProfile?.allowStorePickup) {
      toast.error("Pagamento na retirada não está disponível para sua conta.");
      return false;
    }
    if (paymentMethod === "cartao") {
      if (cardNumber.replace(/\s/g, "").length < 16) { toast.error("Informe o número do cartão completo"); return false; }
      if (!cardName.trim()) { toast.error("Informe o nome no cartão"); return false; }
      if (cardExpiry.length < 5) { toast.error("Informe a validade do cartão"); return false; }
      if (cardCvv.length < 3) { toast.error("Informe o CVV do cartão"); return false; }
    }
    return true;
  };

  const handleNext = async () => {
    if (step === "dados") {
      if (!validateDados()) return;
      // Verificar se e-mail já está cadastrado antes de avançar
      if (!customerProfile && guestEmail.trim()) {
        try {
          const result = await trpcUtils.customerAuth.checkEmailExists.fetch({ email: guestEmail.trim() });
          if (result.exists) {
            toast.error("Este e-mail já possui uma conta cadastrada. Por favor, faça login para continuar.", { duration: 6000 });
            return;
          }
        } catch {
          // Ignorar erro de rede — validação também ocorre no backend
        }
      }
    }
    if (step === "entrega" && !validateEntrega()) return;
    // Após selecionar entrega: pular endereço se retirada na loja
    if (step === "entrega" && isStorePickupSelected) {
      setStep("pagamento");
      return;
    }
    if (step === "endereco" && !validateEndereco()) return;
    if (step === "pagamento" && !validatePagamento()) return;
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next.id);
  };
  const handleBack = () => {
    const prev = STEPS[stepIndex - 1];
    // Ao voltar do pagamento: pular endereço se retirada na loja
    if (prev?.id === "endereco" && isStorePickupSelected) {
      setStep("entrega");
      return;
    }
    if (prev) setStep(prev.id);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(SIMULATED_PIX_KEY).then(() => {
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 3000);
    });
  };

  const handleFinalize = async () => {
    if (!cartItems || cartItems.length === 0) { toast.error("Seu carrinho está vazio"); return; }
    setIsSubmitting(true);

    console.log("\n========== [CHECKOUT-FRONTEND] DIAGNÓSTICO ==========");
    console.log("[CHECKOUT-FRONTEND] cartItems:", JSON.stringify(cartItems, null, 2));
    console.log("[CHECKOUT-FRONTEND] subtotal:", subtotal);
    console.log("[CHECKOUT-FRONTEND] fretePrice:", fretePrice);
    console.log("[CHECKOUT-FRONTEND] totalPrice:", totalPrice);
    console.log("[CHECKOUT-FRONTEND] paymentMethod:", paymentMethod);
    console.log("[CHECKOUT-FRONTEND] selectedFrete:", selectedFrete);

    try {
      // Frete e pagamento têm campos próprios no banco — não misturar nas notes
      const payload = {
        deliveryFullName: fullName,
        deliveryPhone: phone,
        // Endereço só enviado quando não é retirada na loja
        ...(isStorePickupSelected ? {} : {
          deliveryStreet: street,
          deliveryNumber: number,
          deliveryComplement: complement || undefined,
          deliveryNeighborhood: neighborhood,
          deliveryCity: city,
          deliveryState: stateUF,
          deliveryZipCode: zipCode.replace(/\D/g, ""),
        }),
        freteId: selectedFrete?.id,
        notes: notes || undefined,
        guestEmail: guestEmail.trim() || undefined,
        guestName: fullName.trim() || undefined,
        accountPassword: createAccountPassword.trim() || undefined,
        paymentMethod: paymentMethod === "pix" ? "pix" : paymentMethod === "cartao" ? "cartao_credito" : paymentMethod === "retirada_loja" ? "pagar_na_retirada" : undefined,
      };
      console.log("[CHECKOUT-FRONTEND] payload enviado:", JSON.stringify(payload, null, 2));

      const result = await createOrderMutation.mutateAsync(payload);
      console.log("[CHECKOUT-FRONTEND] ✅ SUCESSO:", result);
      toast.success(`Pedido ${result.orderNumber} criado com sucesso!`);
      setLocation(`/confirmacao/${result.orderNumber}`);
    } catch (err: any) {
      console.error("[CHECKOUT-FRONTEND] ❌ ERRO:", err);
      const errMsg = err?.message ?? err?.data?.message ?? "Erro ao finalizar pedido";
      // Se e-mail já cadastrado, redirecionar para login
      if (errMsg.includes("já possui uma conta") || err?.data?.httpStatus === 409) {
        toast.error(errMsg, { duration: 6000 });
        // Voltar para step de dados para o cliente ver o e-mail
        setStep("dados");
      } else {
        toast.error(errMsg);
      }
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
          <p className="text-gray-500 mt-1">Complete as informações para confirmar seu pedido</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {visibleSteps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  s.id === step
                    ? "bg-orange-500 text-white shadow-md"
                    : i < visibleStepIndex
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i < visibleStepIndex ? <CheckCircle2 className="w-4 h-4" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < visibleSteps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
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
                  {step === "dados"     && "Dados para Entrega"}
                  {step === "endereco"  && "Endereço de Entrega"}
                  {step === "entrega"   && "Opções de Entrega"}
                  {step === "pagamento" && "Forma de Pagamento"}
                  {step === "revisao"   && "Revisão do Pedido"}
                </CardTitle>
                {step === "entrega" && (
                  <p className="text-sm text-gray-500">Escolha a melhor opção para você</p>
                )}
                {step === "pagamento" && (
                  <p className="text-sm text-gray-500">Selecione como deseja pagar</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">

                {/* ETAPA 1: Dados */}
                {step === "dados" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input id="fullName" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                      <Input id="phone" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>

                    {/* E-mail para convidados (se não estiver logado) */}
                    {!customerProfile && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="guestEmail">E-mail *</Label>
                          {/* Campo oculto para enganar o gerenciador de senhas do browser */}
                          <input type="text" name="fake-username" style={{display:'none'}} readOnly tabIndex={-1} />
                          <Input
                            id="guestEmail"
                            type="email"
                            name="guest-email"
                            autoComplete="email"
                            placeholder="seu@email.com"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                          />
                          <p className="text-xs text-gray-500">Você receberá a confirmação e o link de acompanhamento neste e-mail</p>
                        </div>

                        <div className="border border-dashed border-orange-200 rounded-lg p-4 bg-orange-50/50 space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Criar conta para acompanhar pedidos futuros</p>
                            <p className="text-xs text-gray-500 mt-0.5">Opcional — deixe em branco para finalizar como convidado</p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="createAccountPassword" className="text-sm">Criar senha (opcional)</Label>
                            <div className="relative">
                              <Input
                                id="createAccountPassword"
                                type={showPassword ? "text" : "password"}
                                name="new-account-password"
                                autoComplete="new-password"
                                placeholder="Mínimo 6 caracteres"
                                value={createAccountPassword}
                                onChange={(e) => setCreateAccountPassword(e.target.value)}
                                className="pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showPassword ? "🙈" : "👁"}
                              </button>
                            </div>
                            {createAccountPassword && createAccountPassword.length < 6 && (
                              <p className="text-xs text-red-500">Senha deve ter pelo menos 6 caracteres</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

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

                {/* ETAPA 2: Endereço — oculto para retirada na loja */}
                {step === "endereco" && isStorePickupSelected && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                    <span className="text-4xl">🏪</span>
                    <div>
                      <p className="font-semibold text-green-800">Retirada na Loja selecionada</p>
                      <p className="text-sm text-green-600 mt-1">Endereço de entrega não é necessário.</p>
                      <p className="text-sm text-green-600">Clique em Avançar para continuar.</p>
                    </div>
                  </div>
                )}
                {step === "endereco" && !isStorePickupSelected && (
                  <>
                    {customerProfile?.addressZipCode && (
                      <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                        <span>Endereço preenchido automaticamente com os dados do seu cadastro. Você pode editar se necessário.</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CEP *</Label>
                      <Input id="zipCode" placeholder="00000-000" value={zipCode} onChange={(e) => setZipCode(e.target.value)} onBlur={handleCepBlur} maxLength={9} />
                      <p className="text-xs text-gray-500">Digite o CEP para preencher o endereço automaticamente</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="street">Rua / Avenida *</Label>
                        <Input id="street" placeholder="Nome da rua" value={street} onChange={(e) => setStreet(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="number">Número *</Label>
                        <Input id="number" placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input id="complement" placeholder="Apto, sala, bloco..." value={complement} onChange={(e) => setComplement(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Bairro *</Label>
                      <Input id="neighborhood" placeholder="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="city">Cidade *</Label>
                        <Input id="city" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stateUF">UF *</Label>
                        <Input id="stateUF" placeholder="SP" value={stateUF} onChange={(e) => setStateUF(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} />
                      </div>
                    </div>
                  </>
                )}

                {/* ETAPA 3: Entrega / Frete */}
                {step === "entrega" && (
                  <ShippingMethodSelector
                    cartItems={cartItems?.map((item: any) => ({
                      productId: item.productId,
                      quantity: item.quantity,
                      shippingMethod: item.shippingMethod,
                    })) || []}
                    preSelectedMethod={cartItems?.[0]?.shippingMethod}
                    preSelectedLabel={cartItems?.[0]?.shippingLabel}
                    preSelectedPrice={cartItems?.[0]?.shippingPrice ? Number(cartItems[0].shippingPrice) : undefined}
                    preSelectedCep={cartItems?.[0]?.cepDestino}
                    onMethodSelected={handleShippingMethodSelected}
                    disabled={isSubmitting}
                  />
                )}

                {/* ETAPA 4: Pagamento */}
                {step === "pagamento" && (
                  <div className="space-y-4">
                    {/* Seleção do método — todas as opções sempre disponíveis */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* PIX */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("pix")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === "pix" ? "border-orange-500 bg-orange-50 shadow-md" : "border-gray-200 hover:border-orange-300 bg-white"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === "pix" ? "bg-orange-100" : "bg-gray-100"}`}>
                          <QrCode className={`w-6 h-6 ${paymentMethod === "pix" ? "text-orange-600" : "text-gray-500"}`} />
                        </div>
                        <div className="text-center">
                          <p className={`font-semibold text-sm ${paymentMethod === "pix" ? "text-orange-700" : "text-gray-800"}`}>PIX</p>
                          <p className="text-xs text-gray-500 mt-0.5">Aprovação imediata</p>
                        </div>
                        {paymentMethod === "pix" && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Selecionado</span>
                        )}
                      </button>

                      {/* Pagamento na Retirada — apenas para clientes com permissão */}
                      {customerProfile?.allowStorePickup && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("retirada_loja")}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "retirada_loja" ? "border-orange-500 bg-orange-50 shadow-md" : "border-gray-200 hover:border-orange-300 bg-white"
                          }`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === "retirada_loja" ? "bg-orange-100" : "bg-gray-100"}`}>
                            <Store className={`w-6 h-6 ${paymentMethod === "retirada_loja" ? "text-orange-600" : "text-gray-500"}`} />
                          </div>
                          <div className="text-center">
                            <p className={`font-semibold text-sm ${paymentMethod === "retirada_loja" ? "text-orange-700" : "text-gray-800"}`}>Pagar na Retirada</p>
                            <p className="text-xs text-gray-500 mt-0.5">Pague ao retirar</p>
                          </div>
                          {paymentMethod === "retirada_loja" && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Selecionado</span>
                          )}
                        </button>
                      )}

                      {/* Cartão */}
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cartao")}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          paymentMethod === "cartao" ? "border-orange-500 bg-orange-50 shadow-md" : "border-gray-200 hover:border-orange-300 bg-white"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === "cartao" ? "bg-orange-100" : "bg-gray-100"}`}>
                          <CreditCard className={`w-6 h-6 ${paymentMethod === "cartao" ? "text-orange-600" : "text-gray-500"}`} />
                        </div>
                        <div className="text-center">
                          <p className={`font-semibold text-sm ${paymentMethod === "cartao" ? "text-orange-700" : "text-gray-800"}`}>Cartão</p>
                          <p className="text-xs text-gray-500 mt-0.5">Crédito ou débito</p>
                        </div>
                        {paymentMethod === "cartao" && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Selecionado</span>
                        )}
                      </button>
                    </div>

                    {/* PIX: QR Code simulado */}
                    {paymentMethod === "pix" && (
                      <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-orange-500" />
                          <p className="font-semibold text-gray-800">Pagamento via PIX</p>
                        </div>

                        {/* QR Code simulado */}
                        <div className="flex justify-center">
                          <div className="w-40 h-40 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center">
                            <div className="grid grid-cols-7 gap-0.5 p-2">
                              {Array.from({ length: 49 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-4 h-4 rounded-sm ${
                                    [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,8,15,22,29,36,9,16,23,30,37,11,18,25,32,39,10,17,24,31,38,12,19,26,33,40].includes(i)
                                      ? "bg-gray-900" : "bg-white"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 text-center">Ou copie o código PIX abaixo:</p>
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-3">
                            <p className="text-xs text-gray-600 flex-1 truncate font-mono">{SIMULATED_PIX_KEY.slice(0, 40)}...</p>
                            <button
                              type="button"
                              onClick={handleCopyPix}
                              className="flex items-center gap-1 text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0"
                            >
                              {pixCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              {pixCopied ? "Copiado!" : "Copiar"}
                            </button>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700 font-medium">ℹ️ Ambiente de teste</p>
                          <p className="text-xs text-blue-600 mt-0.5">
                            Este é um QR Code simulado. A integração real com Mercado Pago será ativada em breve.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Cartão: formulário */}
                    {paymentMethod === "cartao" && (
                      <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-orange-500" />
                          <p className="font-semibold text-gray-800">Dados do Cartão</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardNumber">Número do Cartão *</Label>
                          <Input
                            id="cardNumber"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                            maxLength={19}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardName">Nome no Cartão *</Label>
                          <Input
                            id="cardName"
                            placeholder="Como está no cartão"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="cardExpiry">Validade *</Label>
                            <Input
                              id="cardExpiry"
                              placeholder="MM/AA"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                              maxLength={5}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="cardCvv">CVV *</Label>
                            <Input
                              id="cardCvv"
                              placeholder="123"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                              maxLength={4}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cardInstallments">Parcelas</Label>
                          <select
                            id="cardInstallments"
                            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                            value={cardInstallments}
                            onChange={(e) => setCardInstallments(e.target.value)}
                          >
                            <option value="1">1x de {formatCurrency(totalPrice)} (sem juros)</option>
                            <option value="2">2x de {formatCurrency(totalPrice / 2)} (sem juros)</option>
                            <option value="3">3x de {formatCurrency(totalPrice / 3)} (sem juros)</option>
                            <option value="6">6x de {formatCurrency(totalPrice / 6)} (sem juros)</option>
                            <option value="12">12x de {formatCurrency(totalPrice / 12)} (sem juros)</option>
                          </select>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700 font-medium">ℹ️ Ambiente de teste</p>
                          <p className="text-xs text-blue-600 mt-0.5">
                            Processamento simulado. A integração real com Mercado Pago será ativada em breve.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ETAPA 5: Revisão */}
                {step === "revisao" && (
                  <div className="space-y-4">
                    {/* Grid dados + endereço */}
                    <div className={`grid gap-4 ${isStorePickupSelected ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Dados do Cliente</h3>
                        <p className="text-sm text-gray-600">{fullName}</p>
                        <p className="text-sm text-gray-600">{phone}</p>
                        {notes && <p className="text-xs text-gray-500 mt-1 italic">Obs: {notes}</p>}
                      </div>
                      {!isStorePickupSelected && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-800 mb-2 text-sm">Endereço de Entrega</h3>
                          <p className="text-sm text-gray-600">{street}, {number}{complement ? `, ${complement}` : ""}</p>
                          <p className="text-sm text-gray-600">{neighborhood}</p>
                          <p className="text-sm text-gray-600">{city} - {stateUF}</p>
                          <p className="text-sm text-gray-600">CEP: {zipCode}</p>
                        </div>
                      )}
                      {isStorePickupSelected && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                          <span className="text-2xl">🏪</span>
                          <div>
                            <h3 className="font-semibold text-green-800 text-sm">Retirada na Loja</h3>
                            <p className="text-xs text-green-600 mt-0.5">Sem necessidade de endereço de entrega</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Entrega selecionada */}
                    {selectedFrete && (
                      <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">Entrega Selecionada</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{selectedFrete.name}</p>
                          <p className="text-xs text-gray-500">{selectedFrete.description}</p>
                          <p className="text-xs text-gray-500">{selectedFrete.days}</p>
                        </div>
                        <p className="font-bold text-orange-600 text-sm">
                          {selectedFrete.price === 0 ? "Grátis" : formatCurrency(selectedFrete.price)}
                        </p>
                      </div>
                    )}

                    {/* Forma de pagamento */}
                    {paymentMethod && (
                      <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                        {paymentMethod === "pix" ? (
                          <QrCode className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">Forma de Pagamento</h3>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {paymentMethod === "pix" && "PIX — Aprovação imediata"}
                            {paymentMethod === "cartao" && `Cartão — ${cardInstallments}x de ${formatCurrency(totalPrice / parseInt(cardInstallments))}`}
                            {paymentMethod === "retirada_loja" && "Pagamento na Retirada da Loja"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Itens */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-sm">Itens do Pedido</h3>
                      <div className="space-y-2">
                        {cartItems.map((item: any) => {
                          let variations: Array<{name: string; value: string}> = [];
                          try { if (item.variationSnapshot) variations = JSON.parse(item.variationSnapshot); } catch {}
                          let attrs: Record<string, string> = {};
                          try { if (item.selectedAttributes) attrs = JSON.parse(item.selectedAttributes); } catch {}
                          return (
                          <div key={item.id} className="p-3 border rounded-lg space-y-1.5">
                            <div className="flex items-start gap-3">
                              {item.productImage && (
                                <img src={item.productImage} alt={item.productName} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">{item.productName}</p>
                                <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                {formatCurrency(parseFloat(item.priceAtCart) * item.quantity)}
                              </p>
                            </div>
                            {/* Variações — texto simples igual ao carrinho */}
                            {variations.length > 0 && (
                              <div className="space-y-0.5">
                                {variations.map((v: any, i: number) => (
                                  <p key={i} className="text-xs text-gray-600">{v.name}: {v.value}</p>
                                ))}
                              </div>
                            )}
                            {/* Atributos — texto simples igual ao carrinho */}
                            {Object.keys(attrs).length > 0 && (
                              <div className="space-y-0.5">
                                {Object.entries(attrs).map(([k, v]: [string, any]) => (
                                  <p key={k} className="text-xs text-gray-600">{k}: {v}</p>
                                ))}
                              </div>
                            )}
                            {/* Medidas */}
                            {item.customDimensions && (
                              <p className="text-xs text-gray-600">Medidas: {item.customDimensions}</p>
                            )}
                            {/* Arquivo */}
                            {item.artFileUrl && (
                              <p className="text-xs text-gray-600">Arte: {item.artFileUrl.split('/').pop()}</p>
                            )}
                            {/* Prazo */}
                            {item.prazoName && (
                              <p className="text-xs text-gray-600">Prazo: {item.prazoName}</p>
                            )}
                            {/* Previsão */}
                            {item.forecastLabel && (
                              <p className="text-xs text-gray-600">Previsão de entrega: {item.forecastLabel}</p>
                            )}
                            {/* Entrega */}
                            {item.shippingLabel && (
                              <p className="text-xs text-gray-600">Entrega: {item.shippingLabel}{Number(item.shippingPrice) > 0 ? ` — ${formatCurrency(Number(item.shippingPrice))}` : ' — Grátis'}</p>
                            )}
                          </div>
                        );
                        })}
                      </div>
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
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate flex-1 mr-2">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      {formatCurrency(parseFloat(item.priceAtCart) * item.quantity)}
                    </span>
                  </div>
                ))}

                <Separator />

                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {/* Frete — usa selectedFrete (etapa Entrega) ou frete já salvo no carrinho */}
                {(() => {
                  const cartShippingLabel = cartItems?.[0]?.shippingLabel ?? null;
                  const cartShippingPrice = cartItems?.[0]?.shippingPrice != null ? Number(cartItems[0].shippingPrice) : null;
                  const effectiveName = selectedFrete?.name ?? cartShippingLabel;
                  const effectivePrice = selectedFrete != null ? selectedFrete.price : cartShippingPrice;
                  return (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Frete {effectiveName ? `(${effectiveName})` : ""}
                      </span>
                      {effectivePrice != null ? (
                        <span className={effectivePrice === 0 ? "text-green-600 font-medium" : ""}>
                          {effectivePrice === 0 ? "Grátis" : formatCurrency(effectivePrice)}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStep("entrega")}
                          className="text-orange-500 text-xs underline hover:text-orange-600"
                        >
                          Selecionar frete
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Forma de pagamento */}
                {paymentMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pagamento</span>
                    <span className="text-gray-800 font-medium">
                      {paymentMethod === "pix" && "PIX"}
                      {paymentMethod === "cartao" && `Cartão ${cardInstallments}x`}
                      {paymentMethod === "retirada_loja" && "Retirada na Loja"}
                    </span>
                  </div>
                )}

                <Separator />

                {/* Total */}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-orange-600">{formatCurrency(totalPrice)}</span>
                </div>

                {/* Alterar frete */}
                {selectedFrete && step !== "entrega" && (
                  <button
                    type="button"
                    onClick={() => setStep("entrega")}
                    className="w-full text-xs text-center text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:border-orange-300 hover:text-orange-600 transition-colors"
                  >
                    Alterar frete
                  </button>
                )}

                {/* Alterar pagamento */}
                {paymentMethod && step !== "pagamento" && (
                  <button
                    type="button"
                    onClick={() => setStep("pagamento")}
                    className="w-full text-xs text-center text-gray-500 border border-gray-200 rounded-lg py-1.5 hover:border-orange-300 hover:text-orange-600 transition-colors"
                  >
                    Alterar pagamento
                  </button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
