'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ShippingRulesManager() {
  const { data: carriers } = trpc.logistics.carriers.list.useQuery();
  const [selectedCarrierId, setSelectedCarrierId] = useState<number | null>(null);
  const { data: rules, isLoading, refetch } = trpc.logistics.shippingRules.listByCarrier.useQuery(
    { carrierId: selectedCarrierId || 0 },
    { enabled: !!selectedCarrierId }
  );

  const allCarriers = (carriers ?? []) as any[];
  const allRules = (rules ?? []) as any[];

  if (isLoading && selectedCarrierId) {
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
            <h1 className="text-2xl font-bold text-gray-900">Regras de Frete</h1>
            <p className="text-sm text-gray-500">Gerencie as regras de frete por transportadora</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> Nova Regra
          </Button>
        </div>

        {/* Seletor de Transportadora */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <label className="text-sm font-medium">Selecione uma Transportadora</label>
          <select
            value={selectedCarrierId || ''}
            onChange={(e) => setSelectedCarrierId(parseInt(e.target.value))}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">-- Selecione --</option>
            {allCarriers.map((carrier: any) => (
              <option key={carrier.id} value={carrier.id}>{carrier.name}</option>
            ))}
          </select>
        </div>

        {/* Tabela de Regras */}
        {selectedCarrierId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">CEP De</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">CEP Até</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Preço Base</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Dias</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody>
                {allRules.map((rule: any) => (
                  <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{rule.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{rule.cepFrom || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{rule.cepTo || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">R$ {rule.basePrice}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{rule.estimatedDays}</td>
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
        )}
      </div>
    </AdminLayout>
  );
}
