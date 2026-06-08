import { useState, useEffect } from "react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, Save, Settings, Building, FileText, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ConfiguracoesFiscais() {
  const { data: settings, isLoading, refetch } = trpc.gestaoFiscal.getSettings.useQuery();

  const [cnpj, setCnpj] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [stateRegistration, setStateRegistration] = useState("");
  const [cityRegistration, setCityRegistration] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emitMode, setEmitMode] = useState<"manual" | "on_payment" | "on_completed">("manual");
  const [documentType, setDocumentType] = useState<"nfse" | "nfe" | "both">("nfse");

  useEffect(() => {
    if (settings) {
      setCnpj(settings.cnpj ?? "");
      setCompanyName(settings.companyName ?? "");
      setTradeName(settings.tradeName ?? "");
      setStateRegistration(settings.stateRegistration ?? "");
      setCityRegistration(settings.cityRegistration ?? "");
      setAddress(settings.address ?? "");
      setCity(settings.city ?? "");
      setState(settings.state ?? "");
      setZipCode(settings.zipCode ?? "");
      setPhone(settings.phone ?? "");
      setEmail(settings.email ?? "");
      setEmitMode(settings.emitMode ?? "manual");
      setDocumentType(settings.documentType ?? "nfse");
    }
  }, [settings]);

  const saveSettings = trpc.gestaoFiscal.saveSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      refetch();
    },
    onError: (e: any) => toast.error("Erro ao salvar: " + e.message),
  });

  const handleSave = () => {
    saveSettings.mutate({
      cnpj: cnpj || undefined,
      companyName: companyName || undefined,
      tradeName: tradeName || undefined,
      stateRegistration: stateRegistration || undefined,
      cityRegistration: cityRegistration || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
      phone: phone || undefined,
      email: email || undefined,
      emitMode,
      documentType,
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/fiscal">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configurações Fiscais</h1>
              <p className="text-sm text-gray-500">Dados da empresa e configurações de emissão</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saveSettings.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveSettings.isPending ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>

        {/* Aviso informativo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Módulo de Gestão Fiscal — Camada Adicional</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Este módulo funciona de forma independente ao sistema existente. Os dados configurados aqui
              são utilizados exclusivamente para o controle e emissão de notas fiscais, sem alterar
              nenhuma funcionalidade operacional já existente.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dados da Empresa */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-orange-500" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">CNPJ</label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Razão Social</label>
                  <Input
                    placeholder="Nome da empresa"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome Fantasia</label>
                  <Input
                    placeholder="Nome fantasia"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Inscrição Estadual</label>
                    <Input
                      placeholder="IE"
                      value={stateRegistration}
                      onChange={(e) => setStateRegistration(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Inscrição Municipal</label>
                    <Input
                      placeholder="IM"
                      value={cityRegistration}
                      onChange={(e) => setCityRegistration(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefone</label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">E-mail</label>
                  <Input
                    type="email"
                    placeholder="contato@empresa.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Endereço e Configurações */}
            <Card className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-orange-500" />
                  Endereço e Configurações de Emissão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Endereço</label>
                  <Input
                    placeholder="Rua, número, complemento"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cidade</label>
                    <Input
                      placeholder="Cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Estado</label>
                    <Input
                      placeholder="UF"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">CEP</label>
                  <Input
                    placeholder="00000-000"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Tipo de Documento</label>
                  <div className="flex gap-2">
                    {(["nfse", "nfe", "both"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setDocumentType(t)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border uppercase transition-colors ${
                          documentType === t ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {t === "both" ? "Ambos" : t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Modo de Emissão</label>
                  <div className="space-y-2">
                    {([
                      { key: "manual" as const, label: "Manual", desc: "Emitir manualmente quando necessário" },
                      { key: "on_payment" as const, label: "Ao Aprovar Pagamento", desc: "Emitir automaticamente ao confirmar pagamento" },
                      { key: "on_completed" as const, label: "Ao Concluir Pedido", desc: "Emitir ao marcar pedido como entregue" },
                    ]).map((m) => (
                      <div
                        key={m.key}
                        onClick={() => setEmitMode(m.key)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          emitMode === m.key ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <p className={`text-sm font-medium ${emitMode === m.key ? "text-orange-700" : "text-gray-700"}`}>{m.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aviso sobre integração */}
            <Card className="border border-amber-200 bg-amber-50 lg:col-span-2">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Integração com Emissor de NF</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Para emissão automática de notas fiscais, é necessário contratar um serviço de emissor
                      de NF-e/NFS-e (ex: eNotas, NFe.io, Omie, ContaAzul, etc.) e configurar a integração
                      via API. Entre em contato com o suporte técnico para configurar a integração com seu
                      provedor preferido.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
