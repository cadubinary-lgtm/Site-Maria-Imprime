import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";

const SEGMENTS = [
  { id: "alimentacao", label: "Alimentação", icon: "🍕" },
  { id: "beleza", label: "Beleza & Saúde", icon: "💄" },
  { id: "varejo", label: "Varejo", icon: "🛍️" },
  { id: "servicos", label: "Serviços", icon: "🔧" },
];

export default function ClientCatalog() {
  const [activeSegment, setActiveSegment] = useState("alimentacao");
  
  const { data: products, isLoading } = trpc.products.getBySegment.useQuery(
    { segment: activeSegment },
    { enabled: !!activeSegment }
  );

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
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">GP</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Catálogo</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Escolha seu Segmento</h2>
          
          <Tabs value={activeSegment} onValueChange={setActiveSegment} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {SEGMENTS.map((segment) => (
                <TabsTrigger key={segment.id} value={segment.id}>
                  <span className="mr-2">{segment.icon}</span>
                  <span className="hidden sm:inline">{segment.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {SEGMENTS.map((segment) => (
              <TabsContent key={segment.id} value={segment.id} className="mt-8">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">{segment.label}</h3>
                  <p className="text-gray-600">Produtos disponíveis para {segment.label.toLowerCase()}</p>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <Card key={product.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-40 object-cover rounded-lg mb-4"
                            />
                          ) : (
                            <div className="w-full h-40 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                              <span className="text-gray-400">Sem imagem</span>
                            </div>
                          )}
                          <CardTitle>{product.name}</CardTitle>
                          <CardDescription>
                            R$ {parseFloat(product.price.toString()).toFixed(2)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {product.description || "Sem descrição disponível"}
                          </p>
                          <Link href={`/produto/${product.id}`}>
                            <Button className="w-full">Ver Detalhes</Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">
                      Nenhum produto disponível neste segmento no momento.
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
