import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle, AlertCircle, Key, CreditCard, QrCode,
  ExternalLink, Eye, EyeOff, Webhook, Shield,
} from 'lucide-react';

export default function MercadoPagoSettings() {
  const { data: settings, isLoading, refetch } = trpc.payment.getSettings.useQuery();
  const saveMutation = trpc.payment.saveSettings.useMutation();
  const testMutation = trpc.payment.testConnection.useMutation();

  const [form, setForm] = useState({
    accessToken: '',
    publicKey: '',
    sandbox: true,
    pixEnabled: true,
    cardEnabled: true,
    webhookSecret: '',
  });
  const [showToken, setShowToken] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setForm(prev => ({
        ...prev,
        accessToken: '', // nunca pré-preencher token por segurança
        publicKey: settings.publicKey ?? '',
        sandbox: settings.sandbox !== 0,
        pixEnabled: settings.pixEnabled !== 0,
        cardEnabled: settings.cardEnabled !== 0,
        webhookSecret: '',
      }));
    }
  }, [settings]);

  const handleSave = async () => {
    if (!form.accessToken && !settings?.hasAccessToken) {
      toast.error('Access Token é obrigatório');
      return;
    }
    if (!form.publicKey) {
      toast.error('Public Key é obrigatória');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        accessToken: form.accessToken || undefined,
        publicKey: form.publicKey,
        sandbox: form.sandbox,
        pixEnabled: form.pixEnabled,
        cardEnabled: form.cardEnabled,
        webhookSecret: form.webhookSecret || undefined,
      });
      toast.success('Configurações do Mercado Pago salvas!');
      setForm(prev => ({ ...prev, accessToken: '', webhookSecret: '' }));
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações');
    }
  };

  const handleTest = async () => {
    try {
      const result = await testMutation.mutateAsync();
      setTestResult({ ok: true, message: `Conexão OK! Conta: ${result.email} (${result.sandbox ? 'Sandbox' : 'Produção'})` });
      toast.success('Conexão com Mercado Pago funcionando!');
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Falha na conexão' });
      toast.error('Falha ao conectar com Mercado Pago');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mercado Pago</h1>
            <p className="text-gray-500 mt-1">Configure as credenciais e métodos de pagamento</p>
          </div>
          <div className="flex items-center gap-2">
            {settings?.hasAccessToken ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Pendente
              </Badge>
            )}
            {settings?.sandbox && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">Sandbox</Badge>
            )}
          </div>
        </div>

        {/* Credenciais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="w-4 h-4 text-orange-500" />
              Credenciais da API
            </CardTitle>
            <CardDescription>
              Obtenha suas credenciais em{' '}
              <a
                href="https://www.mercadopago.com.br/developers/pt/docs/checkout-api/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline inline-flex items-center gap-1"
              >
                Mercado Pago Developers
                <ExternalLink className="w-3 h-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ambiente */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Modo Sandbox (Teste)</p>
                <p className="text-xs text-gray-500">Desative para processar pagamentos reais</p>
              </div>
              <Switch
                checked={form.sandbox}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, sandbox: v }))}
              />
            </div>

            {form.sandbox && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <strong>Modo Sandbox ativo.</strong> Use as credenciais de teste do painel de desenvolvedores do Mercado Pago. Nenhum pagamento real será processado.
                </p>
              </div>
            )}

            {/* Access Token */}
            <div className="space-y-2">
              <Label htmlFor="accessToken">
                Access Token (Server-side) *
                {settings?.hasAccessToken && (
                  <span className="ml-2 text-xs text-green-600 font-normal">✓ Configurado</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="accessToken"
                  type={showToken ? 'text' : 'password'}
                  placeholder={settings?.hasAccessToken ? '••••••••••••••••••••••••••••••••' : 'APP_USR-...'}
                  value={form.accessToken}
                  onChange={(e) => setForm(prev => ({ ...prev, accessToken: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Usado exclusivamente no servidor. Nunca exposto ao cliente.</p>
            </div>

            {/* Public Key */}
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key (Client-side) *</Label>
              <Input
                id="publicKey"
                placeholder="APP_USR-..."
                value={form.publicKey}
                onChange={(e) => setForm(prev => ({ ...prev, publicKey: e.target.value }))}
              />
              <p className="text-xs text-gray-500">Usada no frontend para tokenizar cartões. Pode ser exposta com segurança.</p>
            </div>
          </CardContent>
        </Card>

        {/* Métodos de pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4 text-orange-500" />
              Métodos de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">PIX</p>
                  <p className="text-xs text-gray-500">QR Code + Copia e Cola — aprovação imediata</p>
                </div>
              </div>
              <Switch
                checked={form.pixEnabled}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, pixEnabled: v }))}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Cartão de débito/crédito</p>
                  <p className="text-xs text-gray-500">Checkout transparente — sem redirecionamento</p>
                </div>
              </div>
              <Switch
                checked={form.cardEnabled}
                onCheckedChange={(v) => setForm(prev => ({ ...prev, cardEnabled: v }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Webhook */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="w-4 h-4 text-orange-500" />
              Webhook IPN
            </CardTitle>
            <CardDescription>
              Configure o webhook no painel do Mercado Pago para receber notificações automáticas de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">URL do Webhook</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-gray-800 flex-1 font-mono break-all">
                  {window.location.origin}/api/payments/mercadopago/webhook
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/payments/mercadopago/webhook`);
                    toast.success('URL copiada!');
                  }}
                  className="text-xs text-orange-500 hover:text-orange-600 whitespace-nowrap"
                >
                  Copiar
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhookSecret">
                Webhook Secret (opcional)
                {settings?.hasWebhookSecret && (
                  <span className="ml-2 text-xs text-green-600 font-normal">✓ Configurado</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="webhookSecret"
                  type={showWebhookSecret ? 'text' : 'password'}
                  placeholder={settings?.hasWebhookSecret ? '••••••••••••••••' : 'Chave para validar assinatura do webhook'}
                  value={form.webhookSecret}
                  onChange={(e) => setForm(prev => ({ ...prev, webhookSecret: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">Configure no painel MP → Webhooks → Chave secreta</p>
            </div>

            <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <Shield className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange-700 space-y-1">
                <p><strong>Eventos a configurar no MP:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 text-orange-600">
                  <li>payment — para PIX e cartão</li>
                  <li>merchant_order — para pedidos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado do teste */}
        {testResult && (
          <div className={`flex items-start gap-2 rounded-lg p-3 border ${testResult.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {testResult.ok
              ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            }
            <p className={`text-sm ${testResult.ok ? 'text-green-700' : 'text-red-700'}`}>{testResult.message}</p>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center gap-3 pb-6">
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
            ) : (
              'Salvar Configurações'
            )}
          </Button>

          {settings?.hasAccessToken && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testando...</>
              ) : (
                'Testar Conexão'
              )}
            </Button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
