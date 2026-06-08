'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function CorreiosSettings() {
  const { data: settings, isLoading, refetch } = trpc.settings.getSettings.useQuery();
  const updateMutation = trpc.settings.updateSettings.useMutation();

  const [formData, setFormData] = useState({
    originCEP: '',
    correiosUser: '',
    correiosPassword: '',
    correiosContractNumber: '',
    correiosPostalCard: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        originCEP: settings.originCEP || '',
        correiosUser: settings.correiosUser || '',
        correiosPassword: settings.correiosPassword || '',
        correiosContractNumber: settings.correiosContractNumber || '',
        correiosPostalCard: settings.correiosPostalCard || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(formData);
      refetch();
      setNotification({ type: 'success', message: 'Configurações salvas com sucesso' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Erro ao salvar configurações' });
    } finally {
      setIsSaving(false);
    }
  };

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
      <div className="p-5 space-y-5 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações dos Correios</h1>
          <p className="text-sm text-gray-500">Configure as credenciais e dados de origem para integração com a API dos Correios</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={notification.type === 'success' ? 'text-green-900' : 'text-red-900'}>{notification.message}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          {/* CEP de Origem */}
          <div>
            <label className="text-sm font-medium text-gray-900">CEP de Origem *</label>
            <p className="text-xs text-gray-500 mb-2">CEP da sua loja para cálculo de frete</p>
            <Input
              value={formData.originCEP}
              onChange={(e) => setFormData({ ...formData, originCEP: e.target.value })}
              placeholder="00000-000"
              maxLength={10}
            />
          </div>

          {/* Usuário (CNPJ) */}
          <div>
            <label className="text-sm font-medium text-gray-900">Usuário API CWS (CNPJ) *</label>
            <p className="text-xs text-gray-500 mb-2">Fornecido pelos Correios</p>
            <Input
              value={formData.correiosUser}
              onChange={(e) => setFormData({ ...formData, correiosUser: e.target.value })}
              placeholder="Seu CNPJ ou usuário"
            />
          </div>

          {/* Código de Acesso */}
          <div>
            <label className="text-sm font-medium text-gray-900">Código de Acesso API CWS *</label>
            <p className="text-xs text-gray-500 mb-2">Código de acesso fornecido pelos Correios</p>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.correiosPassword}
                onChange={(e) => setFormData({ ...formData, correiosPassword: e.target.value })}
                placeholder="Código de acesso"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Número de Contrato */}
          <div>
            <label className="text-sm font-medium text-gray-900">Número de Contrato *</label>
            <p className="text-xs text-gray-500 mb-2">Número do seu contrato com os Correios</p>
            <Input
              value={formData.correiosContractNumber}
              onChange={(e) => setFormData({ ...formData, correiosContractNumber: e.target.value })}
              placeholder="Número do contrato"
            />
          </div>

          {/* Número do Cartão de Postagem */}
          <div>
            <label className="text-sm font-medium text-gray-900">Número do Cartão de Postagem *</label>
            <p className="text-xs text-gray-500 mb-2">Número do seu cartão de postagem</p>
            <Input
              value={formData.correiosPostalCard}
              onChange={(e) => setFormData({ ...formData, correiosPostalCard: e.target.value })}
              placeholder="Número do cartão"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Essas credenciais são necessárias para calcular fretes automaticamente através da API dos Correios. 
              Você pode obter essas informações no painel administrativo dos Correios.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
