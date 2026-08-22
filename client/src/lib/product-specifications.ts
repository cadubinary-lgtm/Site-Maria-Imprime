export type ProductSpecificationItem = {
  text: string;
  label?: string;
  isSection: boolean;
};

const SECTION_TITLES = new Set([
  "diferenciais do produto",
  "especificações técnicas",
  "ideal para",
]);

const TECHNICAL_LABELS = [
  "100% Impermeável",
  "Proteção UV",
  "Bordas Reforçadas",
  "Ilhoses Antiferrugem",
  "Material Térmico",
  "Material",
  "Gramatura",
  "Tamanhos Disponíveis",
  "Cor",
  "Ideal Para",
  "Diferenciais do Produto",
  "Especificações Técnicas",
];

const CAPITALIZED_SENTENCE = /([.!?])\s+(?=[A-ZÀ-ÖØ-Þ])/g;

/**
 * Reorganiza textos de especificação vindos do cadastro antigo ou de campos livres.
 * Mantém frases completas, reconhece separadores já usados e cria uma linha para
 * cada informação técnica, sem exigir que o operador reescreva o conteúdo existente.
 */
export function formatProductSpecificationItems(value?: string | null): ProductSpecificationItem[] {
  if (!value?.trim()) return [];

  const labelPattern = TECHNICAL_LABELS.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(/[•▪◦]\s*/g, "\n")
    .replace(/([^\n])(?=(?:Diferenciais do Produto|Especificações Técnicas|Ideal Para))/g, "$1\n")
    .replace(new RegExp(`([^\\n])(?=\\s*(?:${labelPattern}):?)`, "g"), "$1\n")
    .replace(CAPITALIZED_SENTENCE, "$1\n");

  return normalized
    .split(/\n+/)
    .map((line) => line.replace(/^[\s:;\-–—]+|[\s]+$/g, "").replace(/\s{2,}/g, " "))
    .filter(Boolean)
    .map((line) => {
      const isSection = SECTION_TITLES.has(line.toLocaleLowerCase("pt-BR").replace(/:$/, ""));
      const match = line.match(/^([^:]{2,42}):\s*(.+)$/);
      return isSection
        ? { text: line.replace(/:$/, ""), isSection: true }
        : match
          ? { label: match[1].trim(), text: match[2].trim(), isSection: false }
          : { text: line, isSection: false };
    });
}
