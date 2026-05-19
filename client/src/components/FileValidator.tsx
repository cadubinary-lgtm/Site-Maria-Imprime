import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export type FileStatus = 'pending' | 'analyzing' | 'approved' | 'needs-correction' | 'error';

interface FileValidationResult {
  status: FileStatus;
  message: string;
  issues: string[];
  warnings: string[];
}

interface FileValidatorProps {
  onValidationComplete?: (result: FileValidationResult) => void;
  maxFileSize?: number; // em MB
}

export default function FileValidator({ onValidationComplete, maxFileSize = 50 }: FileValidatorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateFile = async (file: File) => {
    setIsValidating(true);
    setValidationResult({
      status: 'analyzing',
      message: 'Analisando arquivo...',
      issues: [],
      warnings: [],
    });

    // Simular análise de arquivo
    setTimeout(() => {
      const result = performValidation(file);
      setValidationResult(result);
      setIsValidating(false);
      onValidationComplete?.(result);
    }, 2000);
  };

  const performValidation = (file: File): FileValidationResult => {
    const issues: string[] = [];
    const warnings: string[] = [];
    let status: FileStatus = 'approved';

    // Validar tamanho do arquivo
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      issues.push(`Arquivo muito grande (${fileSizeMB.toFixed(2)}MB). Máximo: ${maxFileSize}MB`);
      status = 'error';
    }

    // Validar tipo de arquivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/x-cdr', 'application/postscript'];
    if (!validTypes.includes(file.type)) {
      issues.push(`Tipo de arquivo não suportado: ${file.type}. Aceitos: PDF, JPG, PNG, CDR, EPS`);
      status = 'error';
    }

    // Validações de DPI (simulado)
    if (file.type === 'image/jpeg' || file.type === 'image/png') {
      // Em produção, seria necessário ler os metadados da imagem
      warnings.push('Recomendado: Usar imagens com mínimo 300 DPI para melhor qualidade');
    }

    // Validações de cores (simulado)
    if (file.type === 'application/pdf') {
      warnings.push('Verifique se o arquivo está em CMYK para impressão');
    }

    // Validações de sangria (simulado)
    warnings.push('Certifique-se de adicionar 5mm de sangria nas bordas');

    if (status === 'approved' && warnings.length > 0) {
      status = 'needs-correction';
    }

    return {
      status,
      message: status === 'approved' ? 'Arquivo validado com sucesso!' : 'Arquivo com problemas detectados',
      issues,
      warnings,
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      validateFile(file);
    }
  };

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'analyzing':
        return <Clock className="w-6 h-6 text-blue-500 animate-spin" />;
      case 'needs-correction':
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: FileStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'analyzing':
        return 'bg-blue-50 border-blue-200';
      case 'needs-correction':
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Validação de Arquivo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <input
            type="file"
            id="file-input"
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.cdr,.eps"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <div className="text-gray-600">
              <p className="font-medium">Clique para selecionar ou arraste um arquivo</p>
              <p className="text-sm text-gray-500">PDF, JPG, PNG, CDR, EPS (máx {maxFileSize}MB)</p>
            </div>
          </label>
        </div>

        {/* Arquivo Selecionado */}
        {selectedFile && (
          <div className="text-sm text-gray-600">
            <p>Arquivo selecionado: <strong>{selectedFile.name}</strong></p>
            <p>Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)}MB</p>
          </div>
        )}

        {/* Resultado da Validação */}
        {validationResult && (
          <div className={`border rounded-lg p-4 ${getStatusColor(validationResult.status)}`}>
            <div className="flex items-center gap-3 mb-3">
              {getStatusIcon(validationResult.status)}
              <p className="font-medium">{validationResult.message}</p>
            </div>

            {/* Erros */}
            {validationResult.issues.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-red-700 mb-2">Problemas encontrados:</p>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-600">{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Avisos */}
            {validationResult.warnings.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-2">Recomendações:</p>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-yellow-600">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Botão de Ação */}
        {validationResult?.status === 'approved' && (
          <Button className="w-full bg-green-600 hover:bg-green-700">
            Usar Este Arquivo
          </Button>
        )}

        {validationResult?.status === 'needs-correction' && (
          <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
            Continuar Mesmo Assim
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
