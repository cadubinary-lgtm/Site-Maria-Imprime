import { useState } from "react";
import { CalculadoraGrafica, useCalculadoraGrafica } from "@/components/CalculadoraGrafica";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function CalculadoraDemo() {
  const { width, height, area, setWidth, setHeight } = useCalculadoraGrafica();
  const [precoBase] = useState(100); // R$ 100 base
  const [precoFinal, setPrecoFinal] = useState(precoBase);

  // Simular cálculo de preço baseado em área
  const handleAreaChange = (newArea: number) => {
    if (newArea > 0) {
      const preco = precoBase * newArea;
      setPrecoFinal(Math.round(preco * 100) / 100);
    } else {
      setPrecoFinal(precoBase);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calculadora */}
          <Card>
            <CardHeader>
              <CardTitle>Calculadora Gráfica Inteligente</CardTitle>
              <CardDescription>
                Digite números sem ponto ou vírgula. Valor mantém 2 casas decimais automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <CalculadoraGrafica
                  label="Largura (m)"
                  value={width}
                  onChange={setWidth}
                  pairValue={height}
                  onAreaChange={handleAreaChange}
                  placeholder="0.00"
                />

                <CalculadoraGrafica
                  label="Altura (m)"
                  value={height}
                  onChange={setHeight}
                  pairValue={width}
                  onAreaChange={handleAreaChange}
                  placeholder="0.00"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">Área Total (m²)</p>
                <p className="text-3xl font-bold text-blue-600">{area.toFixed(2)}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-2">Preço Estimado</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {precoFinal.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Base: R$ {precoBase.toFixed(2)} × {area.toFixed(2)}m²
                </p>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-sm font-semibold mb-2">Como Usar:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>✓ Digite apenas números</li>
                  <li>✓ Backspace para apagar dígito</li>
                  <li>✓ Delete para limpar tudo</li>
                  <li>✓ Valor sempre com 2 casas decimais</li>
                  <li>✓ Funciona em mobile e desktop</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card>
            <CardHeader>
              <CardTitle>Exemplos de Digitação</CardTitle>
              <CardDescription>
                Veja como a calculadora funciona
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-mono">Digitou: 1</p>
                  <p className="text-sm text-gray-600">Resultado: 0.01</p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-mono">Digitou: 1, 2</p>
                  <p className="text-sm text-gray-600">Resultado: 0.12</p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-mono">Digitou: 1, 2, 3</p>
                  <p className="text-sm text-gray-600">Resultado: 1.23</p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-mono">Digitou: 1, 2, 3, 4</p>
                  <p className="text-sm text-gray-600">Resultado: 12.34</p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm font-mono">Digitou: 1, 2, 3, 4, 5</p>
                  <p className="text-sm text-gray-600">Resultado: 123.45</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-2">Backspace:</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">123.45 → 12.34 → 1.23 → 0.12 → 0.01 → 0.00</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900 mb-1">Formato Interno:</p>
                <p className="text-xs text-yellow-800">
                  Internamente: 1234 = 12.34
                  <br />
                  Fórmula: valor_real = numero_digitado / 100
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Técnicas */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Informações Técnicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Largura Interna</p>
                <p className="text-lg font-mono text-gray-900">{width}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Altura Interna</p>
                <p className="text-lg font-mono text-gray-900">{height}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Área Calculada</p>
                <p className="text-lg font-mono text-gray-900">{area}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
