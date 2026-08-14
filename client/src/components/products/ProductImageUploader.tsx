import { useMemo, useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2, GripVertical, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPreviewImageLabel, getPreviewImages } from "@/lib/product-image-preview";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_STRING = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

interface ProductImageUploaderProps {
  mainImageUrl: string;
  galleryUrls: string[]; // até 6 fotos adicionais
  onMainImageChange: (url: string, key?: string) => void;
  onGalleryChange: (urls: string[]) => void;
  compact?: boolean;
}

export function ProductImageUploader({
  mainImageUrl,
  galleryUrls,
  onMainImageChange,
  onGalleryChange,
  compact = false,
}: ProductImageUploaderProps) {
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState<number | null>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingGallerySlot, setPendingGallerySlot] = useState<number | null>(null);

  // Drag-and-drop reorder state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewImages = useMemo(() => getPreviewImages(mainImageUrl, galleryUrls), [mainImageUrl, galleryUrls]);
  const previewIndex = previewUrl ? previewImages.indexOf(previewUrl) : -1;

  const showAdjacentPreview = (direction: -1 | 1) => {
    if (previewIndex < 0 || previewImages.length < 2) return;
    const nextIndex = (previewIndex + direction + previewImages.length) % previewImages.length;
    setPreviewUrl(previewImages[nextIndex]);
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Formato inválido. Use JPG, PNG ou WEBP.";
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      return `Arquivo muito grande (${sizeMB}MB). O limite é 2MB.`;
    }
    return null;
  };

  const uploadImage = async (file: File): Promise<{ url: string; key?: string }> => {
    const error = validateFile(file);
    if (error) throw new Error(error);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erro ao enviar imagem");
    }
    return res.json();
  };

  const handleMainUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    try {
      const { url, key } = await uploadImage(file);
      onMainImageChange(url, key);
      toast.success("Foto principal enviada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto principal");
    } finally {
      setUploadingMain(false);
      if (mainInputRef.current) mainInputRef.current.value = "";
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || pendingGallerySlot === null) return;
    const slot = pendingGallerySlot;
    setUploadingGallery(slot);
    try {
      const { url } = await uploadImage(file);
      const newGallery = [...galleryUrls];
      newGallery[slot] = url;
      onGalleryChange(newGallery);
      toast.success(`Foto ${slot + 2} enviada!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    } finally {
      setUploadingGallery(null);
      setPendingGallerySlot(null);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleRemoveGallery = (idx: number) => {
    const newGallery = [...galleryUrls];
    newGallery.splice(idx, 1);
    onGalleryChange(newGallery);
  };

  const openGalleryPicker = (slot: number) => {
    setPendingGallerySlot(slot);
    galleryInputRef.current?.click();
  };

  // ── Drag-and-drop reorder handlers ──────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    // Only allow dragging slots that have an image
    if (!galleryUrls[idx]) { e.preventDefault(); return; }
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(idx);
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIdx) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newGallery = [...galleryUrls];
    // Swap the two items
    const dragged = newGallery[dragIndex];
    const target = newGallery[dropIdx];
    newGallery[dragIndex] = target || "";
    newGallery[dropIdx] = dragged || "";
    // Clean up empty strings at the end
    const cleaned = newGallery.filter(Boolean);
    onGalleryChange(cleaned);
    toast.success("Ordem das fotos atualizada!");
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      <Label className="text-sm font-semibold text-gray-700">Fotos do Produto</Label>
      <p className="text-xs text-gray-500">
        1 foto principal + até 6 fotos adicionais · JPG, PNG, WEBP · <span className="font-medium text-orange-600">máx. 2MB cada</span>
      </p>
      <div className={compact ? "grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)] xl:items-end" : "space-y-4"}>
        {/* ── Foto Principal ───────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Foto Principal</p>
          <div
            className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-orange-400 transition-colors bg-gray-50"
            style={{ height: compact ? 132 : 180 }}
            onClick={() => !uploadingMain && (mainImageUrl ? setPreviewUrl(mainImageUrl) : mainInputRef.current?.click())}
          >
            {mainImageUrl ? (
              <>
                <img src={mainImageUrl} alt="Foto principal" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-sm font-medium">Clique para ampliar</p>
                </div>
                <button
                  type="button"
                  className="absolute right-2 bottom-2 z-10 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white hover:bg-black/85"
                  onClick={(event) => { event.stopPropagation(); mainInputRef.current?.click(); }}
                >
                  substituir
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                {uploadingMain ? (
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10" />
                    <p className="text-sm">Clique para adicionar foto principal</p>
                  </>
                )}
              </div>
            )}
            {uploadingMain && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            )}
          </div>
          <input
            ref={mainInputRef}
            type="file"
            accept={ACCEPT_STRING}
            className="hidden"
            onChange={handleMainUpload}
          />
        </div>

        {/* ── Fotos Adicionais (com drag-and-drop) ────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-medium text-gray-600">Fotos Adicionais (até 6)</p>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <GripVertical className="w-3 h-3" /> arraste para reordenar
          </span>
        </div>
          <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((slot) => {
            const url = galleryUrls[slot];
            const isUploading = uploadingGallery === slot;
            const isDragging = dragIndex === slot;
            const isDragOver = dragOverIndex === slot;

            return (
              <div
                key={slot}
                draggable={!!url}
                onDragStart={(e) => handleDragStart(e, slot)}
                onDragOver={(e) => handleDragOver(e, slot)}
                onDrop={(e) => handleDrop(e, slot)}
                onDragEnd={handleDragEnd}
                className={[
                  "relative border-2 border-dashed rounded-lg overflow-hidden transition-all",
                  url ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  isDragging ? "opacity-40 scale-95 border-orange-400" : "",
                  isDragOver && dragIndex !== slot ? "border-orange-500 bg-orange-50 scale-105 shadow-md" : "border-gray-300 bg-gray-50",
                  !isDragging && !isDragOver ? "hover:border-orange-400" : "",
                ].join(" ")}
                style={{ height: compact ? 56 : 80 }}
                onClick={() => !isUploading && !uploadingGallery && (url ? setPreviewUrl(url) : openGalleryPicker(slot))}
              >
                {url ? (
                  <>
                    <img src={url} alt={`Foto ${slot + 2}`} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity hover:opacity-100 pointer-events-none">
                      <Maximize2 className="h-4 w-4 text-white" />
                    </div>
                    {/* Drag handle indicator */}
                    <div className="absolute top-0.5 left-0.5 text-white/70 pointer-events-none">
                      <GripVertical className="w-3 h-3 drop-shadow" />
                    </div>
                    {/* Replace button (click) */}
                    <button
                      type="button"
                      className="absolute bottom-0.5 left-0.5 bg-black/60 text-white rounded text-[9px] px-1 py-0.5 hover:bg-black/80 z-10"
                      onClick={(e) => { e.stopPropagation(); openGalleryPicker(slot); }}
                    >
                      trocar
                    </button>
                    {/* Remove button */}
                    <button
                      type="button"
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 z-10"
                      onClick={(e) => { e.stopPropagation(); handleRemoveGallery(slot); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">{slot + 2}ª foto</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept={ACCEPT_STRING}
            className="hidden"
            onChange={handleGalleryUpload}
          />
          <p className="text-xs text-gray-400 mt-1.5">
            Clique em um slot vazio para adicionar · Clique em "trocar" para substituir · Arraste para reordenar
          </p>
        </div>
      </div>

      <Dialog open={Boolean(previewUrl)} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Pré-visualização da imagem</DialogTitle>
            <DialogDescription>{previewUrl ? getPreviewImageLabel(previewImages, previewUrl) : "Imagem do produto"}</DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <div className="space-y-3">
              <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-xl border bg-gray-50 sm:min-h-[460px]">
                <img src={previewUrl} alt="Pré-visualização ampliada do produto" className="max-h-[68dvh] w-full object-contain" />
                {previewImages.length > 1 && (
                  <>
                    <Button type="button" variant="secondary" size="icon" className="absolute left-3 top-1/2 -translate-y-1/2 shadow-sm" onClick={() => showAdjacentPreview(-1)} aria-label="Ver imagem anterior">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 shadow-sm" onClick={() => showAdjacentPreview(1)} aria-label="Ver próxima imagem">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
              {previewImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Selecionar imagem para pré-visualização">
                  {previewImages.map((url, index) => (
                    <button type="button" key={url} onClick={() => setPreviewUrl(url)} className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 ${url === previewUrl ? "border-pink-500" : "border-transparent hover:border-gray-300"}`} aria-label={`Ver imagem ${index + 1}`}>
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
