type SegmentReference = {
  id: number;
  slug?: string | null;
};

export function getLegacySegmentFromSelection(selectedSegmentIds: number[], segments: SegmentReference[] = []) {
  if (selectedSegmentIds.length === 0) return "";
  return segments.find((segment) => segment.id === selectedSegmentIds[0])?.slug || "";
}
