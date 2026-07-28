import { useState, useRef } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ProductImageUploaderProps {
  mainImageUrl: string;
  galleryUrls: string[]; // até 6 fotos adicionais
  onMainImageChange: (url: string, key?: string) => void;
  onGalleryChange: (urls: string[]) => void;
}

export function ProductImageUploader({
  mainImageUrl,
  galleryUrls,
  onMainImageChange,
  onGalleryChange,
}: ProductImageUploaderProps) {
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState<number | null>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [pendingGallerySlot, setPendingGallerySlot] = useState<number | null>(null);

  const uploadImage = async (file: File): Promise<{ url: string; key?: string }> => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Arquivo muito grande (máximo 10MB)");
    }
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

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold text-gray-700">Fotos do Produto</Label>
      <p className="text-xs text-gray-500">1 foto principal + até 6 fotos adicionais (JPG, PNG — máx. 10MB cada)</p>

      {/* Foto Principal */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Foto Principal</p>
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden cursor-pointer hover:border-orange-400 transition-colors bg-gray-50"
          style={{ height: 180 }}
          onClick={() => !uploadingMain && mainInputRef.current?.click()}
        >
          {mainImageUrl ? (
            <>
              <img src={mainImageUrl} alt="Foto principal" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <p className="text-white text-sm font-medium">Clique para substituir</p>
              </div>
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
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleMainUpload}
        />
      </div>

      {/* Fotos Adicionais */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Fotos Adicionais (até 6)</p>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2, 3, 4, 5].map((slot) => {
            const url = galleryUrls[slot];
            const isUploading = uploadingGallery === slot;
            return (
              <div
                key={slot}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-orange-400 transition-colors bg-gray-50"
                style={{ height: 80 }}
                onClick={() => !isUploading && !uploadingGallery && openGalleryPicker(slot)}
              >
                {url ? (
                  <>
                    <img src={url} alt={`Foto ${slot + 2}`} className="w-full h-full object-cover" />
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
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleGalleryUpload}
        />
      </div>
    </div>
  );
}
