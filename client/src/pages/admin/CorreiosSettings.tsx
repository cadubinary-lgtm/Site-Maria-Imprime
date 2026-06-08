'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function CorreiosSettings() {
  const { data: settings, isLoading, refetch } = trpc.settings.getSettings.useQuery();
  const updateMutation = trpc.settings.updateSettings.useMutation();

  const [formData, setFormData] = useState({
    // Correios
    originCEP: '',
    // Dados de Remetente
    senderStreet: '',
    senderNumber: '',
    senderComplement: '',
    senderNeighborhood: '',
    senderCity: '',
    senderState: '',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        originCEP: settings.originCEP || '',
        senderStreet: settings.senderStreet || '',
        senderNumber: settings.senderNumber || '',
        senderComplement: settings.senderComplement || '',
        senderNeighborhood: settings.senderNeighborhood || '',
        senderCity: settings.senderCity || '',
        senderState: settings.senderState || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    // Validar CEP obrigatório
    if (!formData.originCEP) {
      setNotification({ type: 'error', message: 'CEP de Origem é obrigatório' });
      return;
    }

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
          <h1 className="text-2xl font-bold text-gray-900">Configurações de Logística</h1>
          <p className="text-sm text-gray-500">Configure o CEP de origem e dados de remetente para cálculo de frete e geração de etiquetas</p>
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

        {/* SEÇÃO 1: CORREIOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">1</div>
            <h2 className="text-lg font-semibold text-gray-900">Configuração de Origem - Correios</h2>
          </div>

          {/* CEP de Origem */}
          <div>
            <label className="text-sm font-medium text-gray-900">CEP de Origem *</label>
            <p className="text-xs text-gray-500 mb-2">CEP da sua loja para cálculo automático de frete</p>
            <Input
              value={formData.originCEP}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                const formatted = value.length === 8 ? `${value.slice(0, 5)}-${value.slice(5)}` : value;
                setFormData({ ...formData, originCEP: formatted });
              }}
              placeholder="00000-000"
              maxLength={10}
            />
            <p className="text-xs text-gray-400 mt-1">Formato: 00000-000</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>ℹ️ Informação:</strong> O CEP de origem é utilizado pela API dos Correios para calcular automaticamente o valor e prazo de entrega. 
              Este é o único campo obrigatório para o cálculo de frete.
            </p>
          </div>
        </div>

        {/* SEÇÃO 2: DADOS DE REMETENTE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
            <h2 className="text-lg font-semibold text-gray-900">Dados de Postagem / Remetente</h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Estes dados completos são utilizados para gerar etiquetas e declarações de conteúdo dos pacotes. 
            <strong> Não são enviados para a API de cálculo de frete.</strong>
          </p>

          {/* Rua */}
          <div>
            <label className="text-sm font-medium text-gray-900">Rua</label>
            <Input
              value={formData.senderStreet}
              onChange={(e) => setFormData({ ...formData, senderStreet: e.target.value })}
              placeholder="Ex: Avenida Paulista"
            />
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-900">Número</label>
              <Input
                value={formData.senderNumber}
                onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                placeholder="Ex: 1000"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Complemento</label>
              <Input
                value={formData.senderComplement}
                onChange={(e) => setFormData({ ...formData, senderComplement: e.target.value })}
                placeholder="Ex: Sala 500"
              />
            </div>
          </div>

          {/* Bairro */}
          <div>
            <label className="text-sm font-medium text-gray-900">Bairro</label>
            <Input
              value={formData.senderNeighborhood}
              onChange={(e) => setFormData({ ...formData, senderNeighborhood: e.target.value })}
              placeholder="Ex: Centro"
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-900">Cidade</label>
              <Input
                value={formData.senderCity}
                onChange={(e) => setFormData({ ...formData, senderCity: e.target.value })}
                placeholder="Ex: São Paulo"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-900">Estado</label>
              <select
                value={formData.senderState}
                onChange={(e) => setFormData({ ...formData, senderState: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Selecione um estado</option>
                {ESTADOS_BR.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>📦 Uso Futuro:</strong> Estes dados serão utilizados na geração de etiquetas de postagem, 
              declarações de conteúdo e documentos de envio dos pacotes.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-2">
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
    </AdminLayout>
  );
}
