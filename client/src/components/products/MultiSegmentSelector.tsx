import { useState, useEffect, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { canExecuteConfirmedDelete } from "@/lib/admin-delete-confirmation";

interface MultiSegmentSelectorProps {
  productId: number;
  selectedSegmentIds: number[];
  onSegmentsChange: (segmentIds: number[]) => void;
}

export default function MultiSegmentSelector({
  productId,
  selectedSegmentIds,
  onSegmentsChange,
}: MultiSegmentSelectorProps) {
  const { data: allSegments, isLoading } = trpc.productSegments.getAllSegments.useQuery();
  const [localSelected, setLocalSelected] = useState<number[]>(selectedSegmentIds);
  const [pendingRemoval, setPendingRemoval] = useState<{ id: number; name: string } | null>(null);
  const prevSelectedRef = useRef<number[]>(selectedSegmentIds);

  // Sincronizar quando selectedSegmentIds muda externamente
  useEffect(() => {
    setLocalSelected(selectedSegmentIds);
    prevSelectedRef.current = selectedSegmentIds;
  }, [selectedSegmentIds]);

  // Notificar pai quando localSelected muda (separado do setState)
  useEffect(() => {
    if (prevSelectedRef.current !== localSelected) {
      onSegmentsChange(localSelected);
      prevSelectedRef.current = localSelected;
    }
  }, [localSelected, onSegmentsChange]);

  const handleToggleSegment = useCallback((segmentId: number) => {
    setLocalSelected((prev) => {
      const newSelected = prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId];
      return newSelected;
    });
  }, []);

  const handleRemoveSegment = useCallback((segmentId: number) => {
    handleToggleSegment(segmentId);
  }, [handleToggleSegment]);

  if (isLoading) {
    return <div className="text-gray-500">Carregando segmentos...</div>;
  }

  const selectedSegments = allSegments?.filter((s) => localSelected.includes(s.id)) || [];
  const unselectedSegments = allSegments?.filter((s) => !localSelected.includes(s.id)) || [];

  return (
    <div className="space-y-4">
      {/* Segmentos Selecionados */}
      {selectedSegments.length > 0 && (
        <Card className="border-gray-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Segmentos Selecionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedSegments.map((segment) => (
                <Badge key={segment.id} className="flex items-center gap-1.5 bg-gray-100 text-gray-700">
                  <span>{segment.name}</span>
                  <button
                    type="button"
                    className="rounded p-0.5 text-gray-400 transition-colors hover:bg-pink-50 hover:text-pink-600 focus-visible:bg-pink-50 focus-visible:text-pink-600 focus-visible:outline-none"
                    onClick={() => setPendingRemoval({ id: segment.id, name: segment.name })}
                    title={`Excluir segmento ${segment.name}`}
                    aria-label={`Excluir segmento ${segment.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segmentos Disponíveis */}
      <Card className="border-gray-200 bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Adicionar Segmentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {unselectedSegments.length > 0 ? (
              unselectedSegments.map((segment) => (
                <div key={segment.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`segment-${segment.id}`}
                    checked={localSelected.includes(segment.id)}
                    onCheckedChange={() => handleToggleSegment(segment.id)}
                  />
                  <Label
                    htmlFor={`segment-${segment.id}`}
                    className="cursor-pointer flex-1 text-sm"
                  >
                    {segment.name}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Todos os segmentos foram selecionados</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir segmento?</AlertDialogTitle>
            <AlertDialogDescription>O segmento “{pendingRemoval?.name}” será removido deste produto.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (canExecuteConfirmedDelete(pendingRemoval)) handleRemoveSegment(pendingRemoval.id);
                setPendingRemoval(null);
              }}
            >
              Excluir segmento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
