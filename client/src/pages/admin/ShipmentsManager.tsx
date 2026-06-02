'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit2, Truck } from 'lucide-react';

export default function ShipmentsManager() {
  const { data: shipments, isLoading, refetch } = trpc.logistics.shipments.list.useQuery();
  const updateStatusMutation = trpc.logistics.shipments.updateStatus.useMutation();

  const allShipments = (shipments ?? []) as any[];

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus as any });
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
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
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expedição</h1>
            <p className="text-sm text-gray-500">Gerencie os envios e expedições</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" /> Nova Expedição
          </Button>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Pedido</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Rastreamento</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Peso</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody>
              {allShipments.map((shipment: any) => (
                <tr key={shipment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">#{shipment.orderId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{shipment.trackingNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{shipment.weight} kg</td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={shipment.status}
                      onChange={(e) => handleStatusChange(shipment.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        shipment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        shipment.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}
                    >
                      <option value="pending">Pendente</option>
                      <option value="shipped">Em Trânsito</option>
                      <option value="delivered">Entregue</option>
                      <option value="failed">Falha</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit2 className="w-4 h-4" />
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
