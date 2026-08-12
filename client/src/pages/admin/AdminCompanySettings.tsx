import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { parseWhatsAppBusinessDays } from "@/hooks/useCompanySettings";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Building2, FileText, ImageIcon, Loader2, MapPin, Phone, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";

type CompanyForm = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string;
  commercialPhone: string;
  whatsappNumber: string;
  showWhatsappButton: boolean;
  whatsappDefaultMessage: string;
  useWhatsappBusinessHours: boolean;
  whatsappBusinessDays: number[];
  whatsappStartTime: string;
  whatsappEndTime: string;
  supportEmail: string;
  zipCode: string;
  street: string;
  addressNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  printLogoUrl: string;
  printLogoKey: string;
  nextOsNumber: number;
  osTerms: string;
};

const DEFAULT_FORM: CompanyForm = {
  legalName: "Carlos Eduardo Barreto Novaes Pinheiro - ME",
  tradeName: "Maria Imprime / Gráfica Ponto Digital",
  cnpj: "34.528.399/0001-08",
  stateRegistration: "",
  commercialPhone: "(22) 99945-9596",
  whatsappNumber: "5522999459596",
  showWhatsappButton: true,
  whatsappDefaultMessage: "Olá! Como podemos ajudar?",
  useWhatsappBusinessHours: false,
  whatsappBusinessDays: [1, 2, 3, 4, 5],
  whatsappStartTime: "09:00",
  whatsappEndTime: "17:00",
  supportEmail: "contatomariaimprime@gmail.com",
  zipCode: "28908-200",
  street: "Avenida Antonio Ferreira dos Santos",
  addressNumber: "651",
  neighborhood: "Braga",
  city: "Cabo Frio",
  state: "RJ",
  printLogoUrl: "/manus-storage/logo-maria-imprime_acc5585b.webp",
  printLogoKey: "logo-maria-imprime_acc5585b.webp",
  nextOsNumber: 1001,
  osTerms: "Confira todas as informações antes de iniciar a produção. Prazos começam a contar após aprovação da arte. Alterações solicitadas após o início da produção podem gerar custos adicionais. Em caso de dúvidas, entre em contato com nosso atendimento.",
};

