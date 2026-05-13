import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";

/**
 * ⚠️ DEPRECATED: Esta página foi consolidada em /admin/vincular-atributos
 * 
 * Motivo: Arquitetura centralizada
 * - Precificação agora fica no vínculo produto↔atributo
 * - Não no atributo global
 * - Permite preços diferentes por produto
 * 
 * Redirecionando para /admin/vincular-atributos...
 */
export default function AdminAttributePricing() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Redirecionar após 2 segundos
    const timer = setTimeout(() => {
      navigate("/admin/vincular-atributos");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            Página Descontinuada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-yellow-700">
              A página <strong>/admin/precos-atributos</strong> foi consolidada em uma arquitetura mais profissional e escalável.
            </p>
            <p className="text-sm text-yellow-700">
              <strong>Mudança:</strong> A precificação agora está centralizada no vínculo <strong>produto ↔ atributo</strong>, permitindo preços diferentes para o mesmo atributo em produtos diferentes.
            </p>
            <p className="text-sm text-yellow-700">
              <strong>Exemplo:</strong> Laminação Fosca pode custar R$15 em Cartão, R$40 em Folder e R$120 em Catálogo.
            </p>
          </div>

          <div className="bg-white p-4 rounded border border-yellow-200">
            <p className="text-sm font-medium text-yellow-900 mb-2">O que mudou?</p>
            <ul className="text-sm text-yellow-700 space-y-1 ml-4 list-disc">
              <li>Tudo está em <strong>/admin/vincular-atributos</strong></li>
              <li>Selecione um produto</li>
              <li>Vincule atributos com preço, prazo e peso</li>
              <li>Tudo em uma única tela</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => window.location.href = "/admin/vincular-atributos"}
              className="gap-2 bg-orange-600 hover:bg-orange-700"
            >
              Ir para Vincular Atributos
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-yellow-600 pt-2">
            Redirecionando automaticamente em 2 segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
