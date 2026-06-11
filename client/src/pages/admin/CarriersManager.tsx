import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Truck, AlertCircle, CheckCircle, Package } from 'lucide-react';

export function CarriersManager() {
  const { data: carriers, isLoading, refetch } = trpc.logistics.carriers.list.useQuery();
  const syncMutation = trpc.logistics.carriers.sync.useMutation();
  const toggleMutation = trpc.logistics.carriers.toggle.useMutation();

  const [toggling, setToggling] = useState<number | null>(null);

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      toast.success(`Sincronizado! ${result.created} novas, ${result.updated} atualizadas.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sincronizar transportadoras');
    }
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    setToggling(id);
    try {
      await toggleMutation.mutateAsync({ id, isActive });
      toast.success(`Transportadora ${isActive ? 'ativada' : 'desativada'}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar status');
    } finally {
      setToggling(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Truck className="w-6 h-6 text-orange-500" />
              Transportadoras
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie quais transportadoras do Melhor Envio estarão disponíveis para seus clientes.
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {syncMutation.isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sincronizando...</>
              : <><RefreshCw className="w-4 h-4 mr-2" /> Sincronizar com Melhor Envio</>}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : !carriers || carriers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Package className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-lg">Nenhuma transportadora cadastrada</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Clique em "Sincronizar com Melhor Envio" para importar as transportadoras disponíveis na sua conta.
                </p>
              </div>
              <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Certifique-se de que o Token de Acesso está configurado em <strong>Configurações</strong> antes de sincronizar.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {carriers.filter(c => c.isActive).length} de {carriers.length} transportadoras ativas
            </div>
            <div className="grid gap-4">
              {carriers.map((carrier) => (
                <Card key={carrier.id} className={carrier.isActive ? '' : 'opacity-60'}>
                  <CardContent className="flex items-center gap-4 py-4">
                    {carrier.logoUrl ? (
                      <img src={carrier.logoUrl} alt={carrier.name} className="w-12 h-12 object-contain rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Truck className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{carrier.name}</p>
                      <p className="text-sm text-muted-foreground">Código: {carrier.code}</p>
                    </div>
                    <Badge variant={carrier.isActive ? 'default' : 'secondary'}>
                      {carrier.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {toggling === carrier.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={carrier.isActive}
                          onCheckedChange={(v) => handleToggle(carrier.id, v)}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
