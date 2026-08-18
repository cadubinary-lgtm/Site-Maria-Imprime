import { useState } from "react";
import { CalculadoraGrafica, useCalculadoraGrafica } from "@/components/CalculadoraGrafica";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Calculator, Info, Ruler } from "lucide-react";

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
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-pink-50 hover:text-pink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Voltar ao início
        </Link>

        <header className="mb-6 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-pink-600">Ferramenta de demonstração</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Calculadora gráfica</h1>
          <p className="mt-2 text-gray-600">Informe as medidas para acompanhar a área calculada e uma estimativa ilustrativa de valor.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Calculadora */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-pink-600" aria-hidden="true" />Defina as medidas</CardTitle>
              <CardDescription>
                Digite somente números. A calculadora posiciona automaticamente as duas casas decimais.
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

              <div className="rounded-xl border border-pink-200 bg-pink-50 p-4" aria-live="polite" aria-atomic="true">
                <p className="text-sm font-medium text-gray-700">Área total</p>
                <p className="mt-1 text-3xl font-bold text-pink-700">{area.toFixed(2)} <span className="text-lg">m²</span></p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" aria-live="polite" aria-atomic="true">
                <p className="text-sm font-medium text-gray-700">Estimativa de demonstração</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  R$ {precoFinal.toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Base: R$ {precoBase.toFixed(2)} × {area.toFixed(2)}m²
                </p>
                <p className="mt-1 text-xs text-gray-500">Este valor é apenas ilustrativo; o orçamento final depende das configurações do produto.</p>
              </div>

              <div className="rounded-xl bg-gray-100 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Info className="h-4 w-4 text-pink-600" aria-hidden="true" />Como usar</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  <li>Digite apenas números.</li>
                  <li>Use Backspace para apagar o último dígito.</li>
                  <li>Use Delete ou o botão de lixeira para limpar um campo.</li>
                  <li>Os valores aparecem sempre com duas casas decimais.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Informações */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5 text-pink-600" aria-hidden="true" />Exemplos de digitação</CardTitle>
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
        <Card className="mt-8 border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Resumo do cálculo</CardTitle>
            <CardDescription>Os valores abaixo acompanham as medidas informadas acima.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">Largura</p>
                <output className="text-lg font-mono text-gray-900">{(width / 100).toFixed(2)} m</output>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Altura</p>
                <output className="text-lg font-mono text-gray-900">{(height / 100).toFixed(2)} m</output>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">Área calculada</p>
                <output className="text-lg font-mono text-pink-700">{area.toFixed(2)} m²</output>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
