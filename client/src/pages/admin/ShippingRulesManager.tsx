import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2, Calculator, Truck, Clock, Package,
  AlertCircle, Plus, Pencil, Trash2, MapPin, Store, Bike, Car,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface QuoteResult {
  id: string | number;
  name: string;
  company: string;
  price: number;
  deliveryDays: number;
  isFixed?: boolean;
  fixedType?: string;
}

interface LocalRule {
  id: number;
  neighborhood: string;
  stateAbbr: string;
  cepStart: string;
  cepEnd: string;
  deliveryType: 'moto' | 'carro';
  price: number;
  deliveryDays: number;
  description: string | null;
  isActive: boolean;
}

const emptyForm = {
  neighborhood: '',
  stateAbbr: '',
  cepStart: '',
  cepEnd: '',
  deliveryType: 'moto' as 'moto' | 'carro',
  price: '',
  deliveryDays: '1',
  description: '',
  isActive: true,
};

export function ShippingRulesManager() {
  // ── Simulador ──────────────────────────────────────────────────────────────
  const [destinationCep, setDestinationCep] = useState('');
  const [weight, setWeight] = useState('1');
  const [height, setHeight] = useState('5');
  const [width, setWidth] = useState('30');
  const [length, setLength] = useState('40');
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateMutation = trpc.logistics.shipping.calculate.useMutation();
  const { data: settings } = trpc.logistics.settings.get.useQuery();

  // ── Regras de Entrega Local ────────────────────────────────────────────────
  const { data: localRules, refetch: refetchRules } = trpc.logistics.localRules.list.useQuery();
  const createRule = trpc.logistics.localRules.create.useMutation();
  const updateRule = trpc.logistics.localRules.update.useMutation();
  const deleteRule = trpc.logistics.localRules.delete.useMutation();

  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const handleCalculate = async () => {
    const cep = destinationCep.replace(/\D/g, '');
    if (cep.length !== 8) { toast.error('CEP de destino inválido. Use 8 dígitos.'); return; }
    try {
      const result = await calculateMutation.mutateAsync({
        destinationCep: cep,
        weight: parseFloat(weight) || 1,
        height: parseFloat(height) || 5,
        width: parseFloat(width) || 30,
        length: parseFloat(length) || 40,
      });
      setQuotes(result as QuoteResult[]);
      setHasCalculated(true);
      if (result.length === 0) toast.warning('Nenhuma opção de frete disponível para este CEP.');
      else toast.success(`${result.length} opção(ões) de frete encontrada(s)`);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao calcular frete');
    }
  };

  const formatCep = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowDialog(true);
  };

  const openEdit = (rule: LocalRule) => {
    setEditingId(rule.id);
    setForm({
      neighborhood: rule.neighborhood,
      stateAbbr: rule.stateAbbr,
      cepStart: rule.cepStart,
      cepEnd: rule.cepEnd,
      deliveryType: rule.deliveryType,
      price: String(rule.price),
      deliveryDays: String(rule.deliveryDays),
      description: rule.description ?? '',
      isActive: rule.isActive,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.neighborhood.trim()) { toast.error('Informe o bairro/região'); return; }
    if (!form.stateAbbr.trim() || form.stateAbbr.length !== 2) { toast.error('Informe a UF (2 letras)'); return; }
    const cepStartClean = form.cepStart.replace(/\D/g, '');
    const cepEndClean = form.cepEnd.replace(/\D/g, '');
    if (cepStartClean.length !== 8) { toast.error('CEP Inicial deve ter 8 dígitos'); return; }
    if (cepEndClean.length !== 8) { toast.error('CEP Final deve ter 8 dígitos'); return; }
    if (cepStartClean > cepEndClean) { toast.error('CEP Inicial deve ser menor ou igual ao CEP Final'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { toast.error('Informe um valor de frete válido'); return; }

    try {
      if (editingId) {
        await updateRule.mutateAsync({
          id: editingId,
          neighborhood: form.neighborhood.trim(),
          stateAbbr: form.stateAbbr.trim().toUpperCase(),
          cepStart: cepStartClean,
          cepEnd: cepEndClean,
          deliveryType: form.deliveryType,
          price,
          deliveryDays: parseInt(form.deliveryDays) || 1,
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        });
        toast.success('Regra atualizada com sucesso');
      } else {
        await createRule.mutateAsync({
          neighborhood: form.neighborhood.trim(),
          stateAbbr: form.stateAbbr.trim().toUpperCase(),
          cepStart: cepStartClean,
          cepEnd: cepEndClean,
          deliveryType: form.deliveryType,
          price,
          deliveryDays: parseInt(form.deliveryDays) || 1,
          description: form.description.trim() || undefined,
          isActive: form.isActive,
        });
        toast.success('Regra criada com sucesso');
      }
      setShowDialog(false);
      refetchRules();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar regra');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir esta regra de entrega local?')) return;
    try {
      await deleteRule.mutateAsync({ id });
      toast.success('Regra excluída');
      refetchRules();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir');
    }
  };

  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));

  const formatCepDisplay = (cep: string) =>
    cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;

  const getQuoteIcon = (q: QuoteResult) => {
    if (q.fixedType === 'pickup') return <Store className="w-5 h-5 text-green-600" />;
    if (q.fixedType === 'local') {
      const isCarro = q.name?.toLowerCase().includes('carro');
      return isCarro
        ? <Car className="w-5 h-5 text-blue-500" />
        : <Bike className="w-5 h-5 text-orange-500" />;
    }
    return <Truck className="w-5 h-5 text-blue-500" />;
  };

  const getDeliveryTypeLabel = (type: 'moto' | 'carro') =>
    type === 'moto' ? 'Moto' : 'Carro';

  const getDeliveryTypeIcon = (type: 'moto' | 'carro') =>
    type === 'moto'
      ? <Bike className="w-4 h-4 text-orange-500" />
      : <Car className="w-4 h-4 text-blue-500" />;

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 max-w-4xl">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-orange-500" />
            Regras de Frete
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie bairros com entrega local (Moto ou Carro) por faixa de CEP e simule cotações via Melhor Envio.
          </p>
        </div>

        {/* ── Seção 1: Bairros com Entrega Local ──────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                Entrega Local — Bairros e Regiões
              </CardTitle>
              <CardDescription>
                Quando o CEP do cliente estiver dentro da faixa configurada, as opções de entrega local
                (Moto e/ou Carro) aparecerão automaticamente com o valor e prazo configurados.
                Você pode cadastrar a mesma faixa de CEP duas vezes — uma para Moto e outra para Carro.
              </CardDescription>
            </div>
            <Button size="sm" onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 shrink-0">
              <Plus className="w-4 h-4 mr-1" /> Adicionar Regra
            </Button>
          </CardHeader>
          <CardContent>
            {!localRules || localRules.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
                <MapPin className="w-10 h-10 opacity-30" />
                <p>Nenhuma regra de entrega local cadastrada ainda.</p>
                <p className="text-xs text-center max-w-xs">
                  Cadastre bairros como "Centro", "Tamoios" ou "Peró" com a faixa de CEP correspondente
                  e o valor do frete para Moto e/ou Carro.
                </p>
                <Button variant="outline" size="sm" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-1" /> Cadastrar primeira regra
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {localRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex items-center gap-2">
                        {getDeliveryTypeIcon(rule.deliveryType)}
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {rule.neighborhood} — {rule.stateAbbr}
                            <Badge
                              variant="outline"
                              className={`text-xs ${rule.deliveryType === 'moto' ? 'border-orange-400 text-orange-600' : 'border-blue-400 text-blue-600'}`}
                            >
                              {getDeliveryTypeLabel(rule.deliveryType)}
                            </Badge>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            CEP: {formatCepDisplay(rule.cepStart)} até {formatCepDisplay(rule.cepEnd)} ·{' '}
                            {rule.deliveryDays === 0 ? 'Mesmo dia' : `${rule.deliveryDays} dia(s) útil(eis)`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">{formatCurrency(rule.price)}</span>
                      {!rule.isActive && <Badge variant="secondary">Inativo</Badge>}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(rule as LocalRule)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Seção 2: Simulador de Frete ─────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-4 h-4 text-orange-500" />
              Simulador de Frete (Melhor Envio + Opções Fixas)
            </CardTitle>
            <CardDescription>
              CEP de origem: <strong>{settings?.originCep ? settings.originCep.replace(/(\d{5})(\d{3})/, '$1-$2') : 'Não configurado'}</strong>
              {settings?.sandbox && <Badge variant="secondary" className="ml-2">Sandbox</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!settings?.hasToken && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Token do Melhor Envio não configurado. O simulador mostrará apenas as opções fixas (Retirada e Entrega Local).
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="destCep">CEP de Destino *</Label>
              <Input
                id="destCep"
                placeholder="00000-000"
                value={destinationCep}
                onChange={(e) => setDestinationCep(formatCep(e.target.value))}
                maxLength={9}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'weight', label: 'Peso (kg)', val: weight, set: setWeight, min: '0.1', step: '0.1' },
                { id: 'height', label: 'Altura (cm)', val: height, set: setHeight, min: '1' },
                { id: 'width', label: 'Largura (cm)', val: width, set: setWidth, min: '1' },
                { id: 'length', label: 'Comprimento (cm)', val: length, set: setLength, min: '1' },
              ].map(({ id, label, val, set, min, step }) => (
                <div key={id} className="space-y-2">
                  <Label htmlFor={id}>{label}</Label>
                  <Input id={id} type="number" min={min} step={step} value={val} onChange={(e) => set(e.target.value)} />
                </div>
              ))}
            </div>

            <Button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {calculateMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculando...</>
                : <><Calculator className="w-4 h-4 mr-2" /> Simular Frete</>}
            </Button>

            {hasCalculated && (
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {quotes.length} opção(ões) disponível(is)
                </p>
                {quotes.length === 0 ? (
                  <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground">
                    <Package className="w-8 h-8 opacity-30" />
                    <p>Nenhuma opção disponível para este CEP.</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {quotes.map((quote, idx) => (
                      <div key={`${quote.id}-${idx}`} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center shrink-0">
                          {getQuoteIcon(quote)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{quote.company}</p>
                          <p className="text-xs text-muted-foreground truncate">{quote.name}</p>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
                          <Clock className="w-3 h-3" />
                          {quote.deliveryDays === 0 ? 'Mesmo dia' : `${quote.deliveryDays}d úteis`}
                        </div>
                        <div className="font-bold text-green-600 shrink-0">
                          {quote.price === 0 ? 'Grátis' : formatCurrency(quote.price)}
                        </div>
                        {quote.isFixed && <Badge variant="outline" className="text-xs shrink-0">Fixo</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Dialog: Criar / Editar Regra ──────────────────────────────────── */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar Regra de Entrega Local' : 'Nova Regra de Entrega Local'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Bairro + UF */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label>Bairro / Região *</Label>
                <Input
                  placeholder="Ex: Centro, Tamoios, Peró"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>UF *</Label>
                <Input
                  placeholder="RJ"
                  maxLength={2}
                  value={form.stateAbbr}
                  onChange={(e) => setForm({ ...form, stateAbbr: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            {/* Faixa de CEP */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>CEP Inicial *</Label>
                <Input
                  placeholder="28900000"
                  maxLength={9}
                  value={form.cepStart.length > 5 ? `${form.cepStart.slice(0, 5)}-${form.cepStart.slice(5)}` : form.cepStart}
                  onChange={(e) => setForm({ ...form, cepStart: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP Final *</Label>
                <Input
                  placeholder="28900999"
                  maxLength={9}
                  value={form.cepEnd.length > 5 ? `${form.cepEnd.slice(0, 5)}-${form.cepEnd.slice(5)}` : form.cepEnd}
                  onChange={(e) => setForm({ ...form, cepEnd: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                />
              </div>
            </div>

            {/* Tipo de Entrega */}
            <div className="space-y-2">
              <Label>Tipo de Entrega *</Label>
              <Select
                value={form.deliveryType}
                onValueChange={(v: 'moto' | 'carro') => setForm({ ...form, deliveryType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de entrega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="moto">
                    <span className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-orange-500" />
                      Entrega Local - Moto
                    </span>
                  </SelectItem>
                  <SelectItem value="carro">
                    <span className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-blue-500" />
                      Entrega Local - Carro
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Você pode cadastrar a mesma faixa de CEP duas vezes (uma para Moto e outra para Carro)
                com valores diferentes.
              </p>
            </div>

            {/* Valor + Prazo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor do Frete (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="15.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo (dias úteis)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.deliveryDays}
                  onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label>Descrição (exibida ao cliente)</Label>
              <Input
                placeholder={`Entrega Local - ${form.deliveryType === 'moto' ? 'Moto' : 'Carro'}`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Se deixar em branco, usará "Entrega Local - {form.deliveryType === 'moto' ? 'Moto' : 'Carro'}" automaticamente.
              </p>
            </div>

            {/* Ativo */}
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label>Regra ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={createRule.isPending || updateRule.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {(createRule.isPending || updateRule.isPending)
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : 'Salvar Regra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
