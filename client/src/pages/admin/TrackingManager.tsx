'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, MapPin, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function TrackingManager() {
  const { data: shipments, isLoading } = trpc.logistics.shipments.list.useQuery();
  const [selectedShipmentId, setSelectedShipmentId] = useState<number | null>(null);
  const { data: trackingEvents } = trpc.logistics.tracking.getByShipment.useQuery(
    { shipmentId: selectedShipmentId || 0 },
    { enabled: !!selectedShipmentId }
  );

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ status: '', location: '', description: '' });
  const addEventMutation = trpc.logistics.tracking.addEvent.useMutation();

  const allShipments = (shipments ?? []) as any[];
  const allEvents = (trackingEvents ?? []) as any[];

  const handleAddEvent = async () => {
    if (!selectedShipmentId || !newEvent.status) return;
    try {
      await addEventMutation.mutateAsync({
        shipmentId: selectedShipmentId,
        status: newEvent.status,
        location: newEvent.location,
        description: newEvent.description,
      });
      setNewEvent({ status: '', location: '', description: '' });
      setIsAddingEvent(false);
    } catch (error) {
      console.error('Erro ao adicionar evento:', error);
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
            <h1 className="text-2xl font-bold text-gray-900">Rastreamento</h1>
            <p className="text-sm text-gray-500">Acompanhe o status dos envios</p>
          </div>
          <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Evento de Rastreamento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Selecione --</option>
                    <option value="pending">Pendente</option>
                    <option value="in_transit">Em Trânsito</option>
                    <option value="delivered">Entregue</option>
                    <option value="failed">Falha</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Localização</label>
                  <Input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Ex: São Paulo, SP" />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Input value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Detalhes do evento" />
                </div>
                <Button onClick={handleAddEvent} className="w-full bg-orange-500 hover:bg-orange-600">
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Seletor de Envio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <label className="text-sm font-medium">Selecione um Envio</label>
          <select
            value={selectedShipmentId || ''}
            onChange={(e) => setSelectedShipmentId(parseInt(e.target.value))}
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">-- Selecione --</option>
            {allShipments.map((shipment: any) => (
              <option key={shipment.id} value={shipment.id}>
                Pedido #{shipment.orderId} - {shipment.trackingNumber}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline de Eventos */}
        {selectedShipmentId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-6">Histórico de Rastreamento</h2>
            <div className="space-y-4">
              {allEvents.length > 0 ? (
                allEvents.map((event: any, index: number) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-orange-600" />
                      </div>
                      {index < allEvents.length - 1 && <div className="w-0.5 h-12 bg-gray-200 mt-2" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-gray-900">{event.status}</p>
                      <p className="text-sm text-gray-600">{event.location}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.eventTime).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">Nenhum evento registrado</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
