import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Eye, EyeOff, Loader2, UserPlus, ArrowLeft, MapPin, Search } from "lucide-react";

export default function CustomerRegister() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const errorAlertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!error) return;
    requestAnimationFrame(() => {
      errorAlertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [error]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpfCnpj: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    // Endereço
    addressZipCode: "",
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressNeighborhood: "",
    addressCity: "",
    addressState: "",
  });
  const cpfDigits = form.cpfCnpj.replace(/\D/g, "");
  const cpfCheck = trpc.customerAuth.checkCpfCnpj.useQuery(
    { cpfCnpj: cpfDigits || "0".repeat(11) },
    { enabled: cpfDigits.length === 11 || cpfDigits.length === 14, retry: false }
  );
  const cpfDuplicate = cpfCheck.data?.exists === true;
  const emailCheck = trpc.customerAuth.checkEmail.useQuery({ email: form.email || "invalido@local" }, { enabled: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email), retry: false });
  const emailDuplicate = emailCheck.data?.exists === true;

  const register = trpc.customerAuth.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
    },
    onError: (err) => {
      try {
        const issues = JSON.parse(err.message) as Array<{ message: string }>;
        if (Array.isArray(issues) && issues.length > 0) {
          setError(issues.map(i => i.message).join(" "));
          return;
        }
      } catch { /* não é JSON */ }
      setError(err.message);
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleCepBlur() {
    const cep = form.addressZipCode.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          addressStreet: data.logradouro || prev.addressStreet,
          addressNeighborhood: data.bairro || prev.addressNeighborhood,
          addressCity: data.localidade || prev.addressCity,
          addressState: data.uf || prev.addressState,
        }));
      }
    } catch { /* silencioso */ }
    finally { setCepLoading(false); }
  }

  function formatCep(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) { setError("A senha deve ter no mínimo 8 caracteres."); return; }
    if (!/[A-Z]/.test(form.password)) { setError("A senha deve conter ao menos uma letra maiúscula."); return; }
    if (!/[0-9]/.test(form.password)) { setError("A senha deve conter ao menos um número."); return; }
    if (form.password !== form.confirmPassword) { setError("As senhas não coincidem."); return; }
    if (!form.acceptTerms) { setError("Você deve aceitar os termos de uso para continuar."); return; }
    if (cpfDuplicate) { setError("Este CPF/CNPJ já está cadastrado."); return; }
    if (emailDuplicate) { setError("Este e-mail já está cadastrado. Faça login ou recupere sua senha."); return; }

    // Endereço é opcional no cadastro, mas se preenchido deve estar completo
    const hasPartialAddress = form.addressZipCode || form.addressStreet || form.addressNumber || form.addressCity;
    if (hasPartialAddress) {
      if (!form.addressZipCode || form.addressZipCode.replace(/\D/g, "").length < 8) { setError("CEP inválido. Informe um CEP completo."); return; }
      if (!form.addressStreet) { setError("Informe a rua/avenida do endereço."); return; }
      if (!form.addressNumber) { setError("Informe o número do endereço."); return; }
      if (!form.addressNeighborhood) { setError("Informe o bairro do endereço."); return; }
      if (!form.addressCity) { setError("Informe a cidade do endereço."); return; }
      if (!form.addressState || form.addressState.length !== 2) { setError("Informe o estado (UF) do endereço."); return; }
    }

    register.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone || undefined,
      cpfCnpj: form.cpfCnpj || undefined,
      password: form.password,
      addressZipCode: form.addressZipCode ? form.addressZipCode.replace(/\D/g, "") : undefined,
      addressStreet: form.addressStreet || undefined,
      addressNumber: form.addressNumber || undefined,
      addressComplement: form.addressComplement || undefined,
      addressNeighborhood: form.addressNeighborhood || undefined,
      addressCity: form.addressCity || undefined,
      addressState: form.addressState ? form.addressState.toUpperCase() : undefined,
    });
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Cadastro realizado!</h2>
            <p className="text-gray-600 mb-2">
              Enviamos um email de confirmação para <strong>{form.email}</strong>.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Verifique sua caixa de entrada (e a pasta de spam) e clique no link para ativar sua conta.
            </p>
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
              <Link href="/login-cliente">Ir para o Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Logo / Voltar */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o site
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-500 mt-1">Cadastre-se para fazer pedidos e acompanhar suas impressões</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div ref={errorAlertRef}>
            <Alert variant="destructive">
            <AlertDescription>{error}{(error.includes("CPF/CNPJ já está cadastrado") || error.includes("e-mail já está cadastrado")) && <span className="mt-2 block text-xs">Já possui conta? <Link href="/login-cliente" className="font-semibold underline">Fazer Login</Link> ou <Link href={`/recuperar-senha?cpf=${encodeURIComponent(form.cpfCnpj)}`} className="font-semibold underline">Recuperar Senha</Link>.</span>}</AlertDescription>
            </Alert>
            </div>
          )}

          {/* ── Dados Pessoais ── */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-500" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Preencha seus dados para criar sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input id="firstName" name="firstName" value={form.firstName} onChange={handleChange} placeholder="João" required autoComplete="given-name" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input id="lastName" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Silva" required autoComplete="family-name" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">Email *</Label>
                  <div className="relative"><Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="joao@email.com" required autoComplete="email" className={emailDuplicate ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""} />{emailCheck.isLoading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" /> : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && !emailDuplicate && <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />}</div>
                  {emailDuplicate && <p className="text-xs font-medium text-red-600">Este e-mail já está cadastrado.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" autoComplete="tel" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
                  <div className="relative"><Input id="cpfCnpj" name="cpfCnpj" value={form.cpfCnpj} onChange={handleChange} placeholder="000.000.000-00" className={cpfDuplicate ? "border-red-500 bg-red-50 focus-visible:ring-red-500" : ""} />{cpfCheck.isLoading ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" /> : (cpfDigits.length === 11 || cpfDigits.length === 14) && !cpfDuplicate && <CheckCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />}</div>
                  {cpfDuplicate && <p className="text-xs font-medium text-red-600">Este CPF/CNPJ já está cadastrado.</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Mínimo 8 caracteres" required autoComplete="new-password" className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">Mínimo 8 caracteres, 1 maiúscula e 1 número</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder="Repita a senha" required autoComplete="new-password" className="pr-10" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Endereço de Entrega ── */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Endereço de Entrega
              </CardTitle>
              <CardDescription>
                Cadastre seu endereço agora e ele será preenchido automaticamente no checkout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* CEP */}
              <div className="space-y-1">
                <Label htmlFor="addressZipCode">CEP</Label>
                <div className="relative">
                  <Input
                    id="addressZipCode"
                    name="addressZipCode"
                    value={form.addressZipCode}
                    onChange={(e) => setForm(prev => ({ ...prev, addressZipCode: formatCep(e.target.value) }))}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    autoComplete="postal-code"
                    className="pr-10"
                  />
                  {cepLoading
                    ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin" />
                    : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  }
                </div>
                <p className="text-xs text-gray-400">Digite o CEP para preencher o endereço automaticamente</p>
              </div>

              {/* Rua + Número */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="addressStreet">Rua / Avenida</Label>
                  <Input id="addressStreet" name="addressStreet" value={form.addressStreet} onChange={handleChange} placeholder="Nome da rua" autoComplete="street-address" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addressNumber">Número</Label>
                  <Input id="addressNumber" name="addressNumber" value={form.addressNumber} onChange={handleChange} placeholder="123" />
                </div>
              </div>

              {/* Complemento */}
              <div className="space-y-1">
                <Label htmlFor="addressComplement">Complemento</Label>
                <Input id="addressComplement" name="addressComplement" value={form.addressComplement} onChange={handleChange} placeholder="Apto, sala, bloco..." autoComplete="address-line2" />
              </div>

              {/* Bairro */}
              <div className="space-y-1">
                <Label htmlFor="addressNeighborhood">Bairro</Label>
                <Input id="addressNeighborhood" name="addressNeighborhood" value={form.addressNeighborhood} onChange={handleChange} placeholder="Bairro" />
              </div>

              {/* Cidade + UF */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="addressCity">Cidade</Label>
                  <Input id="addressCity" name="addressCity" value={form.addressCity} onChange={handleChange} placeholder="Cidade" autoComplete="address-level2" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addressState">UF</Label>
                  <Input id="addressState" name="addressState" value={form.addressState} onChange={handleChange} placeholder="SP" maxLength={2} autoComplete="address-level1" className="uppercase" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Termos + Botão ── */}
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 accent-orange-500"
                />
                <label htmlFor="acceptTerms" className="text-sm text-gray-600">
                  Concordo com os{" "}
                  <Link href="/termos" className="text-orange-600 hover:underline">Termos de Uso</Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="text-orange-600 hover:underline">Política de Privacidade</Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11"
                disabled={register.isPending}
              >
                {register.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando conta...</>
                ) : (
                  "Criar Conta Grátis"
                )}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Já tem conta?{" "}
                <Link href="/login-cliente" className="text-orange-600 font-medium hover:underline">Fazer login</Link>
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
