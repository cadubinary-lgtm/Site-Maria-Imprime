import { useState, useRef, useCallback } from "react";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

export interface ChunkedUploadState {
  isUploading: boolean;
  progress: number; // 0-100
  currentChunk: number;
  totalChunks: number;
  error: string | null;
  cancelled: boolean;
}

export interface ChunkedUploadResult {
  url: string;
  key: string;
}

export function useChunkedUpload() {
  const [state, setState] = useState<ChunkedUploadState>({
    isUploading: false,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    error: null,
    cancelled: false,
  });

  const cancelRef = useRef(false);

  const reset = useCallback(() => {
    cancelRef.current = false;
    setState({ isUploading: false, progress: 0, currentChunk: 0, totalChunks: 0, error: null, cancelled: false });
  }, []);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    setState(s => ({ ...s, isUploading: false, cancelled: true, progress: 0 }));
  }, []);

  const upload = useCallback(async (file: File, extraFields?: Record<string, string>): Promise<ChunkedUploadResult> => {
    cancelRef.current = false;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setState({ isUploading: true, progress: 0, currentChunk: 0, totalChunks, error: null, cancelled: false });

    let finalUrl: string | undefined;
    let finalKey: string | undefined;

    for (let i = 0; i < totalChunks; i++) {
      if (cancelRef.current) throw new Error("CANCELLED");

      const start = i * CHUNK_SIZE;
      const chunk = file.slice(start, start + CHUNK_SIZE);

      let attempt = 0;
      let success = false;

      while (attempt < MAX_RETRIES && !success) {
        if (cancelRef.current) throw new Error("CANCELLED");
        try {
          const fd = new FormData();
          fd.append("chunk", chunk, file.name);
          fd.append("uploadId", uploadId);
          fd.append("chunkIndex", String(i));
          fd.append("totalChunks", String(totalChunks));
          fd.append("filename", file.name);
          fd.append("contentType", file.type || "application/octet-stream");
          if (extraFields) {
            Object.entries(extraFields).forEach(([k, v]) => fd.append(k, v));
          }

          const res = await fetch("/api/upload-art-chunk", { method: "POST", body: fd });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error || `HTTP ${res.status}`);
          }
          const data = await res.json();
          if (data.status === "complete") {
            finalUrl = data.url;
            finalKey = data.key;
          }
          success = true;
        } catch (err: any) {
          attempt++;
          if (attempt >= MAX_RETRIES) throw new Error(`Falha após ${MAX_RETRIES} tentativas: ${err?.message}`);
          // Aguarda antes de tentar novamente
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
        }
      }

      const progress = Math.round(((i + 1) / totalChunks) * 100);
      setState(s => ({ ...s, currentChunk: i + 1, progress }));
    }

    if (!finalUrl || !finalKey) throw new Error("Upload incompleto");

    setState(s => ({ ...s, isUploading: false, progress: 100 }));
    return { url: finalUrl, key: finalKey };
  }, []);

  return { state, upload, cancel, reset };
}
