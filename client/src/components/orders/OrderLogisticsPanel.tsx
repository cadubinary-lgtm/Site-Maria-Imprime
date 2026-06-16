'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, Truck, CheckCircle, AlertCircle, Clock, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface OrderLogisticsPanelProps {
  orderId: number;
  preProductionStatus?: string;
  productionStatus?: string;
  deliveryStatus?: string;
}

export function OrderLogisticsPanel({
  orderId,
  preProductionStatus = 'liberado_analise',
  productionStatus = 'pendente',
  deliveryStatus = 'pending',
}: OrderLogisticsPanelProps) {
  const [newPreProductionStatus, setNewPreProductionStatus] = useState(preProductionStatus);
  const [newProductionStatus, setNewProductionStatus] = useState(productionStatus);
  const [newDeliveryStatus, setNewDeliveryStatus] = useState(deliveryStatus);
  const utils = trpc.useUtils();

  // Procedures reais vinculadas ao banco
  const updatePreProductionMutation = trpc.admin.updatePreProductionStatus.useMutation({
    onSuccess: () => {
      toast.success('Status de pré-impressão atualizado!');
      utils.checkout.getAllOrders.invalidate();
    },
    onError: () => toast.error('Erro ao atualizar status de pré-impressão'),
  });

  const updateProductionMutation = trpc.admin.updateProductionStatus.useMutation({
    onSuccess: () => {
      toast.success('Status de produção atualizado!');
      utils.checkout.getAllOrders.invalidate();
    },
    onError: () => toast.error('Erro ao atualizar status de produção'),
  });

  // Delivery status ainda não tem procedure — mantido como placeholder
  const updateDeliveryStatusMutation = { mutateAsync: async (_: any) => {}, isPending: false };

  // Opções de Pré-Impressão
  const preProductionStatusOptions = [
    { value: 'liberado_analise',    label: 'Liberado para Análise', icon: Clock,         color: 'bg-yellow-100 text-yellow-700' },
    { value: 'arte_final_aprovada', label: 'Arte Final Aprovada',   icon: CheckCircle,   color: 'bg-green-100 text-green-700' },
  ];

  // Opções de Produção
  const productionStatusOptions = [
    { value: 'pendente',              label: 'Pendente',              icon: Clock,         color: 'bg-yellow-100 text-yellow-700' },
    { value: 'impresso',              label: 'Impresso',              icon: Package,       color: 'bg-blue-100 text-blue-700' },
    { value: 'acabamento_finalizado', label: 'Acabamento Finalizado', icon: CheckCircle,   color: 'bg-green-100 text-green-700' },
  ];

  // Opções de Entrega
  const deliveryStatusOptions = [
    { value: 'pending',    label: 'Pendente',         icon: Clock,         color: 'bg-yellow-100 text-yellow-700' },
    { value: 'shipped',    label: 'Enviado',           icon: Truck,         color: 'bg-blue-100 text-blue-700' },
    { value: 'in_transit', label: 'Em Trânsito',       icon: Truck,         color: 'bg-orange-100 text-orange-700' },
    { value: 'delivered',  label: 'Entregue',          icon: CheckCircle,   color: 'bg-green-100 text-green-700' },
    { value: 'failed',     label: 'Falha na Entrega',  icon: AlertCircle,   color: 'bg-red-100 text-red-700' },
  ];

  const getStatusBadge = (status: string, options: typeof productionStatusOptions) => {
    const option = options.find((opt) => opt.value === status);
    if (!option) return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    const Icon = option.icon;
    return (
      <Badge className={option.color}>
        <Icon className="w-3 h-3 mr-1" />
        {option.label}
      </Badge>
    );
  };

  const handleUpdateDeliveryStatus = async () => {
    if (newDeliveryStatus === deliveryStatus) return;
    try {
      await updateDeliveryStatusMutation.mutateAsync({ orderId, status: newDeliveryStatus as any });
      toast.success('Status de entrega atualizado!');
    } catch {
      toast.error('Erro ao atualizar status de entrega');
      setNewDeliveryStatus(deliveryStatus);
    }
  };

  return (
    <div className="space-y-4">
      {/* Pré-Impressão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Pré-Impressão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status Atual:</span>
            {getStatusBadge(newPreProductionStatus, preProductionStatusOptions)}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Atualizar Status</label>
            <Select value={newPreProductionStatus} onValueChange={setNewPreProductionStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {preProductionStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() =>
              updatePreProductionMutation.mutate({
                orderId,
                preProductionStatus: newPreProductionStatus as any,
              })
            }
            disabled={
              updatePreProductionMutation.isPending ||
              newPreProductionStatus === preProductionStatus
            }
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {updatePreProductionMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              'Atualizar Pré-Impressão'
            )}
          </Button>
        </CardContent>
      </Card>

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
            {getStatusBadge(newProductionStatus, productionStatusOptions)}
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
            onClick={() =>
              updateProductionMutation.mutate({
                orderId,
                productionStatus: newProductionStatus as any,
              })
            }
            disabled={
              updateProductionMutation.isPending ||
              newProductionStatus === productionStatus
            }
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {updateProductionMutation.isPending ? (
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
            {getStatusBadge(newDeliveryStatus, deliveryStatusOptions)}
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
            disabled={newDeliveryStatus === deliveryStatus}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            Atualizar Status de Entrega
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