const logoAccept = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export default function AdminCompanySettings() {
  const [form, setForm] = useState<CompanyForm>(DEFAULT_FORM);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const termsEditorRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.companySettings.getAdmin.useQuery();
  const saveSettings = trpc.companySettings.save.useMutation();

  useEffect(() => {
    if (!settings) return;
    const loaded: CompanyForm = {
      legalName: settings.legalName || "",
      tradeName: settings.tradeName || "",
      cnpj: settings.cnpj || "",
      stateRegistration: settings.stateRegistration || "",
      commercialPhone: settings.commercialPhone || "",
      whatsappNumber: settings.whatsappNumber || "",
      showWhatsappButton: settings.showWhatsappButton ?? true,
      whatsappDefaultMessage: settings.whatsappDefaultMessage || "",
      useWhatsappBusinessHours: settings.useWhatsappBusinessHours ?? false,
      whatsappBusinessDays: parseWhatsAppBusinessDays(settings.whatsappBusinessDays),
      whatsappStartTime: settings.whatsappStartTime || "09:00",
      whatsappEndTime: settings.whatsappEndTime || "17:00",
      supportEmail: settings.supportEmail || "",
      zipCode: settings.zipCode || "",
      street: settings.street || "",
      addressNumber: settings.addressNumber || "",
      neighborhood: settings.neighborhood || "",
      city: settings.city || "",
      state: settings.state || "",
      printLogoUrl: settings.printLogoUrl || "",
      printLogoKey: settings.printLogoKey || "",
      nextOsNumber: settings.nextOsNumber || 1001,
      osTerms: settings.osTerms || "",
    };
    setForm(loaded);
    if (termsEditorRef.current) termsEditorRef.current.innerHTML = loaded.osTerms;
  }, [settings]);

  const setField = <K extends keyof CompanyForm>(field: K, value: CompanyForm[K]) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const toggleBusinessDay = (day: number) => {
    setForm((previous) => {
      const hasDay = previous.whatsappBusinessDays.includes(day);
      const nextDays = hasDay
        ? previous.whatsappBusinessDays.filter((currentDay) => currentDay !== day)
        : [...previous.whatsappBusinessDays, day].sort();
      return { ...previous, whatsappBusinessDays: nextDays.length ? nextDays : previous.whatsappBusinessDays };
    });
  };

  const applyTermsFormat = (command: string, value?: string) => {
    termsEditorRef.current?.focus();
    document.execCommand(command, false, value);
    setField("osTerms", termsEditorRef.current?.innerHTML || "");
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WEBP");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("O logotipo deve ter no máximo 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      if (!response.ok) throw new Error("Erro ao enviar logotipo");
      const uploaded = await response.json();
      setForm((previous) => ({ ...previous, printLogoUrl: uploaded.url, printLogoKey: uploaded.key || "" }));
      toast.success("Logotipo enviado", {
        description: "Salve as configurações para aplicá-lo na impressão da OS.",
        position: "top-right",
        duration: 3500,
        id: "company-logo-upload",
      });
    } catch (error) {
      console.error("Erro ao enviar logotipo:", error);
      toast.error("Não foi possível enviar o logotipo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const osTerms = termsEditorRef.current?.innerHTML || form.osTerms;
    if (!form.legalName || !form.tradeName || !form.cnpj || !form.commercialPhone || !form.whatsappNumber || !form.supportEmail) {
      toast.error("Preencha todos os campos institucionais e de contato obrigatórios");
      return;
    }
    if (!form.zipCode || !form.street || !form.addressNumber || !form.neighborhood || !form.city || form.state.length !== 2) {
      toast.error("Preencha o endereço completo, incluindo a UF");
      return;
    }

    try {
      await saveSettings.mutateAsync({
        ...form,
        stateRegistration: form.stateRegistration || null,
        printLogoUrl: form.printLogoUrl || null,
        printLogoKey: form.printLogoKey || null,
        osTerms: osTerms || null,
        nextOsNumber: Number(form.nextOsNumber),
      });
      await Promise.all([
        utils.companySettings.getAdmin.invalidate(),
        utils.companySettings.getPublic.invalidate(),
      ]);
      toast.success("Dados da empresa salvos", {
        description: "As informações já estão prontas para alimentar o site e a impressão da OS.",
        position: "top-right",
        duration: 3500,
        id: "company-settings-save",
      });
    } catch (error) {
      console.error("Erro ao salvar dados da empresa:", error);
      toast.error("Não foi possível salvar os dados da empresa");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dados da Empresa</h1>
          <p className="text-sm text-gray-500 mt-1">
            Centralize as informações institucionais exibidas no site e na Ordem de Serviço.
          </p>
        </div>

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-pink-600" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="w-5 h-5 text-pink-600" /> Institucional e Fiscal</CardTitle>
                <CardDescription>Informações utilizadas no rodapé do site e nos documentos da empresa.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="legalName">Razão Social</Label>
                  <Input id="legalName" value={form.legalName} onChange={(event) => setField("legalName", event.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="tradeName">Nome Fantasia</Label>
                  <Input id="tradeName" value={form.tradeName} onChange={(event) => setField("tradeName", event.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={form.cnpj} onChange={(event) => setField("cnpj", event.target.value)} className="mt-1" placeholder="00.000.000/0000-00" />
                </div>
                <div>
                  <Label htmlFor="stateRegistration">Inscrição Estadual</Label>
                  <Input id="stateRegistration" value={form.stateRegistration} onChange={(event) => setField("stateRegistration", event.target.value)} className="mt-1" placeholder="Opcional" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Phone className="w-5 h-5 text-pink-600" /> Contato e Endereço</CardTitle>
                <CardDescription>Dados públicos para atendimento, WhatsApp e página de contato.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="commercialPhone">Telefone Comercial</Label>
                  <Input id="commercialPhone" value={form.commercialPhone} onChange={(event) => setField("commercialPhone", event.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="whatsappNumber">WhatsApp</Label>
                  <Input id="whatsappNumber" value={form.whatsappNumber} onChange={(event) => setField("whatsappNumber", event.target.value.replace(/\D/g, ""))} className="mt-1" inputMode="numeric" placeholder="5522999999999" />
                  <p className="text-xs text-gray-500 mt-1">Somente números, incluindo DDI e DDD.</p>
                </div>
                <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <Label htmlFor="showWhatsappButton" className="text-sm font-semibold text-gray-800">Exibir botão de WhatsApp no site</Label>
                    <p className="text-xs text-gray-500 mt-1">Controla os botões públicos de atendimento no rodapé, página inicial e produto.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${form.showWhatsappButton ? "text-emerald-700" : "text-gray-500"}`}>{form.showWhatsappButton ? "Ativo" : "Desativado"}</span>
                    <Switch id="showWhatsappButton" checked={form.showWhatsappButton} onCheckedChange={(checked) => setField("showWhatsappButton", checked)} />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="whatsappDefaultMessage">Mensagem padrão do WhatsApp</Label>
                  <Textarea id="whatsappDefaultMessage" value={form.whatsappDefaultMessage} onChange={(event) => setField("whatsappDefaultMessage", event.target.value)} className="mt-1 min-h-20" placeholder="Olá! Como podemos ajudar?" />
                  <p className="text-xs text-gray-500 mt-1">Esta mensagem será preenchida automaticamente ao cliente clicar em um botão de WhatsApp do site.</p>
                </div>
                <div className="md:col-span-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor="useWhatsappBusinessHours" className="text-sm font-semibold text-gray-800">Exibir somente no horário de atendimento</Label>
                      <p className="text-xs text-gray-500 mt-1">Fora do expediente, os botões públicos de WhatsApp ficam ocultos automaticamente.</p>
                    </div>
                    <Switch id="useWhatsappBusinessHours" checked={form.useWhatsappBusinessHours} onCheckedChange={(checked) => setField("useWhatsappBusinessHours", checked)} />
                  </div>
                  {form.useWhatsappBusinessHours && (
                    <div className="space-y-3 pt-1 border-t border-gray-200">
                      <div>
                        <Label className="text-xs text-gray-600">Dias de atendimento</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {[{ value: 0, label: "Dom" }, { value: 1, label: "Seg" }, { value: 2, label: "Ter" }, { value: 3, label: "Qua" }, { value: 4, label: "Qui" }, { value: 5, label: "Sex" }, { value: 6, label: "Sáb" }].map((day) => (
                            <Button key={day.value} type="button" size="sm" variant={form.whatsappBusinessDays.includes(day.value) ? "default" : "outline"} className={form.whatsappBusinessDays.includes(day.value) ? "bg-pink-600 hover:bg-pink-700" : ""} onClick={() => toggleBusinessDay(day.value)}>{day.label}</Button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                        <div><Label htmlFor="whatsappStartTime" className="text-xs text-gray-600">Início</Label><Input id="whatsappStartTime" type="time" value={form.whatsappStartTime} onChange={(event) => setField("whatsappStartTime", event.target.value)} className="mt-1" /></div>
                        <div><Label htmlFor="whatsappEndTime" className="text-xs text-gray-600">Fim</Label><Input id="whatsappEndTime" type="time" value={form.whatsappEndTime} onChange={(event) => setField("whatsappEndTime", event.target.value)} className="mt-1" /></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="supportEmail">E-mail de Atendimento</Label>
                  <Input id="supportEmail" type="email" value={form.supportEmail} onChange={(event) => setField("supportEmail", event.target.value)} className="mt-1" />
                </div>
                <div className="md:col-span-2 flex items-center gap-2 pt-1 text-sm font-semibold text-gray-800"><MapPin className="w-4 h-4 text-pink-600" /> Endereço</div>
                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input id="zipCode" value={form.zipCode} onChange={(event) => setField("zipCode", event.target.value)} className="mt-1" placeholder="00000-000" />
                </div>
                <div>
                  <Label htmlFor="street">Logradouro</Label>
                  <Input id="street" value={form.street} onChange={(event) => setField("street", event.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="addressNumber">Número</Label>
                  <Input id="addressNumber" value={form.addressNumber} onChange={(event) => setField("addressNumber", event.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input id="neighborhood" value={form.neighborhood} onChange={(event) => setField("neighborhood", event.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={form.city} onChange={(event) => setField("city", event.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="state">Estado / UF</Label>
                  <Input id="state" value={form.state} maxLength={2} onChange={(event) => setField("state", event.target.value.toUpperCase())} className="mt-1" placeholder="RJ" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><FileText className="w-5 h-5 text-pink-600" /> Configuração da Ordem de Serviço</CardTitle>
                <CardDescription>Defina a identidade visual e os termos exibidos nas próximas impressões de OS.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
                  <div>
                    <Label>Logotipo para impressão</Label>
                    <div className="mt-2 h-32 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden relative">
                      {form.printLogoUrl ? (
                        <img src={form.printLogoUrl} alt="Logotipo para impressão" className="max-w-full max-h-full object-contain p-3" />
                      ) : (
                        <div className="text-center text-gray-400 text-sm"><ImageIcon className="w-7 h-7 mx-auto mb-1" /> Sem logotipo</div>
                      )}
                      {uploadingLogo && <div className="absolute inset-0 bg-white/75 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-pink-600" /></div>}
                    </div>
                    <input ref={logoInputRef} type="file" accept={logoAccept} className="hidden" onChange={handleLogoUpload} />
                    <div className="flex gap-2 mt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                        <Upload className="w-3.5 h-3.5 mr-1.5" /> Enviar logotipo
                      </Button>
                      {form.printLogoUrl && (
                        <Button type="button" variant="ghost" size="sm" className="text-gray-500" onClick={() => { setField("printLogoUrl", ""); setField("printLogoKey", ""); }}>
                          <X className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG ou WEBP · máximo de 2MB.</p>
                  </div>
                  <div>
                    <Label htmlFor="nextOsNumber">Próximo Número de OS</Label>
                    <Input id="nextOsNumber" type="number" min={1} value={form.nextOsNumber} onChange={(event) => setField("nextOsNumber", Number(event.target.value || 1))} className="mt-1 max-w-xs" />
                    <p className="text-xs text-gray-500 mt-1">Contador inicial reservado para a numeração de OS. A numeração dos pedidos existentes não é alterada.</p>
                  </div>
                </div>

                <div>
                  <Label>Termos e Condições / Garantia da OS</Label>
                  <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 font-bold" title="Negrito" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTermsFormat("bold")}>B</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 italic" title="Itálico" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTermsFormat("italic")}>I</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" title="Lista" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTermsFormat("insertUnorderedList")}>• Lista</Button>
                      <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" title="Limpar formatação" onMouseDown={(event) => event.preventDefault()} onClick={() => applyTermsFormat("removeFormat")}>Limpar</Button>
                    </div>
                    <div
                      ref={termsEditorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(event) => setField("osTerms", event.currentTarget.innerHTML)}
                      className="min-h-36 p-3 text-sm text-gray-700 outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                      data-placeholder="Digite os termos e condições exibidos na OS..."
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Use os controles para formatação básica. O conteúdo será impresso no rodapé da OS.</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saveSettings.isPending} className="bg-pink-600 hover:bg-pink-700">
                {saveSettings.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="w-4 h-4 mr-2" /> Salvar Dados da Empresa</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
