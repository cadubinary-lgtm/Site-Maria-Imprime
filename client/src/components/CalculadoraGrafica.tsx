import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface CalculadoraGraficaProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onAreaChange?: (area: number) => void;
  pairValue?: number;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Componente de Calculadora Gráfica Profissional
 * 
 * Funciona como uma calculadora financeira para medidas:
 * - Usuário digita apenas números (sem ponto ou vírgula)
 * - Valor sempre mantém 2 casas decimais
 * - Exemplo: digitar 1234 resulta em 12.34
 * - Backspace remove dígitos da direita para esquerda
 * - Preço atualiza em tempo real
 */
export function CalculadoraGrafica({
  label,
  value,
  onChange,
  onAreaChange,
  pairValue,
  placeholder = "0.00",
  disabled = false,
}: CalculadoraGraficaProps) {
  // Estado interno para controlar a entrada
  const [displayValue, setDisplayValue] = useState<string>(formatValue(value));
  const [internalValue, setInternalValue] = useState<number>(value);

  // Sincronizar quando o valor externo muda
  useEffect(() => {
    setInternalValue(value);
    setDisplayValue(formatValue(value));
  }, [value]);

  /**
   * Formata um número para exibição com 2 casas decimais
   * Exemplo: 1234 -> "12.34"
   */
  function formatValue(num: number): string {
    return (num / 100).toFixed(2);
  }

  /**
   * Converte valor exibido para número interno
   * Exemplo: "12.34" -> 1234
   */
  function parseDisplayValue(display: string): number {
    const cleaned = display.replace(/[^\d]/g, "");
    return parseInt(cleaned || "0", 10);
  }

  /**
   * Trata entrada de teclado - apenas números
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key;

    // Permitir apenas números, backspace, delete, tab, enter
    if (!/^\d$/.test(key) && !["Backspace", "Delete", "Tab", "Enter"].includes(key)) {
      e.preventDefault();
      return;
    }

    if (key === "Backspace") {
      e.preventDefault();
      handleBackspace();
      return;
    }

    if (key === "Delete") {
      e.preventDefault();
      handleClear();
      return;
    }
  }

  /**
   * Trata entrada de números
   */
  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    let inputValue = e.target.value;

    // Remover tudo que não é número
    inputValue = inputValue.replace(/[^\d]/g, "");

    // Limitar a 10 dígitos (99999999.99)
    if (inputValue.length > 10) {
      inputValue = inputValue.slice(0, 10);
    }

    // Se vazio, definir como 0
    if (inputValue === "") {
      inputValue = "0";
    }

    const numValue = parseInt(inputValue, 10);
    setInternalValue(numValue);
    setDisplayValue(formatValue(numValue));
    onChange(numValue);

    // Calcular área se houver outro valor
    if (onAreaChange && pairValue !== undefined) {
      const area = (numValue / 100) * (pairValue / 100);
      onAreaChange(Math.round(area * 100) / 100);
    }
  }

  /**
   * Implementa backspace - remove último dígito
   */
  function handleBackspace() {
    let current = internalValue.toString();

    if (current.length > 1) {
      current = current.slice(0, -1);
    } else {
      current = "0";
    }

    const numValue = parseInt(current, 10);
    setInternalValue(numValue);
    setDisplayValue(formatValue(numValue));
    onChange(numValue);

    // Recalcular área
    if (onAreaChange && pairValue !== undefined) {
      const area = (numValue / 100) * (pairValue / 100);
      onAreaChange(Math.round(area * 100) / 100);
    }
  }

  /**
   * Limpa o campo
   */
  function handleClear() {
    setInternalValue(0);
    setDisplayValue("0.00");
    onChange(0);

    if (onAreaChange) {
      onAreaChange(0);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative flex items-center gap-2">
        <Input
          id={label}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="text-right font-mono text-lg font-semibold pr-10"
        />
        {internalValue > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-1 h-8 w-8 p-0"
            title="Limpar (Delete)"
          >
            <Delete className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Digite números • Backspace para apagar • Delete para limpar
      </p>
    </div>
  );
}

/**
 * Hook para gerenciar múltiplas calculadoras e calcular área
 */
export function useCalculadoraGrafica() {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [area, setArea] = useState<number>(0);

  const handleWidthChange = (value: number) => {
    setWidth(value);
    const newArea = (value / 100) * (height / 100);
    setArea(Math.round(newArea * 100) / 100);
  };

  const handleHeightChange = (value: number) => {
    setHeight(value);
    const newArea = (width / 100) * (value / 100);
    setArea(Math.round(newArea * 100) / 100);
  };

  return {
    width,
    height,
    area,
    setWidth: handleWidthChange,
    setHeight: handleHeightChange,
    setArea,
  };
}
