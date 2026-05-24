import { useState } from "react";
import { FormCardDynamic } from "@/components/FormCardDynamic";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FormCardDynamicPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const createProductMutation = trpc.admin.createProduct.useMutation();

  const handleFormSubmit = async (formData: any) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Transformar dados do FormCardDynamic para o formato esperado pelo backend
      const productData = {
        name: formData.productName,
        description: formData.description,
        price: formData.basePrice.toString(),
        segment: "varejo" as const, // Categoria padrão para produtos gráficos
        imageUrl: "", // Será adicionado em uma próxima fase
      };

      // Salvar o produto usando o procedure existente
      await createProductMutation.mutateAsync(productData);

      // Sucesso
      setSuccessMessage(`Produto "${formData.productName}" criado com sucesso!`);
      setTimeout(() => setSuccessMessage(""), 5000);

      // TODO: Salvar variações, preços e configurações da calculadora em uma próxima fase
      console.log("Dados completos do formulário:", {
        product: productData,
        variations: formData.variations,
        pricingTiers: formData.pricingTiers,
        calculatorConfig: formData.calculatorConfig,
      });

    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      setErrorMessage(error?.message || "Erro ao criar produto gráfico");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">
            Criar Produto Gráfico
          </h1>
          <p className="text-lg text-slate-600">
            Configure um novo produto com variações, preços progressivos e calculadora automática
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Variações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Ilimitadas</div>
              <p className="text-xs text-slate-500 mt-1">Tipo de impressão, material, acabamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Preços Progressivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Dinâmicos</div>
              <p className="text-xs text-slate-500 mt-1">Defina preços por faixa de quantidade</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Calculadora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">Automática</div>
              <p className="text-xs text-slate-500 mt-1">Custos, margem e prazos</p>
            </CardContent>
          </Card>
        </div>

        {/* Form Card */}
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader>
            <CardTitle>Formulário de Produto</CardTitle>
            <CardDescription>
              Preencha todos os campos para criar um novo produto gráfico configurável
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormCardDynamic 
              onSubmit={handleFormSubmit}
            />
          </CardContent>
        </Card>

        {/* Status */}
        {isLoading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-blue-900">⏳ Salvando produto...</p>
            </CardContent>
          </Card>
        )}

        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <p className="text-green-900">✅ {successMessage}</p>
            </CardContent>
          </Card>
        )}

        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-900">❌ {errorMessage}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
