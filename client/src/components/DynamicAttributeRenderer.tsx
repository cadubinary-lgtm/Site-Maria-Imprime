import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

export interface DynamicAttributeValue {
  id: number;
  value: string;
  priceModifier: number;
  timeModifier: number;
  weightModifier: number;
  icon?: string;
  image?: string;
}

export interface DynamicAttribute {
  id: number;
  name: string;
  slug: string;
  type: "button" | "select" | "card" | "radio" | "checkbox" | "numeric" | "text" | "measures";
  isRequired: boolean;
  allowMultiple: boolean;
  values: DynamicAttributeValue[];
  visible?: boolean;
  enabled?: boolean;
}

interface DynamicAttributeRendererProps {
  attribute: DynamicAttribute;
  onSelect: (attributeId: number, valueIds: number[], customValue?: string) => void;
  selectedValues?: number[];
  customValue?: string;
}

/**
 * Renderizador dinâmico de atributos
 * Adapta o componente baseado no tipo de atributo
 */
export const DynamicAttributeRenderer: React.FC<DynamicAttributeRendererProps> = ({
  attribute,
  onSelect,
  selectedValues = [],
  customValue = "",
}) => {
  const [internalValue, setInternalValue] = useState(customValue);
  const [internalSelected, setInternalSelected] = useState<number[]>(selectedValues);

  // Não renderizar se invisível
  if (attribute.visible === false) {
    return null;
  }

  const isDisabled = attribute.enabled === false;

  const handleSelect = (valueIds: number[], custom?: string) => {
    setInternalSelected(valueIds);
    onSelect(attribute.id, valueIds, custom);
  };

  switch (attribute.type) {
    /**
     * BUTTON - Botões de seleção
     */
    case "button":
      return (
        <div className="space-y-2">
          <Label className={isDisabled ? "opacity-50" : ""}>{attribute.name}</Label>
          <div className="flex flex-wrap gap-2">
            {attribute.values.map((value) => (
              <Button
                key={value.id}
                variant={internalSelected.includes(value.id) ? "default" : "outline"}
                onClick={() => handleSelect([value.id])}
                disabled={isDisabled}
                className="text-sm"
              >
                {value.icon && <span className="mr-1">{value.icon}</span>}
                {value.value}
                {value.priceModifier !== 0 && (
                  <span className="ml-1 text-xs">
                    +R$ {Math.abs(value.priceModifier).toFixed(2)}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      );

    /**
     * SELECT - Dropdown
     */
    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={`attr-${attribute.id}`} className={isDisabled ? "opacity-50" : ""}>
            {attribute.name}
            {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select
            value={internalSelected[0]?.toString() || ""}
            onValueChange={(val) => handleSelect([Number(val)])}
            disabled={isDisabled}
          >
            <SelectTrigger id={`attr-${attribute.id}`}>
              <SelectValue placeholder={`Selecione ${attribute.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {attribute.values.map((value) => (
                <SelectItem key={value.id} value={value.id.toString()}>
                  {value.value}
                  {value.priceModifier !== 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      +R$ {Math.abs(value.priceModifier).toFixed(2)}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    /**
     * CARD - Cards com imagem
     */
    case "card":
      return (
        <div className="space-y-2">
          <Label className={isDisabled ? "opacity-50" : ""}>{attribute.name}</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {attribute.values.map((value) => (
              <Card
                key={value.id}
                className={`p-3 cursor-pointer transition-all ${
                  internalSelected.includes(value.id)
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:ring-1 hover:ring-gray-300"
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => !isDisabled && handleSelect([value.id])}
              >
                {value.image && (
                  <img src={value.image} alt={value.value} className="w-full h-24 object-cover rounded mb-2" />
                )}
                <p className="text-sm font-medium">{value.value}</p>
                {value.priceModifier !== 0 && (
                  <p className="text-xs text-gray-500">+R$ {Math.abs(value.priceModifier).toFixed(2)}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      );

    /**
     * RADIO - Radio buttons
     */
    case "radio":
      return (
        <div className="space-y-2">
          <Label className={isDisabled ? "opacity-50" : ""}>{attribute.name}</Label>
          <RadioGroup
            value={internalSelected[0]?.toString() || ""}
            onValueChange={(val) => handleSelect([Number(val)])}
            disabled={isDisabled}
          >
            {attribute.values.map((value) => (
              <div key={value.id} className="flex items-center space-x-2">
                <RadioGroupItem value={value.id.toString()} id={`radio-${value.id}`} disabled={isDisabled} />
                <Label htmlFor={`radio-${value.id}`} className="cursor-pointer flex-1">
                  {value.value}
                  {value.priceModifier !== 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      +R$ {Math.abs(value.priceModifier).toFixed(2)}
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    /**
     * CHECKBOX - Checkboxes (múltipla seleção)
     */
    case "checkbox":
      return (
        <div className="space-y-2">
          <Label className={isDisabled ? "opacity-50" : ""}>{attribute.name}</Label>
          <div className="space-y-2">
            {attribute.values.map((value) => (
              <div key={value.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`check-${value.id}`}
                  checked={internalSelected.includes(value.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = checked
                      ? [...internalSelected, value.id]
                      : internalSelected.filter((id) => id !== value.id);
                    handleSelect(newSelected);
                  }}
                  disabled={isDisabled}
                />
                <Label htmlFor={`check-${value.id}`} className="cursor-pointer flex-1">
                  {value.value}
                  {value.priceModifier !== 0 && (
                    <span className="ml-2 text-xs text-gray-500">
                      +R$ {Math.abs(value.priceModifier).toFixed(2)}
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>
      );

    /**
     * NUMERIC - Campo numérico
     */
    case "numeric":
      return (
        <div className="space-y-2">
          <Label htmlFor={`numeric-${attribute.id}`} className={isDisabled ? "opacity-50" : ""}>
            {attribute.name}
            {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={`numeric-${attribute.id}`}
            type="number"
            min="0"
            step="0.01"
            value={internalValue}
            onChange={(e) => {
              setInternalValue(e.target.value);
              handleSelect([], e.target.value);
            }}
            disabled={isDisabled}
            placeholder="Digite um valor"
          />
        </div>
      );

    /**
     * TEXT - Campo de texto
     */
    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor={`text-${attribute.id}`} className={isDisabled ? "opacity-50" : ""}>
            {attribute.name}
            {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            id={`text-${attribute.id}`}
            type="text"
            value={internalValue}
            onChange={(e) => {
              setInternalValue(e.target.value);
              handleSelect([], e.target.value);
            }}
            disabled={isDisabled}
            placeholder={`Digite ${attribute.name.toLowerCase()}`}
          />
        </div>
      );

    /**
     * MEASURES - Medidas personalizadas
     */
    case "measures":
      return (
        <div className="space-y-2">
          <Label className={isDisabled ? "opacity-50" : ""}>{attribute.name}</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`measure-width-${attribute.id}`} className="text-xs">
                Largura (cm)
              </Label>
              <Input
                id={`measure-width-${attribute.id}`}
                type="number"
                min="0"
                step="0.1"
                disabled={isDisabled}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor={`measure-height-${attribute.id}`} className="text-xs">
                Altura (cm)
              </Label>
              <Input
                id={`measure-height-${attribute.id}`}
                type="number"
                min="0"
                step="0.1"
                disabled={isDisabled}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default DynamicAttributeRenderer;
