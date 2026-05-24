import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle } from "lucide-react";

interface TooltipIncompatibilityProps {
  isDisabled: boolean;
  reason?: string;
  children: React.ReactNode;
}

export function TooltipIncompatibility({
  isDisabled,
  reason,
  children,
}: TooltipIncompatibilityProps) {
  if (!isDisabled) {
    return <>{children}</>;
  }

  const defaultReasons: Record<string, string> = {
    "Este acabamento não é compatível com o material selecionado.":
      "Este acabamento não é compatível com o material selecionado.",
    "Este atributo não é compatível com a categoria do produto.":
      "Este atributo não é compatível com a categoria do produto.",
    "Selecione um material primeiro.": "Selecione um material primeiro.",
    "Selecione um acabamento primeiro.": "Selecione um acabamento primeiro.",
  };

  const displayReason = reason || "Este atributo não está disponível para esta configuração.";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="opacity-50 cursor-not-allowed">
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent className="flex items-start gap-2 max-w-xs">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <div className="text-sm">
          <p className="font-semibold text-amber-900 mb-1">Atributo indisponível</p>
          <p className="text-amber-800">{displayReason}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
