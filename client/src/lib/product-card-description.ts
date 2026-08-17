export const PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH = 72;

export function getCardDescriptionLines(value?: string | null): [string, string] {
  const [firstLine = "", secondLine = ""] = (value || "")
    .split(/\r?\n/)
    .map((line) => line.slice(0, PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH));

  return [firstLine, secondLine];
}

export function updateCardDescriptionLine(value: string | null | undefined, lineIndex: 0 | 1, nextLine: string): string {
  const lines = getCardDescriptionLines(value);
  lines[lineIndex] = nextLine.slice(0, PRODUCT_CARD_DESCRIPTION_LINE_MAX_LENGTH);

  return lines[1] ? `${lines[0]}\n${lines[1]}` : lines[0];
}

export function getVisibleCardDescriptionLines(value?: string | null): string[] {
  return getCardDescriptionLines(value).map((line) => line.trim()).filter(Boolean);
}
