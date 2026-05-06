import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function OrderConfirmation() {
  const [, params] = useRoute("/confirmacao/:orderNumber");
  const orderNumber = params?.orderNumber;

  if (!orderNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Pedido não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">GP</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Gráfica Ponto Digital</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h2>
          <p className="text-gray-600">Seu pedido foi criado com sucesso.</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Número do Pedido</span>
              <Badge className="bg-green-600">{orderNumber}</Badge>
            </CardTitle>
            <CardDescription>
              Você receberá atualizações por email conforme o status do pedido mudar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Próximos Passos</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Seu pedido foi recebido e está aguardando processamento</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Nossa equipe de produção começará a trabalhar em breve</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Você receberá uma notificação quando o pedido for enviado</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>Acompanhe o status em "Meus Pedidos" a qualquer momento</span>
                </li>
              </ol>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Informações Importantes</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Seu arquivo de arte foi recebido com sucesso</li>
                <li>✓ O pagamento foi processado</li>
                <li>✓ Você receberá atualizações por email</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/meus-pedidos">
            <Button className="w-full" size="lg">
              Ver Meus Pedidos
            </Button>
          </Link>
          <Link href="/catalogo">
            <Button className="w-full" size="lg" variant="outline">
              Fazer Outro Pedido
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg border">
          <p className="text-sm text-gray-600 text-center">
            Dúvidas? Entre em contato conosco pelo email ou telefone disponível no site.
          </p>
        </div>
      </main>
    </div>
  );
}
