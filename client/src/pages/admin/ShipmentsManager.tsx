import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
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
  AlertCircle, CheckCircle, RefreshCw, Plus, ClipboardList, ArrowRight
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; icon?: string }> = {
  pending:   { label: 'Pendente',                      color: 'bg-yellow-100 text-yellow-700' },
  cart:      { label: 'No Carrinho ME',                color: 'bg-blue-100 text-blue-700' },
  paid:      { label: 'Emitido / Pronto para Postagem', color: 'bg-green-100 text-green-700' },
  posted:    { label: 'Postado',                       color: 'bg-teal-100 text-teal-700' },
  delivered: { label: 'Entregue',                      color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado',                     color: 'bg-red-100 text-red-700' },
  error:     { label: 'Erro',                          color: 'bg-red-100 text-red-700' },
};

const EMPTY_FORM = {
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
};

export function ShipmentsManager() {
  const { data: shipments, isLoading, refetch } = trpc.logistics.shipments.list.useQuery({ page: 1, pageSize: 50 });
  const { data: pendingOrders, isLoading: loadingPending, refetch: refetchPending } = trpc.logistics.shipments.listPendingOrders.useQuery();
  const addToCartMutation = trpc.logistics.shipments.create.useMutation();
  const checkoutMutation = trpc.logistics.shipments.checkout.useMutation();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_FORM);

  const { data: settings } = trpc.logistics.settings.get.useQuery();

  const setField = (field: keyof typeof addForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddForm(prev => ({ ...prev, [field]: e.target.value }));

  // Pré-preenche o formulário com dados do pedido selecionado
  const handleSelectOrder = (order: any) => {
    // Valor declarado = total do pedido (sem frete), mínimo R$ 1,00
    const declaredValue = Math.max(
      parseFloat(order.totalPrice || '0') - parseFloat(order.shippingPrice || '0'),
      1
    ).toFixed(2);
    setAddForm({
      ...EMPTY_FORM,
      orderId: String(order.id),
      // Dados do destinatário
      recipientName: order.deliveryFullName || order.guestName || '',
      recipientPhone: order.resolvedPhone || order.deliveryPhone || '',
      // E-mail: usa o campo resolvido (cliente com conta > convidado)
      recipientEmail: order.resolvedEmail || '',
      // CPF/CNPJ: usa o campo resolvido (só disponível para clientes com conta)
      recipientDocument: order.resolvedDocument || '',
      // Endereço
      recipientAddress: order.deliveryStreet || '',
      recipientNumber: order.deliveryNumber || '',
      recipientComplement: order.deliveryComplement || '',
      recipientDistrict: order.deliveryNeighborhood || '',
      recipientCity: order.deliveryCity || '',
      recipientStateAbbr: order.deliveryState || '',
      recipientCep: (order.deliveryZipCode || order.shippingZipCode || '').replace(/\D/g, ''),
      // Valor declarado automático = valor dos produtos do pedido
      insuranceValue: declaredValue,
    });
    setShowAddDialog(true);
  };

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
      refetchPending();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar ao carrinho');
    }
  };

  const handleCheckout = async (shipmentId: number) => {
    try {
      const result = await checkoutMutation.mutateAsync({ shipmentId });
      if (result.labelUrl) {
        toast.success('✅ Etiqueta emitida! Abrindo PDF em nova aba...');
        window.open(result.labelUrl, '_blank');
      } else {
        toast.success('Pagamento aprovado! A etiqueta será gerada em instantes. Clique em "Imprimir Etiqueta" para baixar.');
      }
      if (result.trackingCode) {
        toast.info(`Código de rastreio: ${result.trackingCode}`);
      }
      refetch();
    } catch (err: any) {
      const msg = err.message || 'Erro ao emitir etiqueta';
      toast.error(msg);
    }
  };

  const handleRefreshAll = () => {
    refetch();
    refetchPending();
  };

  return (
    <AdminLayout>
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
            <Button variant="outline" onClick={handleRefreshAll} size="sm">
              <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
            <Button
              onClick={() => { setAddForm(EMPTY_FORM); setShowAddDialog(true); }}
              disabled={!settings?.hasToken}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Expedição Manual
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

        {/* ── Fila: Pedidos Prontos para Expedição ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="w-5 h-5 text-orange-500" />
              Fila de Expedição — Pedidos Prontos para Entrega
            </CardTitle>
            <CardDescription>
              Pedidos com status "Pronto para Entrega" que ainda não tiveram a etiqueta gerada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPending ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : !pendingOrders || pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <p className="text-sm">Nenhum pedido aguardando expedição.</p>
              </div>
            ) : (
              <div className="divide-y">
                {pendingOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center gap-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        Pedido #{order.orderNumber}
                        <span className="ml-2 text-xs text-muted-foreground">(ID: {order.id})</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.deliveryFullName || order.guestName || 'Destinatário não informado'}
                        {order.deliveryCity ? ` — ${order.deliveryCity}/${order.deliveryState}` : ''}
                      </p>
                      {order.shippingZipCode || order.deliveryZipCode ? (
                        <p className="text-xs text-muted-foreground">
                          CEP: {order.deliveryZipCode || order.shippingZipCode}
                        </p>
                      ) : null}
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 shrink-0">Pronto para Entrega</Badge>
                    <Button
                      size="sm"
                      onClick={() => handleSelectOrder(order)}
                      disabled={!settings?.hasToken}
                      className="bg-orange-500 hover:bg-orange-600 shrink-0"
                    >
                      <ArrowRight className="w-4 h-4 mr-1" /> Gerar Etiqueta
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Expedições já criadas ── */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Truck className="w-5 h-5 text-orange-500" />
            Expedições Criadas
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : !shipments || shipments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <Package className="w-10 h-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm text-center">
                  Nenhuma expedição criada ainda. Use a fila acima para gerar etiquetas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {shipments.map((shipment: any) => {
                const statusInfo = STATUS_LABELS[shipment.status] || { label: shipment.status, color: 'bg-gray-100 text-gray-700' };
                return (
                  <Card key={shipment.id}>
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">Pedido #{shipment.orderId}</p>
                        <p className="text-sm text-muted-foreground">
                          {shipment.companyName} — {shipment.serviceName}
                        </p>
                        {shipment.meOrderId && (
                          <p className="text-xs text-muted-foreground">ME Order: {shipment.meOrderId}</p>
                        )}
                        {shipment.trackingCode && (
                          <p className="text-xs font-mono text-blue-600">Rastreio: {shipment.trackingCode}</p>
                        )}
                      </div>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                      <div className="flex gap-2 shrink-0">
                        {shipment.status === 'cart' && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckout(shipment.id)}
                            disabled={checkoutMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 font-semibold"
                          >
                            {checkoutMutation.isPending
                              ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Processando...</>
                              : <><CreditCard className="w-4 h-4 mr-1" /> Pagar e Emitir</>}
                          </Button>
                        )}
                        {shipment.labelUrl && (
                          <Button
                            size="sm"
                            onClick={() => window.open(shipment.labelUrl!, '_blank')}
                            className="bg-orange-500 hover:bg-orange-600 font-semibold"
                          >
                            <Tag className="w-4 h-4 mr-1" /> Imprimir Etiqueta
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {shipment.status === 'paid' && !shipment.labelUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => refetch()}
                            title="A etiqueta pode levar alguns segundos para ficar disponível"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" /> Buscar Etiqueta
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Dialog Nova Expedição */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {addForm.orderId
                  ? `Gerar Etiqueta — Pedido #${addForm.orderId}`
                  : 'Nova Expedição Manual'}
              </DialogTitle>
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
                  <Label>CPF / CNPJ <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={addForm.recipientDocument}
                    onChange={setField('recipientDocument')}
                    className={!addForm.recipientDocument ? 'border-orange-400 bg-orange-50' : ''}
                  />
                  {!addForm.recipientDocument && (
                    <p className="text-xs text-orange-600">⚠️ CPF/CNPJ não encontrado. Preencha manualmente para evitar rejeição pela transportadora.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>E-mail <span className="text-red-500">*</span></Label>
                  <Input
                    type="email"
                    placeholder="cliente@email.com"
                    value={addForm.recipientEmail}
                    onChange={setField('recipientEmail')}
                    className={!addForm.recipientEmail ? 'border-orange-400 bg-orange-50' : ''}
                  />
                  {!addForm.recipientEmail && (
                    <p className="text-xs text-orange-600">⚠️ E-mail não encontrado. Preencha manualmente.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input placeholder="(11) 99999-9999" value={addForm.recipientPhone} onChange={setField('recipientPhone')} />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input placeholder="00000000" value={addForm.recipientCep} onChange={setField('recipientCep')} />
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
                  <Label>Valor Declarado (R$) <span className="text-xs text-gray-500">(pré-preenchido com o valor dos produtos)</span></Label>
                  <Input type="number" min="1" step="0.01" value={addForm.insuranceValue} onChange={setField('insuranceValue')} />
                  <p className="text-xs text-gray-500">Usado como base para seguro obrigatório da transportadora.</p>
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
    </AdminLayout>
  );
}
