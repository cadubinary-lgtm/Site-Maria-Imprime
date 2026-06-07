'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CarriersManager() {
  const { data: carriers, isLoading, refetch } = trpc.logistics.carriers.list.useQuery();
  const createMutation = trpc.logistics.carriers.create.useMutation();
  const updateMutation = trpc.logistics.carriers.update.useMutation();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [carrierType, setCarrierType] = useState<'generic' | 'correios'>('generic');
  const [newCarrier, setNewCarrier] = useState({
    name: '',
    code: '',
    apiProvider: '',
    apiKey: '',
    // Campos específicos dos Correios
    cwsUser: '',
    cwsPassword: '',
    contractNumber: '',
    postalCardNumber: '',
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCreate = async () => {
    if (!newCarrier.name || !newCarrier.code) {
      setNotification({ type: 'error', message: 'Preencha os campos obrigatórios' });
      return;
    }

    // Validar campos específicos dos Correios
    if (carrierType === 'correios') {
      if (!newCarrier.cwsUser || !newCarrier.cwsPassword || !newCarrier.contractNumber || !newCarrier.postalCardNumber) {
        setNotification({ type: 'error', message: 'Preencha todos os campos dos Correios' });
        return;
      }
    }

    try {
      await createMutation.mutateAsync(newCarrier as any);
      setNewCarrier({
        name: '',
        code: '',
        apiProvider: '',
        apiKey: '',
        cwsUser: '',
        cwsPassword: '',
        contractNumber: '',
        postalCardNumber: '',
      });
      setIsCreating(false);
      setCarrierType('generic');
      refetch();
      setNotification({ type: 'success', message: 'Transportadora criada com sucesso' });
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
            <p className="text-sm text-gray-500">Gerencie as transportadoras disponíveis</p>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" /> Nova Transportadora
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Transportadora</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Tabs para tipo de transportadora */}
                <Tabs value={carrierType} onValueChange={(v) => setCarrierType(v as 'generic' | 'correios')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generic">Genérica</TabsTrigger>
                    <TabsTrigger value="correios">Correios</TabsTrigger>
                  </TabsList>

                  {/* Campos Genéricos */}
                  <TabsContent value="generic" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome *</label>
                      <Input
                        value={newCarrier.name}
                        onChange={(e) => setNewCarrier({ ...newCarrier, name: e.target.value })}
                        placeholder="Ex: Jadlog, Uber Entrega"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Código *</label>
                      <Input
                        value={newCarrier.code}
                        onChange={(e) => setNewCarrier({ ...newCarrier, code: e.target.value })}
                        placeholder="Ex: JADLOG, UBER"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Provedor API</label>
                      <Input
                        value={newCarrier.apiProvider}
                        onChange={(e) => setNewCarrier({ ...newCarrier, apiProvider: e.target.value })}
                        placeholder="Ex: jadlog, uber"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">API Key</label>
                      <Input
                        value={newCarrier.apiKey}
                        onChange={(e) => setNewCarrier({ ...newCarrier, apiKey: e.target.value })}
                        placeholder="Chave da API"
                        type="password"
                      />
                    </div>
                  </TabsContent>

                  {/* Campos Correios */}
                  <TabsContent value="correios" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-900">
                        Preencha com os dados fornecidos pelos Correios em sua plataforma de integração
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Nome *</label>
                      <Input
                        value={newCarrier.name}
                        onChange={(e) => setNewCarrier({ ...newCarrier, name: e.target.value })}
                        placeholder="Ex: Correios"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Código *</label>
                      <Input
                        value={newCarrier.code}
                        onChange={(e) => setNewCarrier({ ...newCarrier, code: e.target.value })}
                        placeholder="Ex: CORREIOS"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Usuário API CWS *</label>
                        <Input
                          value={newCarrier.cwsUser}
                          onChange={(e) => setNewCarrier({ ...newCarrier, cwsUser: e.target.value })}
                          placeholder="Usuário da API"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Código de Acesso API CWS *</label>
                        <Input
                          value={newCarrier.cwsPassword}
                          onChange={(e) => setNewCarrier({ ...newCarrier, cwsPassword: e.target.value })}
                          placeholder="Código de acesso"
                          type="password"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Número de Contrato *</label>
                        <Input
                          value={newCarrier.contractNumber}
                          onChange={(e) => setNewCarrier({ ...newCarrier, contractNumber: e.target.value })}
                          placeholder="Número do contrato"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Número do Cartão de Postagem *</label>
                        <Input
                          value={newCarrier.postalCardNumber}
                          onChange={(e) => setNewCarrier({ ...newCarrier, postalCardNumber: e.target.value })}
                          placeholder="Número do cartão"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={handleCreate} className="w-full bg-orange-500 hover:bg-orange-600">
                  Criar Transportadora
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Provedor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allCarriers.map((carrier: any) => (
                <tr key={carrier.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{carrier.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{carrier.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{carrier.apiProvider || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      carrier.cwsUser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {carrier.cwsUser ? 'Correios' : 'Genérica'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
