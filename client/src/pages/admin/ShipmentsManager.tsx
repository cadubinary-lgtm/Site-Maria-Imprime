import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Loader2, Package, Truck, Tag, CreditCard, ExternalLink,
  AlertCircle, CheckCircle, RefreshCw, Plus
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  cart: { label: 'No Carrinho', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Pago / Etiqueta Emitida', color: 'bg-green-100 text-green-700' },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700' },
};

export function ShipmentsManager() {
  const { data: shipments, isLoading, refetch } = trpc.logistics.shipments.list.useQuery({ page: 1, pageSize: 50 });
  const addToCartMutation = trpc.logistics.shipments.create.useMutation();
  const checkoutMutation = trpc.logistics.shipments.checkout.useMutation();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    orderId: '',
    serviceId: '',
    serviceName: '',
    companyName: '',
    recipientName: '',
    recipientDocument: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientAddress: '',
    recipientNumber: '',
    recipientComplement: '',
    recipientDistrict: '',
    recipientCity: '',
    recipientStateAbbr: '',
    recipientCep: '',
    weight: '1',
    height: '5',
    width: '30',
    length: '40',
    insuranceValue: '0',
  });

  const { data: settings } = trpc.logistics.settings.get.useQuery();

  const setField = (field: keyof typeof addForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleAddToCart = async () => {
    if (!addForm.orderId || !addForm.serviceId) {
      toast.error('ID do Pedido e ID do Serviço são obrigatórios');
      return;
    }
    try {
      await addToCartMutation.mutateAsync({
        orderId: parseInt(addForm.orderId),
        serviceId: parseInt(addForm.serviceId),
        serviceName: addForm.serviceName,
        companyName: addForm.companyName,
        price: 0,
        recipientName: addForm.recipientName,
        recipientDocument: addForm.recipientDocument,
        recipientEmail: addForm.recipientEmail,
        recipientPhone: addForm.recipientPhone,
        recipientAddress: addForm.recipientAddress,
        recipientNumber: addForm.recipientNumber,
        recipientComplement: addForm.recipientComplement,
        recipientDistrict: addForm.recipientDistrict,
        recipientCity: addForm.recipientCity,
        recipientStateAbbr: addForm.recipientStateAbbr,
        recipientCep: addForm.recipientCep.replace(/\D/g, ''),
        products: [],
        weight: parseFloat(addForm.weight),
        height: parseFloat(addForm.height),
        width: parseFloat(addForm.width),
        length: parseFloat(addForm.length),
        insuranceValue: parseFloat(addForm.insuranceValue),
      });
      toast.success('Adicionado ao carrinho do Melhor Envio!');
      setShowAddDialog(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar ao carrinho');
    }
  };

  const handleCheckout = async (shipmentId: number) => {
    try {
      const result = await checkoutMutation.mutateAsync({ shipmentId });
      toast.success('Etiqueta emitida com sucesso!');
      if (result.labelUrl) {
        window.open(result.labelUrl, '_blank');
      }
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao emitir etiqueta');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-orange-500" />
              Expedição
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie envios e emita etiquetas via Melhor Envio API v2.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} size="sm">
              <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              disabled={!settings?.hasToken}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Expedição
            </Button>
          </div>
        </div>

        {!settings?.hasToken && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Token do Melhor Envio não configurado. Acesse <strong>Configurações</strong> para salvar seu token.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de expedições */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : !shipments || shipments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Package className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-lg">Nenhuma expedição cadastrada</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Clique em "Nova Expedição" para criar um envio e gerar uma etiqueta.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {shipments.map((shipment: any) => {
              const statusInfo = STATUS_LABELS[shipment.status] || { label: shipment.status, color: 'bg-gray-100 text-gray-700' };
              return (
                <Card key={shipment.id}>
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Pedido #{shipment.orderId}</p>
                      <p className="text-sm text-muted-foreground">
                        {shipment.companyName} — {shipment.serviceName}
                      </p>
                      {shipment.meOrderId && (
                        <p className="text-xs text-muted-foreground">ME Order: {shipment.meOrderId}</p>
                      )}
                    </div>
                    <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    <div className="flex gap-2">
                      {shipment.status === 'cart' && (
                        <Button
                          size="sm"
                          onClick={() => handleCheckout(shipment.id)}
                          disabled={checkoutMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {checkoutMutation.isPending
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <><CreditCard className="w-4 h-4 mr-1" /> Pagar e Emitir</>}
                        </Button>
                      )}
                      {shipment.labelUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(shipment.labelUrl, '_blank')}
                        >
                          <Tag className="w-4 h-4 mr-1" /> Etiqueta
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialog Nova Expedição */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Expedição — Adicionar ao Carrinho</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID do Pedido *</Label>
                  <Input placeholder="123" value={addForm.orderId} onChange={setField('orderId')} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>ID do Serviço (Melhor Envio) *</Label>
                  <Input placeholder="1 = PAC, 2 = SEDEX..." value={addForm.serviceId} onChange={setField('serviceId')} type="number" />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Serviço</Label>
                  <Input placeholder="PAC" value={addForm.serviceName} onChange={setField('serviceName')} />
                </div>
                <div className="space-y-2">
                  <Label>Transportadora</Label>
                  <Input placeholder="Correios" value={addForm.companyName} onChange={setField('companyName')} />
                </div>
              </div>

              <Separator />
              <p className="text-sm font-semibold">Destinatário</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nome Completo</Label>
                  <Input placeholder="João Silva" value={addForm.recipientName} onChange={setField('recipientName')} />
                </div>
                <div className="space-y-2">
                  <Label>CPF / CNPJ</Label>
                  <Input placeholder="000.000.000-00" value={addForm.recipientDocument} onChange={setField('recipientDocument')} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" placeholder="joao@email.com" value={addForm.recipientEmail} onChange={setField('recipientEmail')} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input placeholder="(11) 99999-9999" value={addForm.recipientPhone} onChange={setField('recipientPhone')} />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input placeholder="00000-000" value={addForm.recipientCep} onChange={setField('recipientCep')} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Endereço</Label>
                  <Input placeholder="Rua das Flores" value={addForm.recipientAddress} onChange={setField('recipientAddress')} />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input placeholder="123" value={addForm.recipientNumber} onChange={setField('recipientNumber')} />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input placeholder="Apto 1" value={addForm.recipientComplement} onChange={setField('recipientComplement')} />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input placeholder="Centro" value={addForm.recipientDistrict} onChange={setField('recipientDistrict')} />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input placeholder="São Paulo" value={addForm.recipientCity} onChange={setField('recipientCity')} />
                </div>
                <div className="space-y-2">
                  <Label>Estado (UF)</Label>
                  <Input placeholder="SP" maxLength={2} value={addForm.recipientStateAbbr} onChange={setField('recipientStateAbbr')} className="uppercase" />
                </div>
              </div>

              <Separator />
              <p className="text-sm font-semibold">Dimensões do Pacote</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input type="number" min="0.1" step="0.1" value={addForm.weight} onChange={setField('weight')} />
                </div>
                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <Input type="number" min="1" value={addForm.height} onChange={setField('height')} />
                </div>
                <div className="space-y-2">
                  <Label>Largura (cm)</Label>
                  <Input type="number" min="1" value={addForm.width} onChange={setField('width')} />
                </div>
                <div className="space-y-2">
                  <Label>Comprimento (cm)</Label>
                  <Input type="number" min="1" value={addForm.length} onChange={setField('length')} />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Valor Declarado (R$)</Label>
                  <Input type="number" min="0" step="0.01" value={addForm.insuranceValue} onChange={setField('insuranceValue')} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
              <Button
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {addToCartMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adicionando...</>
                  : <><Package className="w-4 h-4 mr-2" /> Adicionar ao Carrinho</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
