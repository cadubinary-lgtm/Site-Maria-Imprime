/**
 * ========================================
 * AttributeCard Component
 * ========================================
 * Componente reutilizável para seleção visual de atributos
 * com cartões clicáveis, ícones e estados visuais
 */

import React, { useMemo } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttributeValue {
  id: number;
  value: string;
  priceModifier?: number;
}

interface AttributeCardProps {
  id: number;
  name: string;
  slug: string;
  values: AttributeValue[];
  selectedValue?: string | number;
  onSelect: (value: string) => void;
  isRequired?: boolean;
  isVisible?: boolean;
  isEnabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
  displayMode?: "select" | "cards"; // "select" para dropdown, "cards" para cartões clicáveis
}

const getAttributeIcon = (slug: string) => {
  const icons: Record<string, string> = {
    material: "📄",
    acabamento: "✨",
    ilhos: "⭕",
    bastao: "📏",
    laminacao: "🎨",
    dobra: "📑",
    encadernacao: "📚",
    "wire-o": "🔗",
  };
  return icons[slug] || "🏷️";
};

export const AttributeCard: React.FC<AttributeCardProps> = ({
  id,
  name,
  slug,
  values,
  selectedValue,
  onSelect,
  isRequired = false,
  isVisible = true,
  isEnabled = true,
  icon,
  description,
  displayMode = "select",
}) => {
  if (!isVisible) return null;

  const displayIcon = icon || getAttributeIcon(slug);
  const isSelected = (value: string) => selectedValue === value;

  // Modo Dropdown (padrão)
  if (displayMode === "select") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{displayIcon}</span>
          <label className="text-sm font-medium">
            {name}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        <Select
          value={selectedValue?.toString() || ""}
          onValueChange={onSelect}
          disabled={!isEnabled}
        >
          <SelectTrigger
            id={`attr-${id}`}
            className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SelectValue placeholder={`Selecione ${name.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {values.map((val) => (
              <SelectItem key={val.id} value={val.value}>
                <div className="flex items-center gap-2">
                  <span>{val.value}</span>
                  {val.priceModifier !== undefined && val.priceModifier > 0 && (
                    <span className="text-xs text-green-600">
                      +R$ {val.priceModifier.toFixed(2)}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    );
  }

  // Modo Cartões Clicáveis
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">{displayIcon}</span>
        <label className="text-sm font-medium">
          {name}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {values.map((val) => (
          <button
            key={val.id}
            onClick={() => onSelect(val.value)}
            disabled={!isEnabled}
            className={`
              relative p-3 rounded-lg border-2 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              ${
                isSelected(val.value)
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              }
            `}
          >
            {/* Checkmark para seleção */}
            {isSelected(val.value) && (
              <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-1">
                <Check className="w-3 h-3" />
              </div>
            )}

            <div className="text-left">
              <p className="text-xs font-medium line-clamp-2">{val.value}</p>
              {val.priceModifier !== undefined && val.priceModifier > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  +R$ {val.priceModifier.toFixed(2)}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );
};

/**
 * ========================================
 * AttributeSection Component
 * ========================================
 * Agrupa múltiplos AttributeCards com título
 */

interface AttributeSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const AttributeSection: React.FC<AttributeSectionProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  );
};

/**
 * ========================================
 * AttributeGrid Component
 * ========================================
 * Grid responsivo para múltiplas seções de atributos
 */

interface AttributeGridProps {
  children: React.ReactNode;
}

export const AttributeGrid: React.FC<AttributeGridProps> = ({ children }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
};
