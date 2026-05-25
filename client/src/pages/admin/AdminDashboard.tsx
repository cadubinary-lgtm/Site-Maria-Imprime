import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { ProductVariationManager } from "@/components/ProductVariationManager";



const DEFAULT_DELIVERY_OPTIONS = [
  { name: 'Prazo Normal', daysToDeliver: 5, pricePerM2: 0, isActive: true },
  { name: '24 Horas', daysToDeliver: 1, pricePerM2: 10, isActive: true },
  { name: 'Mesmo Dia', daysToDeliver: 0, pricePerM2: 20, isActive: true },
];

export default function AdminDashboard() {
  const [deliveryOptions, setDeliveryOptions] = useState(DEFAULT_DELIVERY_OPTIONS);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    segment: "",
    imageUrl: "",
    calculationType: "unidade",
    pricePerM2: "",
    minWidth: "",
    maxWidth: "",
    minHeight: "",
    maxHeight: "",
  });

  const { data: orders, isLoading: ordersLoading } = trpc.admin.getAllOrders.useQuery();
  const createProductMutation = trpc.admin.createProduct.useMutation();
  const createDeliveryOptionMutation = trpc.deliveryOptions.create.useMutation();

  // Carregar segmentos dinamicamente do banco
  const { data: segmentsData, isLoading: segmentsLoading } = trpc.segments.getAll.useQuery();
  const SEGMENTS = useMemo(() => {
    if (!segmentsData || segmentsData.length === 0) return [];
    return segmentsData.map((seg: any) => ({
      id: seg.slug,
      label: `${seg.icon || "📦"} ${seg.name}`,
    }));
  }, [segmentsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações obrigatórias
    if (!formData.name.trim()) {
      toast.error("Nome do produto é obrigatório");
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Preço é obrigatório e deve ser maior que 0");
      return;
    }
    
    if (!formData.calculationType) {
      toast.error("Tipo de cobrança é obrigatório");
      return;
    }
    
    if (formData.calculationType === "m2") {
      if (!formData.pricePerM2 || parseFloat(formData.pricePerM2) <= 0) {
        toast.error("Preço por m² é obrigatório e deve ser maior que 0");
        return;
      }
      if (!formData.minWidth || parseFloat(formData.minWidth) <= 0) {
        toast.error("Largura mínima é obrigatória e deve ser maior que 0");
        return;
      }
      if (!formData.maxWidth || parseFloat(formData.maxWidth) <= 0) {
        toast.error("Largura máxima é obrigatória e deve ser maior que 0");
        return;
      }
      if (!formData.minHeight || parseFloat(formData.minHeight) <= 0) {
        toast.error("Altura mínima é obrigatória e deve ser maior que 0");
        return;
      }
      if (!formData.maxHeight || parseFloat(formData.maxHeight) <= 0) {
        toast.error("Altura máxima é obrigatória e deve ser maior que 0");
        return;
      }
      if (parseFloat(formData.minWidth) >= parseFloat(formData.maxWidth)) {
        toast.error("Largura máxima deve ser maior que a mínima");
        return;
      }
      if (parseFloat(formData.minHeight) >= parseFloat(formData.maxHeight)) {
        toast.error("Altura máxima deve ser maior que a mínima");
        return;
      }
    }
    
        try {
      const result = await createProductMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        segment: formData.segment,
        imageUrl: formData.imageUrl,
        calculationType: formData.calculationType as "m2" | "metro_linear" | "pacote" | "unidade",
        pricePerM2: formData.calculationType === "m2" ? formData.pricePerM2 : undefined,
        minWidth: formData.calculationType === "m2" ? formData.minWidth : undefined,
        maxWidth: formData.calculationType === "m2" ? formData.maxWidth : undefined,
        minHeight: formData.calculationType === "m2" ? formData.minHeight : undefined,
        maxHeight: formData.calculationType === "m2" ? formData.maxHeight : undefined,
      });
      // Salvar prazos de produção ativos
      const activeOptions = deliveryOptions.filter(opt => opt.isActive);
      if (activeOptions.length > 0 && (result as any)?.id) {
        try {
          await Promise.all(
            activeOptions.map((opt, idx) =>
              createDeliveryOptionMutation.mutateAsync({
                productId: (result as any).id,
                name: opt.name,
                daysToDeliver: opt.daysToDeliver,
                pricePerM2: opt.pricePerM2,
                isActive: true,
                order: idx,
              })
            )
          );
        } catch (e) {
          console.error('Erro ao criar prazos:', e);
        }
      }
      toast.success("Produto criado com sucesso!");
      setFormData({
        name: "",
        description: "",
        price: "",
        segment: "",
        imageUrl: "",
        calculationType: "unidade",
        pricePerM2: "",
        minWidth: "",
        maxWidth: "",
        minHeight: "",
        maxHeight: "",
      });
      setDeliveryOptions(DEFAULT_DELIVERY_OPTIONS);
    } catch (error) {
      toast.error("Erro ao criar produto");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">AD</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <Tabs defaultValue="produtos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="variações">Gerenciar Variações</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>

          {/* Produtos Tab */}
          <TabsContent value="produtos" className="mt-8">
            <div className="mb-6 flex flex-wrap gap-3">
              <Link href="/admin/produtos">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Gerenciar Produtos Existentes
                </Button>
              </Link>
              <Link href="/admin/clientes-loja">
                <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                  Clientes da Loja
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Produto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Produto</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Adesivo Brilho"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva o produto"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Preço (R$)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="segment">Segmento</Label>
                      <Select
                        value={formData.segment}
                        onValueChange={(value) => setFormData({ ...formData, segment: value })}
                        disabled={segmentsLoading}
                      >
                        <SelectTrigger id="segment">
                          <SelectValue placeholder={segmentsLoading ? "Carregando..." : "Selecione um segmento"} />
                        </SelectTrigger>
                        <SelectContent>
                          {SEGMENTS.map((seg) => (
                            <SelectItem key={seg.id} value={seg.id}>
                              {seg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="imageUrl">URL da Imagem</Label>
                      <Input
                        id="imageUrl"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    {/* Tipo de Cobrança */}
                    <div>
                      <Label htmlFor="calculationType">Tipo de Cobrança</Label>
                      <Select value={formData.calculationType} onValueChange={(value) => setFormData({ ...formData, calculationType: value })}>
                        <SelectTrigger id="calculationType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unidade">Unidade</SelectItem>
                          <SelectItem value="m2">m² (Metro Quadrado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Campos condicionais para m² */}
                    {formData.calculationType === "m2" && (
                      <>
                        <div>
                          <Label htmlFor="pricePerM2">Preço por m² (R$)</Label>
                          <Input
                            id="pricePerM2"
                            type="number"
                            step="0.01"
                            value={formData.pricePerM2}
                            onChange={(e) => setFormData({ ...formData, pricePerM2: e.target.value })}
                            placeholder="45.00"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="minWidth">Largura Mínima (m)</Label>
                            <Input
                              id="minWidth"
                              type="number"
                              step="0.01"
                              value={formData.minWidth}
                              onChange={(e) => setFormData({ ...formData, minWidth: e.target.value })}
                              placeholder="0.10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="maxWidth">Largura Máxima (m)</Label>
                            <Input
                              id="maxWidth"
                              type="number"
                              step="0.01"
                              value={formData.maxWidth}
                              onChange={(e) => setFormData({ ...formData, maxWidth: e.target.value })}
                              placeholder="5.00"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor="minHeight">Altura Mínima (m)</Label>
                            <Input
                              id="minHeight"
                              type="number"
                              step="0.01"
                              value={formData.minHeight}
                              onChange={(e) => setFormData({ ...formData, minHeight: e.target.value })}
                              placeholder="0.10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="maxHeight">Altura Máxima (m)</Label>
                            <Input
                              id="maxHeight"
                              type="number"
                              step="0.01"
                              value={formData.maxHeight}
                              onChange={(e) => setFormData({ ...formData, maxHeight: e.target.value })}
                              placeholder="5.00"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Prazos de Produção */}
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-bold text-gray-800">Prazos de Produção</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-orange-400 text-orange-600 hover:bg-orange-50"
                          onClick={() => setDeliveryOptions(prev => [
                            ...prev,
                            { name: 'Novo Prazo', daysToDeliver: 3, pricePerM2: 0, isActive: true }
                          ])}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Novo Prazo
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {deliveryOptions.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border">
                            <input
                              type="checkbox"
                              checked={option.isActive}
                              onChange={(e) => {
                                const updated = [...deliveryOptions];
                                updated[idx] = { ...updated[idx], isActive: e.target.checked };
                                setDeliveryOptions(updated);
                              }}
                              className="w-4 h-4 flex-shrink-0"
                            />
                            <Input
                              value={option.name}
                              onChange={(e) => {
                                const updated = [...deliveryOptions];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setDeliveryOptions(updated);
                              }}
                              className="h-7 text-xs flex-1 min-w-0"
                              placeholder="Nome do prazo"
                            />
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Input
                                type="number"
                                value={option.daysToDeliver}
                                onChange={(e) => {
                                  const updated = [...deliveryOptions];
                                  updated[idx] = { ...updated[idx], daysToDeliver: parseInt(e.target.value) || 0 };
                                  setDeliveryOptions(updated);
                                }}
                                className="w-12 h-7 text-xs"
                                placeholder="dias"
                                title="Dias úteis"
                              />
                              <span className="text-xs text-gray-400">d</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={option.pricePerM2}
                                onChange={(e) => {
                                  const updated = [...deliveryOptions];
                                  updated[idx] = { ...updated[idx], pricePerM2: parseFloat(e.target.value) || 0 };
                                  setDeliveryOptions(updated);
                                }}
                                className="w-14 h-7 text-xs"
                                placeholder="R$/m²"
                                title="Taxa adicional por m²"
                              />
                              <button
                                type="button"
                                onClick={() => setDeliveryOptions(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-400 hover:text-red-600 p-0.5"
                                title="Remover prazo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {deliveryOptions.length === 0 && (
                          <p className="text-xs text-gray-400 text-center py-2">Nenhum prazo. Clique em "+ Novo Prazo".</p>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">d = dias úteis • R$/m² = taxa adicional por metro quadrado</p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createProductMutation.isPending}
                    >
                      {createProductMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Produto"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Products List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Produtos Cadastrados</CardTitle>
                    <CardDescription>Lista de todos os produtos ativos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Funcionalidade de listagem de produtos será implementada em breve.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Variações Tab */}
          <TabsContent value="variações" className="mt-8">
            <ProductVariationManager />
          </TabsContent>

          {/* Pedidos Tab */}
          <TabsContent value="pedidos" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Pedidos</CardTitle>
                <CardDescription>Visualize e gerencie todos os pedidos</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : orders && orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Pedido</th>
                          <th className="text-left py-2 px-4">Cliente</th>
                          <th className="text-left py-2 px-4">Valor</th>
                          <th className="text-left py-2 px-4">Status</th>
                          <th className="text-left py-2 px-4">Pagamento</th>
                          <th className="text-left py-2 px-4">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4 font-semibold">{order.orderNumber}</td>
                            <td className="py-2 px-4">Cliente #{order.clientId}</td>
                            <td className="py-2 px-4">R$ {parseFloat(order.totalPrice.toString()).toFixed(2)}</td>
                            <td className="py-2 px-4 capitalize">{order.status}</td>
                            <td className="py-2 px-4 capitalize">{order.paymentStatus}</td>
                            <td className="py-2 px-4">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">Nenhum pedido encontrado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
