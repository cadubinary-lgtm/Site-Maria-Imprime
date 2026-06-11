import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Calculator, Truck, Clock, DollarSign, Package, AlertCircle } from 'lucide-react';

interface QuoteResult {
  id: number;
  name: string;
  company: string;
  price: number;
  deliveryDays: number;
  currency: string;
}

export function ShippingRulesManager() {
  const [destinationCep, setDestinationCep] = useState('');
  const [weight, setWeight] = useState('1');
  const [height, setHeight] = useState('5');
  const [width, setWidth] = useState('30');
  const [length, setLength] = useState('40');
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  const calculateMutation = trpc.logistics.shipping.calculate.useMutation();
  const { data: settings } = trpc.logistics.settings.get.useQuery();

  const handleCalculate = async () => {
    const cep = destinationCep.replace(/\D/g, '');
    if (cep.length !== 8) {
      toast.error('CEP de destino inválido. Use 8 dígitos.');
      return;
    }
    try {
      const result = await calculateMutation.mutateAsync({
        destinationCep: cep,
        weight: parseFloat(weight) || 1,
        height: parseFloat(height) || 5,
        width: parseFloat(width) || 30,
        length: parseFloat(length) || 40,
      });
      setQuotes(result);
      setHasCalculated(true);
      if (result.length === 0) {
        toast.warning('Nenhuma opção de frete disponível para este CEP.');
      } else {
        toast.success(`${result.length} opção(ões) de frete encontrada(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao calcular frete');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-6 h-6 text-orange-500" />
            Regras de Frete — Simulador
          </h1>
          <p className="text-muted-foreground mt-1">
            Simule o cálculo de frete via Melhor Envio API v2 para qualquer CEP de destino.
          </p>
        </div>

        {!settings?.hasToken && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Token do Melhor Envio não configurado. Acesse <strong>Configurações</strong> para salvar seu token antes de calcular fretes.
            </AlertDescription>
          </Alert>
        )}

        {settings?.hasToken && !settings?.originCep && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              CEP de origem não configurado. Acesse <strong>Configurações</strong> para definir o CEP de origem.
            </AlertDescription>
          </Alert>
        )}

        {/* Formulário de Cálculo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parâmetros do Pacote</CardTitle>
            <CardDescription>
              CEP de origem: <strong>{settings?.originCep ? settings.originCep.replace(/(\d{5})(\d{3})/, '$1-$2') : 'Não configurado'}</strong>
              {settings?.sandbox && <Badge variant="secondary" className="ml-2">Sandbox</Badge>}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destCep">CEP de Destino *</Label>
              <Input
                id="destCep"
                placeholder="00000-000"
                value={destinationCep}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                  const formatted = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
                  setDestinationCep(formatted);
                }}
                maxLength={9}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width">Largura (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  min="1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Comprimento (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  min="1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              disabled={calculateMutation.isPending || !settings?.hasToken}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {calculateMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculando...</>
                : <><Calculator className="w-4 h-4 mr-2" /> Calcular Frete</>}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        {hasCalculated && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {quotes.length > 0 ? `${quotes.length} opção(ões) disponível(is)` : 'Nenhuma opção disponível'}
            </h2>
            {quotes.length > 0 && (
              <div className="grid gap-3">
                {quotes.map((quote, idx) => (
                  <Card key={`${quote.id}-${idx}`} className="hover:border-orange-300 transition-colors">
                    <CardContent className="flex items-center gap-4 py-4">
                      <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{quote.company}</p>
                        <p className="text-sm text-muted-foreground">{quote.name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <Clock className="w-4 h-4" />
                        {quote.deliveryDays} dia{quote.deliveryDays !== 1 ? 's' : ''} útil{quote.deliveryDays !== 1 ? 'eis' : ''}
                      </div>
                      <div className="flex items-center gap-1 font-bold text-lg text-green-600">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(quote.price)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {quotes.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <Package className="w-10 h-10 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhuma transportadora disponível para este CEP com os parâmetros informados.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
