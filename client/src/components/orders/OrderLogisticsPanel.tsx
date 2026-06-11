'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Truck, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface OrderLogisticsPanelProps {
  orderId: number;
  productionStatus?: string;
  deliveryStatus?: string;
}

export function OrderLogisticsPanel({
  orderId,
  productionStatus = 'pending',
  deliveryStatus = 'pending',
}: OrderLogisticsPanelProps) {
  const [newProductionStatus, setNewProductionStatus] = useState(productionStatus);
  const [newDeliveryStatus, setNewDeliveryStatus] = useState(deliveryStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  // Procedures de status serão reimplementadas na nova integração de logística
  const updateProductionStatusMutation = { mutateAsync: async (_: any) => {}, isPending: false };
  const updateDeliveryStatusMutation = { mutateAsync: async (_: any) => {}, isPending: false };

  const productionStatusOptions = [
    { value: 'pending', label: 'Pendente', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'in_production', label: 'Em Produção', icon: Package, color: 'bg-blue-100 text-blue-700' },
    { value: 'quality_check', label: 'Controle de Qualidade', icon: CheckCircle, color: 'bg-purple-100 text-purple-700' },
    { value: 'ready_for_shipment', label: 'Pronto para Envio', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  ];

  const deliveryStatusOptions = [
    { value: 'pending', label: 'Pendente', icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'shipped', label: 'Enviado', icon: Truck, color: 'bg-blue-100 text-blue-700' },
    { value: 'in_transit', label: 'Em Trânsito', icon: Truck, color: 'bg-orange-100 text-orange-700' },
    { value: 'delivered', label: 'Entregue', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
    { value: 'failed', label: 'Falha na Entrega', icon: AlertCircle, color: 'bg-red-100 text-red-700' },
  ];

  const handleUpdateProductionStatus = async () => {
    if (newProductionStatus === productionStatus) return;
    setIsUpdating(true);
    try {
      await updateProductionStatusMutation.mutateAsync({
        orderId,
        status: newProductionStatus as any,
      });
      toast.success('Status de produção atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status de produção');
      setNewProductionStatus(productionStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateDeliveryStatus = async () => {
    if (newDeliveryStatus === deliveryStatus) return;
    setIsUpdating(true);
    try {
      await updateDeliveryStatusMutation.mutateAsync({
        orderId,
        status: newDeliveryStatus as any,
      });
      toast.success('Status de entrega atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status de entrega');
      setNewDeliveryStatus(deliveryStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const getProdStatusBadge = (status: string) => {
    const option = productionStatusOptions.find((opt) => opt.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <Badge className={option.color}>
        <Icon className="w-3 h-3 mr-1" />
        {option.label}
      </Badge>
    );
  };

  const getDeliveryStatusBadge = (status: string) => {
    const option = deliveryStatusOptions.find((opt) => opt.value === status);
    if (!option) return null;
    const Icon = option.icon;
    return (
      <Badge className={option.color}>
        <Icon className="w-3 h-3 mr-1" />
        {option.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status de Produção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Status de Produção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Atual:</span>
            {getProdStatusBadge(productionStatus)}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Atualizar Status</label>
            <Select value={newProductionStatus} onValueChange={setNewProductionStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {productionStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleUpdateProductionStatus}
            disabled={isUpdating || newProductionStatus === productionStatus}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Status de Produção'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Status de Entrega */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Status de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Atual:</span>
            {getDeliveryStatusBadge(deliveryStatus)}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Atualizar Status</label>
            <Select value={newDeliveryStatus} onValueChange={setNewDeliveryStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {deliveryStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleUpdateDeliveryStatus}
            disabled={isUpdating || newDeliveryStatus === deliveryStatus}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Status de Entrega'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
