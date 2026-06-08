'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, Plus, Edit2, CheckCircle, AlertCircle,
  ChevronDown, ChevronUp, Truck, Bike, Car, Globe, Settings
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CarrierType = 'correios' | 'jadlog' | 'melhorenvio' | 'alternativo';

interface CarrierForm {
  name: string;
  code: string;
  // Correios
  cwsUser: string;
  cwsPassword: string;
  contractNumber: string;
  postalCardNumber: string;
  originCep: string;
  // Jadlog
  jadlogCnpj: string;
  jadlogToken: string;
  jadlogContaCorrente: string;
  jadlogCodigoFranquia: string;
  // Melhor Envio
  melhorEnvioClientId: string;
  melhorEnvioClientSecret: string;
  melhorEnvioAccessToken: string;
  melhorEnvioRefreshToken: string;
  melhorEnvioRedirectUri: string;
  melhorEnvioSandbox: boolean;
  // Frete Alternativo
  vehicleType: 'moto' | 'automovel' | '';
  driverName: string;
  driverPhone: string;
  baseRate: string;
}

const emptyForm: CarrierForm = {
  name: '', code: '',
  cwsUser: '', cwsPassword: '', contractNumber: '', postalCardNumber: '', originCep: '',
  jadlogCnpj: '', jadlogToken: '', jadlogContaCorrente: '', jadlogCodigoFranquia: '',
  melhorEnvioClientId: '', melhorEnvioClientSecret: '', melhorEnvioAccessToken: '',
  melhorEnvioRefreshToken: '', melhorEnvioRedirectUri: '', melhorEnvioSandbox: false,
  vehicleType: '', driverName: '', driverPhone: '', baseRate: '',
};

function getCarrierBadge(carrier: any) {
  const p = carrier.apiProvider;
  if (p === 'correios' || carrier.cwsUser) return { label: 'Correios', color: 'bg-yellow-100 text-yellow-800' };
  if (p === 'jadlog' || carrier.jadlogToken) return { label: 'Jadlog', color: 'bg-blue-100 text-blue-800' };
  if (p === 'melhorenvio' || carrier.melhorEnvioClientId) return { label: 'Melhor Envio', color: 'bg-green-100 text-green-800' };
  if (p === 'alternativo' || carrier.vehicleType) return { label: carrier.vehicleType === 'moto' ? 'Moto' : 'Automóvel', color: 'bg-purple-100 text-purple-800' };
  return { label: 'Genérica', color: 'bg-gray-100 text-gray-700' };
}

function getCarrierIcon(carrier: any) {
  if (carrier.vehicleType === 'moto') return <Bike className="w-5 h-5 text-purple-500" />;
  if (carrier.vehicleType === 'automovel') return <Car className="w-5 h-5 text-purple-500" />;
  if (carrier.apiProvider === 'melhorenvio' || carrier.melhorEnvioClientId) return <Globe className="w-5 h-5 text-green-500" />;
  return <Truck className="w-5 h-5 text-orange-500" />;
}

