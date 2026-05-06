import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

const SEGMENTS: Array<{ id: "alimentacao" | "beleza" | "varejo" | "servicos"; label: string }> = [
  { id: "alimentacao", label: "Alimentação" },
  { id: "beleza", label: "Beleza & Saúde" },
  { id: "varejo", label: "Varejo" },
  { id: "servicos", label: "Serviços" },
];

export default function AdminDashboard() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    segment: "alimentacao",
    imageUrl: "",
  });

  const { data: orders, isLoading: ordersLoading } = trpc.admin.getAllOrders.useQuery();
  const createProductMutation = trpc.admin.createProduct.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createProductMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: formData.price,
        segment: formData.segment as "alimentacao" | "beleza" | "varejo" | "servicos",
        imageUrl: formData.imageUrl,
      });
      
      toast.success("Produto criado com sucesso!");
      setFormData({
        name: "",
        description: "",
        price: "",
        segment: "alimentacao",
        imageUrl: "",
      });
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          </TabsList>

          {/* Produtos Tab */}
          <TabsContent value="produtos" className="mt-8">
            <div className="mb-6">
              <Link href="/admin/produtos">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  Gerenciar Produtos Existentes
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
                      <Select value={formData.segment} onValueChange={(value) => setFormData({ ...formData, segment: value })}>
                        <SelectTrigger id="segment">
                          <SelectValue />
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
