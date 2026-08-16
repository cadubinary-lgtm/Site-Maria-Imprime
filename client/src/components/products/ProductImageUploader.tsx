import { useMemo, useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2, GripVertical, ChevronLeft, ChevronRight, Maximize2, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getPreviewImageLabel, getPreviewImages } from "@/lib/product-image-preview";
import { getAvailableGallerySlots, placeGalleryImages } from "@/lib/product-gallery-drop";
import { PRODUCT_IMAGE_LAYOUT } from "@/lib/product-image-layout";
import { canExecuteConfirmedDelete } from "@/lib/admin-delete-confirmation";

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
  const [isMainDragOver, setIsMainDragOver] = useState(false);
  const [isGalleryFileDropActive, setIsGalleryFileDropActive] = useState(false);
  const [isDroppingGalleryFiles, setIsDroppingGalleryFiles] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [galleryDeleteSlot, setGalleryDeleteSlot] = useState<number | null>(null);
  const [isMainImageDeleteConfirmOpen, setIsMainImageDeleteConfirmOpen] = useState(false);
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
    setIsMainDragOver(false);
  };

  const handleDropOnMainImage = (event: React.DragEvent) => {
    event.preventDefault();
    setIsMainDragOver(false);
    if (dragIndex === null || !galleryUrls[dragIndex] || !mainImageUrl) return;

    const nextGallery = [...galleryUrls];
    const nextMainImage = nextGallery[dragIndex];
    nextGallery[dragIndex] = mainImageUrl;
    onMainImageChange(nextMainImage);
    onGalleryChange(nextGallery);
    toast.success("Ordem das fotos atualizada!");
    handleDragEnd();
  };

  const handleGalleryFilesDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length === 0) return;

    event.preventDefault();
    event.stopPropagation();
    setIsGalleryFileDropActive(false);

    const availableSlots = getAvailableGallerySlots(galleryUrls);
    if (availableSlots.length === 0) {
      toast.error("A galeria já possui o limite de 6 fotos adicionais.");
      return;
    }

    const acceptedFiles = files.slice(0, availableSlots.length);
    const invalidFile = acceptedFiles.map(validateFile).find(Boolean);
    if (invalidFile) {
      toast.error(invalidFile);
      return;
    }

    setIsDroppingGalleryFiles(true);
    try {
      const uploaded = await Promise.all(acceptedFiles.map(uploadImage));
      onGalleryChange(placeGalleryImages(galleryUrls, availableSlots, uploaded.map((image) => image.url)));
      const skipped = files.length - acceptedFiles.length;
      toast.success(`${uploaded.length} foto${uploaded.length > 1 ? "s" : ""} adicionada${uploaded.length > 1 ? "s" : ""} à galeria!`, {
        description: skipped > 0 ? `${skipped} arquivo${skipped > 1 ? "s foram ignorados" : " foi ignorado"} por falta de vagas.` : undefined,
      });
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível adicionar as fotos à galeria");
    } finally {
      setIsDroppingGalleryFiles(false);
    }
  };

  return (
    <div className={compact ? "space-y-4" : "space-y-4"}>
      <div className="space-y-1">
        <Label className="text-sm font-semibold text-gray-700">Fotos do Produto</Label>
        <p className="text-xs leading-5 text-gray-500">
          1 foto principal + até 6 fotos adicionais · JPG, PNG, WEBP · <span className="font-medium text-pink-600">máx. 2MB cada</span>
        </p>
      </div>
      <div className={compact ? PRODUCT_IMAGE_LAYOUT.compactColumns : "grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)]"}>
        {/* ── Foto Principal ───────────────────────────────────────────────── */}
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium text-gray-600">Foto Principal</p>
          <div className="flex min-w-0 flex-col gap-2">
            <button
              type="button"
              className={`group relative shrink-0 overflow-hidden rounded-xl bg-gray-50 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 ${isMainDragOver ? "ring-2 ring-pink-400 ring-offset-2" : "hover:ring-2 hover:ring-pink-200"}`}
              style={{ height: compact ? 132 : 180, width: "100%" }}
              onClick={() => !uploadingMain && (mainImageUrl ? setPreviewUrl(mainImageUrl) : mainInputRef.current?.click())}
              aria-label={mainImageUrl ? "Ampliar foto principal" : "Adicionar foto principal"}
              title={mainImageUrl ? "Clique para ampliar" : "Adicionar foto principal"}
            onDragOver={(event) => {
              if (dragIndex !== null) {
                event.preventDefault();
                setIsMainDragOver(true);
              }
            }}
            onDragLeave={() => setIsMainDragOver(false)}
            onDrop={handleDropOnMainImage}
          >
            {mainImageUrl ? (
              <>
                <img src={mainImageUrl} alt="Foto principal" className="w-full h-full object-contain" />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-5 w-5 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                {uploadingMain ? (
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                ) : (
                  <>
                    <ImageIcon className="w-10 h-10" />
                    <p className="px-3 text-center text-sm">Clique para adicionar foto principal</p>
                  </>
                )}
              </div>
            )}
            {uploadingMain && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            )}
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`${PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon} inline-flex items-center gap-1.5 px-1.5 text-xs font-medium`}
                onClick={() => mainInputRef.current?.click()}
                title={mainImageUrl ? "Substituir foto principal" : "Adicionar foto principal"}
                aria-label="Adicionar ou substituir foto principal"
                disabled={uploadingMain}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{mainImageUrl ? "Substituir" : "Adicionar"}</span>
              </button>
              {mainImageUrl && (
                <button
                  type="button"
                  className={PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon}
                  onClick={() => setIsMainImageDeleteConfirmOpen(true)}
                  title="Excluir foto principal"
                  aria-label="Excluir foto principal"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
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
        <div
          className={`rounded-xl transition-colors ${isGalleryFileDropActive ? "bg-pink-50 ring-2 ring-pink-400 ring-offset-2" : ""}`}
          onDragOver={(event) => {
            if (event.dataTransfer.types.includes("Files")) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setIsGalleryFileDropActive(true);
            }
          }}
          onDragLeave={(event) => {
            if (event.currentTarget === event.target) setIsGalleryFileDropActive(false);
          }}
          onDrop={handleGalleryFilesDrop}
        >
          <div className={`${PRODUCT_IMAGE_LAYOUT.sectionHeader} mb-2`}>
            <p className="text-xs font-medium text-gray-600">Fotos Adicionais (até 6)</p>
          </div>
          <div className={PRODUCT_IMAGE_LAYOUT.galleryPanel}>
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
                  "relative min-w-0 transition-all",
                  url ? "cursor-grab active:cursor-grabbing" : "cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50",
                  isDragging ? "opacity-40 scale-95 ring-2 ring-pink-400" : "",
                  isDragOver && dragIndex !== slot ? "scale-105 rounded-lg bg-pink-50 ring-2 ring-pink-500 shadow-md" : "",
                  !url && !isDragging && !isDragOver ? "hover:border-pink-400" : "",
                ].join(" ")}
                style={{ height: compact ? 56 : 80 }}
                onClick={() => !isUploading && !uploadingGallery && (url ? setPreviewUrl(url) : openGalleryPicker(slot))}
              >
                {url ? (
                  <>
                    <div className={PRODUCT_IMAGE_LAYOUT.thumbnailImage}>
                      <img src={url} alt={`Foto ${slot + 2}`} className="h-full w-full object-contain" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity hover:opacity-100 pointer-events-none">
                        <Maximize2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    {/* Drag handle indicator */}
                    <div className="absolute top-0.5 left-0.5 z-10 text-white/70 pointer-events-none">
                      <GripVertical className="w-3 h-3 drop-shadow" />
                    </div>
                    <div className={PRODUCT_IMAGE_LAYOUT.thumbnailActions}>
                      <button
                        type="button"
                        className={PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon}
                        onClick={(e) => { e.stopPropagation(); setGalleryDeleteSlot(slot); }}
                        title={`Excluir foto ${slot + 2}`}
                        aria-label={`Excluir foto ${slot + 2}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className={PRODUCT_IMAGE_LAYOUT.thumbnailActionIcon}
                        onClick={(e) => { e.stopPropagation(); openGalleryPicker(slot); }}
                        title={`Trocar foto ${slot + 2}`}
                        aria-label={`Trocar foto ${slot + 2}`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-1 text-gray-400">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
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
          <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400">
            <GripVertical className="h-3 w-3" aria-hidden="true" />
            Arraste para reordenar
          </p>
          <p className={PRODUCT_IMAGE_LAYOUT.galleryHint} aria-live="polite">
            {isDroppingGalleryFiles
              ? "Enviando imagens para a galeria..."
              : isGalleryFileDropActive
                ? "Solte as imagens para adicioná-las às vagas disponíveis"
                : "Clique em um slot vazio para adicionar · Solte arquivos nesta área · Arraste fotos para reordenar"}
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

      <AlertDialog open={isMainImageDeleteConfirmOpen} onOpenChange={setIsMainImageDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto principal?</AlertDialogTitle>
            <AlertDialogDescription>O produto ficará sem foto principal até que uma nova imagem seja adicionada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (canExecuteConfirmedDelete(mainImageUrl)) onMainImageChange("", "");
                setIsMainImageDeleteConfirmOpen(false);
              }}
            >
              Excluir foto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={galleryDeleteSlot !== null} onOpenChange={(open) => !open && setGalleryDeleteSlot(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir foto adicional?</AlertDialogTitle>
            <AlertDialogDescription>Esta foto será removida da galeria do produto. Você poderá adicioná-la novamente depois, se necessário.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (canExecuteConfirmedDelete(galleryDeleteSlot)) handleRemoveGallery(galleryDeleteSlot);
                setGalleryDeleteSlot(null);
              }}
            >
              Excluir foto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
