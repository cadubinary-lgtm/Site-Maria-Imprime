import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle, Settings, Key, MapPin, User, FlaskConical, Package, ExternalLink } from 'lucide-react';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO'
];

export default function CorreiosSettings() {
  const { data: settings, isLoading, refetch } = trpc.logistics.settings.get.useQuery();
  const saveMutation = trpc.logistics.settings.save.useMutation();
  const testMutation = trpc.logistics.settings.testConnection.useMutation();

  const [form, setForm] = useState({
    accessToken: '',
    email: '',
    originCep: '',
    senderName: '',
    senderPhone: '',
    senderDocument: '',
    senderAddress: '',
    senderNumber: '',
    senderComplement: '',
    senderDistrict: '',
    senderCity: '',
    senderStateAbbr: '',
    sandbox: true,
    cutoffTime: '13:00',
  });

  useEffect(() => {
    if (settings) {
      setForm(prev => ({
        ...prev,
        accessToken: '',
        email: settings.email ?? '',
        originCep: settings.originCep ?? '',
        senderName: settings.senderName ?? '',
        senderPhone: settings.senderPhone ?? '',
        senderDocument: settings.senderDocument ?? '',
        senderAddress: settings.senderAddress ?? '',
        senderNumber: settings.senderNumber ?? '',
        senderComplement: settings.senderComplement ?? '',
        senderDistrict: settings.senderDistrict ?? '',
        senderCity: settings.senderCity ?? '',
        senderStateAbbr: settings.senderStateAbbr ?? '',
        sandbox: settings.sandbox ?? true,
        cutoffTime: (settings as any).cutoffTime ?? '13:00',
      }));
    }
  }, [settings]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.originCep && !settings?.originCep) {
      toast.error('CEP de Origem é obrigatório');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        accessToken: form.accessToken || undefined,
        email: form.email || undefined,
        originCep: form.originCep.replace(/\D/g, '') || undefined,
        senderName: form.senderName || undefined,
        senderPhone: form.senderPhone || undefined,
        senderDocument: form.senderDocument || undefined,
        senderAddress: form.senderAddress || undefined,
        senderNumber: form.senderNumber || undefined,
        senderComplement: form.senderComplement || undefined,
        senderDistrict: form.senderDistrict || undefined,
        senderCity: form.senderCity || undefined,
        senderStateAbbr: form.senderStateAbbr || undefined,
        sandbox: form.sandbox,
        cutoffTime: form.cutoffTime || '13:00',
      });
      toast.success('Configurações salvas com sucesso!');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações');
    }
  };

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync();
      toast.success(`Conexão OK! Conta: ${result.user} (${result.sandbox ? 'Sandbox' : 'Produção'})`);
    } catch (err: any) {
      toast.error(err.message || 'Falha na conexão com o Melhor Envio');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-600" aria-label="Carregando configurações dos Correios" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-pink-600" aria-hidden="true" />
              Configurações — Melhor Envio
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure a integração com a API v2 do Melhor Envio para cálculo de frete e geração de etiquetas.
            </p>
          </div>
          <a
            href="https://melhorenvio.com.br/painel/gerenciar/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-pink-600 hover:text-pink-700 hover:underline flex items-center gap-1"
            aria-label="Obter token no Melhor Envio, abre em nova aba"
          >
            Obter Token <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        </div>

        {/* Horário Limite de Produção (Cut-off) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="text-lg">⏰</span>
              Horário Limite de Produção (Cut-off)
            </CardTitle>
            <CardDescription>
              Pedidos realizados após este horário terão +1 dia útil somado ao prazo de entrega local (Moto/Carro).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="space-y-2 flex-1 max-w-xs">
                <Label htmlFor="cutoffTime">Horário Limite</Label>
                <input
                  id="cutoffTime"
                  type="time"
                  value={form.cutoffTime}
                  onChange={(e) => setForm(prev => ({ ...prev, cutoffTime: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Exemplo: se configurado para <strong>13:00</strong>, consultas feitas após esse horário exibirão
                  prazos de entrega local com +1 dia útil automaticamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ambiente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="w-4 h-4" />
              Ambiente
            </CardTitle>
            <CardDescription>
              Use o modo Sandbox para testes sem custo real. Mude para Produção quando estiver pronto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Switch
                checked={form.sandbox}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, sandbox: v }))}
                aria-label={form.sandbox ? "Desativar modo Sandbox" : "Ativar modo Sandbox"}
              />
              <div>
                <p className="font-medium">
                  {form.sandbox
                    ? <span className="text-yellow-600">Modo Sandbox (Testes)</span>
                    : <span className="text-green-600">Modo Produção</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {form.sandbox
                    ? 'Requisições vão para sandbox.melhorenvio.com.br'
                    : 'Requisições vão para melhorenvio.com.br'}
                </p>
              </div>
              <Badge variant={form.sandbox ? 'secondary' : 'default'} className="ml-auto">
                {form.sandbox ? 'Sandbox' : 'Produção'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Autenticação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="w-4 h-4" />
              Autenticação
            </CardTitle>
            <CardDescription>
              Token de acesso (Bearer Token) gerado no painel do Melhor Envio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings?.hasToken && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700">
                  Token salvo. Para substituir, cole o novo token abaixo.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="token">Token de Acesso</Label>
              <Input
                id="token"
                type="password"
                placeholder={settings?.hasToken ? '••••••••••••••••••••••• (salvo)' : 'Cole seu Bearer Token aqui'}
                value={form.accessToken}
                onChange={set('accessToken')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail da Conta Melhor Envio</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testMutation.isPending || !settings?.hasToken}
              className="w-full"
              aria-busy={testMutation.isPending}
            >
              {testMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Testando...</>
                : <><CheckCircle className="w-4 h-4 mr-2" aria-hidden="true" /> Testar Conexão</>}
            </Button>
          </CardContent>
        </Card>

        {/* CEP de Origem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-4 h-4" />
              CEP de Origem
            </CardTitle>
            <CardDescription>
              CEP de onde os pedidos serão despachados. Usado no cálculo de frete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="cep">CEP de Origem</Label>
              <Input
                id="cep"
                placeholder="00000-000"
                value={form.originCep}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setForm(prev => ({ ...prev, originCep: v }));
                }}
                maxLength={9}
              />
              <p className="text-xs text-muted-foreground">Somente números (8 dígitos)</p>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Remetente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-4 h-4" />
              Dados do Remetente
            </CardTitle>
            <CardDescription>
              Informações do remetente usadas na geração de etiquetas de envio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="sender-name">Nome / Razão Social</Label>
                <Input id="sender-name" placeholder="Maria Imprime Ltda" value={form.senderName} onChange={set('senderName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-phone">Telefone</Label>
                <Input id="sender-phone" placeholder="(11) 99999-9999" value={form.senderPhone} onChange={set('senderPhone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-document">CPF / CNPJ</Label>
                <Input id="sender-document" placeholder="00.000.000/0001-00" value={form.senderDocument} onChange={set('senderDocument')} />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="sender-address">Endereço (Rua/Avenida)</Label>
                <Input id="sender-address" placeholder="Rua das Flores" value={form.senderAddress} onChange={set('senderAddress')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-number">Número</Label>
                <Input id="sender-number" placeholder="123" value={form.senderNumber} onChange={set('senderNumber')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-complement">Complemento</Label>
                <Input id="sender-complement" placeholder="Sala 1" value={form.senderComplement} onChange={set('senderComplement')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-district">Bairro</Label>
                <Input id="sender-district" placeholder="Centro" value={form.senderDistrict} onChange={set('senderDistrict')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-city">Cidade</Label>
                <Input id="sender-city" placeholder="São Paulo" value={form.senderCity} onChange={set('senderCity')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sender-state">Estado (UF)</Label>
                <select
                  id="sender-state"
                  value={form.senderStateAbbr}
                  onChange={set('senderStateAbbr')}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Selecione</option>
                  {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salvar */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-pink-600 hover:bg-pink-700 flex-1"
            aria-busy={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" /> Salvando...</>
              : <><Package className="w-4 h-4 mr-2" aria-hidden="true" /> Salvar Configurações</>}
          </Button>
        </div>

        {!settings?.hasToken && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Token não configurado. Sem o token, o cálculo de frete e a geração de etiquetas não funcionarão.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AdminLayout>
  );
}
