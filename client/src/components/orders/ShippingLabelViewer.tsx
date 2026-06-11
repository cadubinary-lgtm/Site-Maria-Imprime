import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ExternalLink, Printer, Package, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ShippingLabelViewerProps {
  orderId: number;
}

export function ShippingLabelViewer({ orderId }: ShippingLabelViewerProps) {
  const [fetchLabel, setFetchLabel] = useState(false);

  // Busca todos os shipments e encontra o deste pedido
  const { data: shipmentsList, isLoading: loadingList } = trpc.logistics.shipments.list.useQuery(
    { page: 1, pageSize: 100 }
  );

  const shipment = shipmentsList?.find((s: any) => s.orderId === orderId);

  // Busca a URL da etiqueta quando solicitado
  const { data: labelData, isLoading: loadingLabel, error: labelError } =
    trpc.logistics.shipments.getLabel.useQuery(
      { shipmentId: shipment?.id ?? 0 },
      { enabled: fetchLabel && !!shipment?.id }
    );

  if (loadingList) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Verificando expedição...
        </div>
      </Card>
    );
  }

  if (!shipment) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Expedição não criada</p>
            <p className="text-sm text-yellow-700">
              Para gerar a etiqueta, acesse <strong>Logística → Expedição</strong> e crie a expedição para este pedido.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!shipment.meOrderId) {
    return (
      <Card className="p-4 border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Etiqueta pendente de pagamento</p>
            <p className="text-sm text-blue-700">
              A expedição foi criada mas ainda não foi paga no Melhor Envio.
              Acesse <strong>Logística → Expedição</strong> para finalizar o checkout.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (shipment.labelUrl) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Printer className="w-4 h-4" />
            <span className="font-medium">Etiqueta disponível</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Transportadora: <strong>{shipment.companyName}</strong> — {shipment.serviceName}
          </div>
          {shipment.trackingCode && (
            <div className="text-sm text-muted-foreground">
              Código de rastreamento: <strong className="font-mono">{shipment.trackingCode}</strong>
            </div>
          )}
          <Button
            onClick={() => window.open(shipment.labelUrl ?? undefined, '_blank')}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir / Imprimir Etiqueta
          </Button>
        </div>
      </Card>
    );
  }

  if (!fetchLabel) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Transportadora: <strong>{shipment.companyName}</strong> — {shipment.serviceName}
          </div>
          {shipment.trackingCode && (
            <div className="text-sm text-muted-foreground">
              Código de rastreamento: <strong className="font-mono">{shipment.trackingCode}</strong>
            </div>
          )}
          <Button onClick={() => setFetchLabel(true)} variant="outline" className="w-full">
            <Printer className="w-4 h-4 mr-2" />
            Gerar Etiqueta de Envio
          </Button>
        </div>
      </Card>
    );
  }

  if (loadingLabel) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Gerando etiqueta no Melhor Envio...
        </div>
      </Card>
    );
  }

  if (labelError) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Erro ao gerar etiqueta</p>
            <p className="text-sm text-red-700">{labelError.message}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setFetchLabel(false)}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (labelData?.labelUrl) {
    return (
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Printer className="w-4 h-4" />
            <span className="font-medium">Etiqueta gerada com sucesso!</span>
          </div>
          <Button
            onClick={() => window.open(labelData.labelUrl!, '_blank')}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir / Imprimir Etiqueta
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-yellow-200 bg-yellow-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-900">Etiqueta não disponível</p>
          <p className="text-sm text-yellow-700">
            Verifique se o checkout foi realizado no Melhor Envio.
          </p>
        </div>
      </div>
    </Card>
  );
}
