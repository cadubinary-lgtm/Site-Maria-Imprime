import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Download, Printer } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ShippingLabelViewerProps {
  orderId: number;
}

export function ShippingLabelViewer({ orderId }: ShippingLabelViewerProps) {
  const [showLabel, setShowLabel] = useState(false);
  // @ts-ignore - procedure adicionado dinamicamente
  const { data, isLoading, error } = trpc.admin.generateShippingLabel.useQuery(
    { orderId },
    { enabled: showLabel }
  );

  const handlePrint = () => {
    if (!data?.html) return;
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(data.html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (!data?.html) return;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/html;charset=utf-8,' + encodeURIComponent(data.html));
    element.setAttribute('download', `etiqueta-pedido-${orderId}.html`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!showLabel) {
    return (
      <Card className="p-4">
        <Button onClick={() => setShowLabel(true)} variant="outline">
          Gerar Etiqueta de Envio
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin">⏳</div>
          Gerando etiqueta...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Erro ao gerar etiqueta</p>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data?.html) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-medium text-yellow-900">Etiqueta não disponível</p>
            <p className="text-sm text-yellow-700">Verifique se todos os dados do pedido estão preenchidos</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Preview da etiqueta */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <iframe
            srcDoc={data.html}
            className="w-full h-96 border-0"
            title="Prévia da etiqueta"
          />
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar HTML
          </Button>
          <Button
            onClick={() => setShowLabel(false)}
            variant="ghost"
          >
            Fechar
          </Button>
        </div>

        {/* Instruções */}
        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <p className="font-medium mb-1">Instruções:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Clique em "Imprimir" para imprimir a etiqueta em papel A4</li>
            <li>Clique em "Baixar HTML" para salvar e imprimir depois</li>
            <li>A etiqueta segue o padrão dos Correios (100mm x 150mm)</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