function RulesInline({ carrierId }: { carrierId: number }) {
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', cepFrom: '', cepTo: '', basePrice: '', estimatedDays: '' });
  const [note, setNote] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: rules, isLoading, refetch } = trpc.logistics.shippingRules.listByCarrier.useQuery(
    { carrierId },
    { enabled: open }
  );
  const createRule = trpc.logistics.shippingRules.create.useMutation();

  const handleAdd = async () => {
    if (!newRule.name || !newRule.basePrice || !newRule.estimatedDays) {
      setNote({ type: 'error', message: 'Preencha nome, preço e prazo' });
      return;
    }
    try {
      await createRule.mutateAsync({
        carrierId,
        name: newRule.name,
        cepFrom: newRule.cepFrom || undefined,
        cepTo: newRule.cepTo || undefined,
        basePrice: parseFloat(newRule.basePrice),
        estimatedDays: parseInt(newRule.estimatedDays),
      });
      setNewRule({ name: '', cepFrom: '', cepTo: '', basePrice: '', estimatedDays: '' });
      setShowAdd(false);
      refetch();
      setNote({ type: 'success', message: 'Regra adicionada!' });
      setTimeout(() => setNote(null), 3000);
    } catch (e: any) {
      setNote({ type: 'error', message: e.message });
    }
  };

  const allRules = (rules ?? []) as any[];

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
      >
        <Settings className="w-4 h-4" />
        Regras de Frete
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {note && (
            <div className={`p-2 rounded text-xs flex items-center gap-2 ${note.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {note.type === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {note.message}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : allRules.length === 0 ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              ⚠ Para aplicar este controle de frete, é necessário criar regras de frete.
            </p>
          ) : (
            <div className="space-y-1">
              {allRules.map((rule: any) => (
                <div key={rule.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-xs">
                  <span className="font-medium text-gray-800">{rule.name}</span>
                  <span className="text-gray-500">
                    {rule.cepFrom && rule.cepTo ? `CEP ${rule.cepFrom}–${rule.cepTo} · ` : ''}
                    R$ {parseFloat(String(rule.basePrice || 0)).toFixed(2)} · {rule.estimatedDays}d
                  </span>
                </div>
              ))}
            </div>
          )}

          {showAdd ? (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
              <p className="text-xs font-semibold text-gray-700">Nova Regra</p>
              <Input placeholder="Nome da regra (ex: Frete SP)" value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} className="text-xs h-8" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="CEP inicial" value={newRule.cepFrom} onChange={(e) => setNewRule({ ...newRule, cepFrom: e.target.value })} className="text-xs h-8" />
                <Input placeholder="CEP final" value={newRule.cepTo} onChange={(e) => setNewRule({ ...newRule, cepTo: e.target.value })} className="text-xs h-8" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Preço base (R$)" type="number" value={newRule.basePrice} onChange={(e) => setNewRule({ ...newRule, basePrice: e.target.value })} className="text-xs h-8" />
                <Input placeholder="Prazo (dias)" type="number" value={newRule.estimatedDays} onChange={(e) => setNewRule({ ...newRule, estimatedDays: e.target.value })} className="text-xs h-8" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} disabled={createRule.isPending} className="bg-orange-500 hover:bg-orange-600 text-xs h-7 px-3">
                  {createRule.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAdd(false)} className="text-xs h-7 px-3">Cancelar</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="text-xs h-7 px-3 border-orange-300 text-orange-600 hover:bg-orange-50">
              <Plus className="w-3 h-3 mr-1" /> Adicionar uma nova regra
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CarriersManager() {
  const { data: carriers, isLoading, refetch } = trpc.logistics.carriers.list.useQuery();
  const createMutation = trpc.logistics.carriers.create.useMutation();
  const updateMutation = trpc.logistics.carriers.update.useMutation();

  const [isCreating, setIsCreating] = useState(false);
  const [carrierType, setCarrierType] = useState<CarrierType>('correios');
  const [form, setForm] = useState<CarrierForm>(emptyForm);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const set = (field: keyof CarrierForm, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCreate = async () => {
    if (!form.name || !form.code) {
      setNotification({ type: 'error', message: 'Preencha Nome e Código' });
      return;
    }
    if (carrierType === 'alternativo' && !form.vehicleType) {
      setNotification({ type: 'error', message: 'Selecione o tipo de veículo' });
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: form.name,
        code: form.code,
        apiProvider: carrierType,
        ...(carrierType === 'correios' && {
          cwsUser: form.cwsUser || undefined,
          cwsPassword: form.cwsPassword || undefined,
          contractNumber: form.contractNumber || undefined,
          postalCardNumber: form.postalCardNumber || undefined,
          originCep: form.originCep || undefined,
        }),
        ...(carrierType === 'jadlog' && {
          jadlogCnpj: form.jadlogCnpj || undefined,
          jadlogToken: form.jadlogToken || undefined,
          jadlogContaCorrente: form.jadlogContaCorrente || undefined,
          jadlogCodigoFranquia: form.jadlogCodigoFranquia || undefined,
        }),
        ...(carrierType === 'melhorenvio' && {
          melhorEnvioClientId: form.melhorEnvioClientId || undefined,
          melhorEnvioClientSecret: form.melhorEnvioClientSecret || undefined,
          melhorEnvioAccessToken: form.melhorEnvioAccessToken || undefined,
          melhorEnvioRefreshToken: form.melhorEnvioRefreshToken || undefined,
          melhorEnvioRedirectUri: form.melhorEnvioRedirectUri || undefined,
          melhorEnvioSandbox: form.melhorEnvioSandbox,
        }),
        ...(carrierType === 'alternativo' && {
          vehicleType: form.vehicleType as 'moto' | 'automovel',
          driverName: form.driverName || undefined,
          driverPhone: form.driverPhone || undefined,
          baseRate: form.baseRate ? parseFloat(form.baseRate) : undefined,
        }),
      });
      setForm(emptyForm);
      setIsCreating(false);
      refetch();
      setNotification({ type: 'success', message: 'Transportadora criada com sucesso!' });
      setTimeout(() => setNotification(null), 4000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    }
  };

  const allCarriers = (carriers ?? []) as any[];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transportadoras</h1>
            <p className="text-sm text-gray-500">Gerencie transportadoras e regras de frete</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" /> Nova Transportadora
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Transportadora</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Campos básicos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome *</label>
                    <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex: Correios PAC" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Código *</label>
                    <Input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="Ex: correios_pac" />
                  </div>
                </div>

                {/* Tipo de transportadora */}
                <Tabs value={carrierType} onValueChange={(v) => setCarrierType(v as CarrierType)}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="correios" className="text-xs">📮 Correios</TabsTrigger>
                    <TabsTrigger value="jadlog" className="text-xs">🚚 Jadlog</TabsTrigger>
                    <TabsTrigger value="melhorenvio" className="text-xs">🌐 Melhor Envio</TabsTrigger>
                    <TabsTrigger value="alternativo" className="text-xs">🏍 Frete Alternativo</TabsTrigger>
                  </TabsList>

                  {/* ── Correios ── */}
                  <TabsContent value="correios" className="space-y-3 pt-3">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                      <strong>Correios API CWS</strong> — Acesse o portal dos Correios para obter suas credenciais de integração.
                    </div>
                    <div>
                      <label className="text-sm font-medium">CEP de Origem *</label>
                      <Input value={form.originCep} onChange={(e) => set('originCep', e.target.value)} placeholder="00000-000" />
                      <p className="text-xs text-gray-500 mt-1">CEP utilizado para calcular o frete</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Usuário API CWS</label>
                        <Input value={form.cwsUser} onChange={(e) => set('cwsUser', e.target.value)} placeholder="Usuário da API" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Código de Acesso CWS</label>
                        <Input value={form.cwsPassword} onChange={(e) => set('cwsPassword', e.target.value)} placeholder="Código de acesso" type="password" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Número de Contrato</label>
                        <Input value={form.contractNumber} onChange={(e) => set('contractNumber', e.target.value)} placeholder="Número do contrato" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Cartão de Postagem</label>
                        <Input value={form.postalCardNumber} onChange={(e) => set('postalCardNumber', e.target.value)} placeholder="Número do cartão" />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Jadlog ── */}
                  <TabsContent value="jadlog" className="space-y-3 pt-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                      <strong>Jadlog</strong> — Obtenha suas credenciais no portal de integrações da Jadlog (jadlog.com.br).
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">CNPJ / Usuário</label>
                        <Input value={form.jadlogCnpj} onChange={(e) => set('jadlogCnpj', e.target.value)} placeholder="00.000.000/0000-00" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Código da Franquia</label>
                        <Input value={form.jadlogCodigoFranquia} onChange={(e) => set('jadlogCodigoFranquia', e.target.value)} placeholder="Código da franquia" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Token de Integração</label>
                      <Input value={form.jadlogToken} onChange={(e) => set('jadlogToken', e.target.value)} placeholder="Token fornecido pela Jadlog" type="password" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Conta Corrente (correntistas)</label>
                      <Input value={form.jadlogContaCorrente} onChange={(e) => set('jadlogContaCorrente', e.target.value)} placeholder="Número da conta corrente (opcional)" />
                      <p className="text-xs text-gray-500 mt-1">Preencha apenas se for correntista Jadlog</p>
                    </div>
                  </TabsContent>

                  {/* ── Melhor Envio ── */}
                  <TabsContent value="melhorenvio" className="space-y-3 pt-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                      <strong>Melhor Envio OAuth2</strong> — Crie um aplicativo em melhorenvio.com.br para obter o Client ID e Client Secret.
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Client ID</label>
                        <Input value={form.melhorEnvioClientId} onChange={(e) => set('melhorEnvioClientId', e.target.value)} placeholder="Client ID do aplicativo" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Client Secret</label>
                        <Input value={form.melhorEnvioClientSecret} onChange={(e) => set('melhorEnvioClientSecret', e.target.value)} placeholder="Client Secret" type="password" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">URL de Callback (Redirect URI)</label>
                      <Input value={form.melhorEnvioRedirectUri} onChange={(e) => set('melhorEnvioRedirectUri', e.target.value)} placeholder="https://seusite.com/callback/melhorenvio" />
                      <p className="text-xs text-gray-500 mt-1">Deve ser idêntica à registrada no painel do Melhor Envio</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Access Token (após autorização)</label>
                      <Input value={form.melhorEnvioAccessToken} onChange={(e) => set('melhorEnvioAccessToken', e.target.value)} placeholder="Bearer token OAuth2" type="password" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Refresh Token</label>
                      <Input value={form.melhorEnvioRefreshToken} onChange={(e) => set('melhorEnvioRefreshToken', e.target.value)} placeholder="Refresh token para renovação automática" type="password" />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="sandbox"
                        checked={form.melhorEnvioSandbox}
                        onChange={(e) => set('melhorEnvioSandbox', e.target.checked)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <label htmlFor="sandbox" className="text-sm">Usar ambiente Sandbox (testes)</label>
                    </div>
                  </TabsContent>

                  {/* ── Frete Alternativo ── */}
                  <TabsContent value="alternativo" className="space-y-3 pt-3">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
                      <strong>Frete Alternativo</strong> — Configure entrega por motoboy ou automóvel próprio/terceirizado.
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tipo de Veículo *</label>
                      <div className="flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => set('vehicleType', 'moto')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.vehicleType === 'moto' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}
                        >
                          <Bike className="w-4 h-4" /> Moto
                        </button>
                        <button
                          type="button"
                          onClick={() => set('vehicleType', 'automovel')}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.vehicleType === 'automovel' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}
                        >
                          <Car className="w-4 h-4" /> Automóvel
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Nome do Entregador</label>
                        <Input value={form.driverName} onChange={(e) => set('driverName', e.target.value)} placeholder="Nome do entregador" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Telefone do Entregador</label>
                        <Input value={form.driverPhone} onChange={(e) => set('driverPhone', e.target.value)} placeholder="(00) 00000-0000" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Taxa Base (R$)</label>
                      <Input type="number" value={form.baseRate} onChange={(e) => set('baseRate', e.target.value)} placeholder="Ex: 15.00" />
                    </div>
                  </TabsContent>
                </Tabs>

                {notification && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {notification.message}
                  </div>
                )}

                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full bg-orange-500 hover:bg-orange-600">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Criar Transportadora
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Notification global */}
        {notification && !isCreating && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            <p className={notification.type === 'success' ? 'text-green-900' : 'text-red-900'}>{notification.message}</p>
          </div>
        )}

        {/* Cards de transportadoras */}
        {allCarriers.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-10 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma transportadora cadastrada</p>
            <p className="text-sm text-gray-400 mt-1">Clique em "Nova Transportadora" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allCarriers.map((carrier: any) => {
              const badge = getCarrierBadge(carrier);
              return (
                <div key={carrier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                        {getCarrierIcon(carrier)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{carrier.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{carrier.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await updateMutation.mutateAsync({ id: carrier.id, isActive: !carrier.isActive });
                          refetch();
                        }}
                        className={`h-7 px-2 text-xs ${carrier.isActive ? 'text-green-700 border-green-300' : 'text-gray-500'}`}
                      >
                        {carrier.isActive ? 'Ativo' : 'Inativo'}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                    {carrier.vehicleType && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                        {carrier.vehicleType === 'moto' ? '🏍 Moto' : '🚗 Automóvel'}
                      </span>
                    )}
                    {carrier.melhorEnvioSandbox && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Sandbox</span>
                    )}
                  </div>

                  {/* Detalhes específicos */}
                  {carrier.originCep && (
                    <p className="text-xs text-gray-500 mt-2">CEP origem: <span className="font-mono">{carrier.originCep}</span></p>
                  )}
                  {carrier.driverName && (
                    <p className="text-xs text-gray-500 mt-2">Entregador: {carrier.driverName}{carrier.driverPhone ? ` · ${carrier.driverPhone}` : ''}</p>
                  )}
                  {carrier.jadlogCodigoFranquia && (
                    <p className="text-xs text-gray-500 mt-2">Franquia: {carrier.jadlogCodigoFranquia}</p>
                  )}

                  {/* Regras inline */}
                  <RulesInline carrierId={carrier.id} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
