import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Delete2 } from 'lucide-react';

interface CalculatorInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Componente de input numérico inteligente estilo calculadora
 * - Formata automaticamente para 2 casas decimais
 * - Aceita apenas números
 * - Bloqueia letras e caracteres especiais
 * - Permite backspace para apagar
 * - Retorna automaticamente para 0.00 se vazio
 */
export const CalculatorInput: React.FC<CalculatorInputProps> = ({
  label,
  value,
  onChange,
  unit = '',
  placeholder = '0.00',
  disabled = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>('0.00');

  // Sincronizar displayValue com value quando value mudar externamente
  useEffect(() => {
    setDisplayValue(formatValue(value));
  }, [value]);

  /**
   * Formata um número para o formato de exibição (com 2 casas decimais)
   */
  const formatValue = (num: number): string => {
    return (num / 100).toFixed(2);
  };

  /**
   * Converte valor digitado para número interno (sem ponto)
   * Exemplo: "12.34" -> 1234
   */
  const parseInputValue = (input: string): number => {
    // Remove tudo que não é número
    const cleaned = input.replace(/\D/g, '');
    // Se vazio, retorna 0
    if (!cleaned) return 0;
    // Converte para número
    return parseInt(cleaned, 10);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Bloquear letras e caracteres especiais (exceto números)
    input = input.replace(/[^\d]/g, '');

    // Se vazio, definir como 0.00
    if (!input) {
      setDisplayValue('0.00');
      onChange(0);
      return;
    }

    // Limitar a 10 dígitos (até 99999999.99)
    if (input.length > 10) {
      input = input.slice(0, 10);
    }

    // Converter para número interno
    const numericValue = parseInt(input, 10);

    // Atualizar display com formatação
    setDisplayValue(formatValue(numericValue));

    // Chamar onChange com valor interno
    onChange(numericValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir apenas números, backspace, delete, tab, enter
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
    const isNumber = /^\d$/.test(e.key);

    if (!isNumber && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleClear = () => {
    setDisplayValue('0.00');
    onChange(0);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`calculator-${label}`} className="text-sm font-medium">
        {label}
        {unit && <span className="text-gray-500 ml-1">({unit})</span>}
      </Label>
      <div className="relative">
        <Input
          id={`calculator-${label}`}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="font-mono text-right text-lg pr-10"
        />
        {value > 0 && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors"
            type="button"
            title="Limpar"
          >
            <Delete2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
