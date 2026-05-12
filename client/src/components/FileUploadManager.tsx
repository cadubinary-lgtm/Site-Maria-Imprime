import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Check, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: "pending" | "validating" | "approved" | "rejected";
  preview?: string;
  validationNotes?: string;
}

interface FileUploadManagerProps {
  maxFiles?: number;
  maxSize?: number; // em MB
  acceptedFormats?: string[];
  onFilesChange?: (files: UploadedFile[]) => void;
  allowMultiple?: boolean;
}

const DEFAULT_ACCEPTED_FORMATS = [".pdf", ".ai", ".cdr", ".psd", ".eps", ".jpg", ".png"];
const DEFAULT_MAX_SIZE = 50; // MB

export default function FileUploadManager({
  maxFiles = 5,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  onFilesChange,
  allowMultiple = true,
}: FileUploadManagerProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Verificar tamanho
    if (file.size > maxSize * 1024 * 1024) {
      return { valid: false, error: `Arquivo maior que ${maxSize}MB` };
    }

    // Verificar formato
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return { valid: false, error: `Formato não aceito: ${fileExtension}` };
    }

    // Verificar limite de arquivos
    if (!allowMultiple && files.length > 0) {
      return { valid: false, error: "Apenas um arquivo é permitido" };
    }

    if (allowMultiple && files.length >= maxFiles) {
      return { valid: false, error: `Máximo de ${maxFiles} arquivos atingido` };
    }

    return { valid: true };
  };

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    setIsUploading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validation = validateFile(file);

      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      // Criar preview para imagens
      let preview: string | undefined;
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      }

      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        status: "validating",
        preview,
      };

      setFiles((prev) => [...prev, uploadedFile]);
      toast.success(`${file.name} enviado com sucesso`);

      // Simular validação (em produção, seria uma chamada ao backend)
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id ? { ...f, status: "approved" } : f
          )
        );
      }, 2000);
    }

    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success("Arquivo removido");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendente</Badge>;
      case "validating":
        return <Badge className="bg-blue-100 text-blue-800">Validando...</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      default:
        return null;
    }
  };

  React.useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo de Arte</CardTitle>
          <CardDescription>
            Envie seu arquivo em um dos formatos aceitos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Zona de Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-orange-500 bg-orange-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="file"
              multiple={allowMultiple}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="file-upload"
              accept={acceptedFormats.join(",")}
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Clique para fazer upload ou arraste arquivos aqui
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Formatos: {acceptedFormats.join(", ")} (máx {maxSize}MB)
              </p>
            </label>
          </div>

          {/* Informações */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seus arquivos serão validados automaticamente para DPI, cores CMYK e margens de segurança.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Arquivos Enviados ({files.length}/{maxFiles})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Preview */}
                    {file.preview && (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}

                    {/* Informações */}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString("pt-BR")}
                      </p>
                      {file.validationNotes && (
                        <p className="text-xs text-amber-600 mt-1">{file.validationNotes}</p>
                      )}
                    </div>
                  </div>

                  {/* Status e Ações */}
                  <div className="flex items-center gap-3">
                    {getStatusBadge(file.status)}

                    {file.preview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.preview, "_blank")}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo de Validação */}
      {files.length > 0 && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            {files.filter((f) => f.status === "approved").length} de {files.length} arquivo(s)
            aprovado(s) e pronto(s) para produção
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
