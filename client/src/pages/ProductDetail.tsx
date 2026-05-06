import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const [, params] = useRoute("/produto/:id");
  const productId = params?.id ? parseInt(params.id) : null;

  const [quantity, setQuantity] = useState(1);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: productId || 0 },
    { enabled: !!productId }
  );

  const createOrderMutation = trpc.orders.createOrder.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande (máximo 10MB)");
        return;
      }
      setArtFile(file);
    }
  };

  const handleCheckout = async () => {
    if (!product) return;

    if (!artFile) {
      toast.error("Por favor, envie o arquivo de arte");
      return;
    }

    setIsProcessing(true);

    try {
      // Simular upload de arquivo
      const artFileUrl = `https://example.com/arts/${Date.now()}-${artFile.name}`;
      const artFileKey = `arts/${Date.now()}-${artFile.name}`;

      await createOrderMutation.mutateAsync({
        productId: product.id,
        quantity,
        artFileUrl,
        artFileKey,
      });

      toast.success("Pedido criado com sucesso! Redirecionando...");
      setTimeout(() => {
        window.location.href = `/confirmacao/${product.name.replace(/\s+/g, '-')}-${Date.now()}`;
      }, 1500);
    } catch (error) {
      toast.error("Erro ao criar pedido");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!productId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Produto não encontrado</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
            <Link href="/catalogo">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Produto não encontrado</h1>
          </div>
        </header>
      </div>
    );
  }

  const totalPrice = parseFloat(product.price.toString()) * quantity;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/catalogo">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                <span className="text-gray-400 text-lg">Sem imagem disponível</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Produto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Segmento</p>
                  <p className="text-lg font-semibold capitalize">{product.segment}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Descrição</p>
                  <p className="text-gray-700">{product.description || "Sem descrição"}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Preço Unitário</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {parseFloat(product.price.toString()).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order Form */}
            <Card>
              <CardHeader>
                <CardTitle>Faça seu Pedido</CardTitle>
                <CardDescription>Escolha a quantidade e envie sua arte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="quantity">Quantidade</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      −
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="artFile">Arquivo de Arte (PDF, PNG, JPG)</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Input
                      id="artFile"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="artFile" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">
                          {artFile ? artFile.name : "Clique para enviar ou arraste um arquivo"}
                        </p>
                        <p className="text-xs text-gray-500">Máximo 10MB</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Subtotal ({quantity}x)</span>
                    <span className="font-semibold">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessing || !artFile}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    "Confirmar Pedido"
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Ao confirmar, você concorda com nossos termos de serviço.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
