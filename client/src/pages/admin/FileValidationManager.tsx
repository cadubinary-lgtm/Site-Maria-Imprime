import AdminLayout from "@/components/AdminLayout";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "wouter";
import { ArrowLeft, FileCheck, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

export default function FileValidationManager() {
  const [selectedTab, setSelectedTab] = useState<"pending" | "approved" | "rejected">("pending");
  const utils = trpc.useUtils();

  // Queries
  const { data: pendingValidations, isLoading: loadingPending } = trpc.web2print.getPendingValidations.useQuery();
  const { data: approvedValidations, isLoading: loadingApproved } = trpc.web2print.getApprovedValidations.useQuery({});
  const { data: rejectedValidations, isLoading: loadingRejected } = trpc.web2print.getRejectedValidations.useQuery({});
  const { data: statusCounts, isLoading: loadingCounts } = trpc.web2print.countByStatus.useQuery();

  // Mutations
  const updateStatusMutation = trpc.web2print.updateValidationStatus.useMutation({
    onSuccess: async (_, variables) => {
      await Promise.all([
        utils.web2print.getPendingValidations.invalidate(),
        utils.web2print.getApprovedValidations.invalidate(),
        utils.web2print.getRejectedValidations.invalidate(),
        utils.web2print.countByStatus.invalidate(),
      ]);
      toast.success(variables.status === "aprovado" ? "Arquivo aprovado com sucesso" : "Arquivo rejeitado com sucesso", {
        position: "top-right",
        duration: 3500,
        id: `file-validation-${variables.validationId}`,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const handleApprove = (validationId: number) => {
    updateStatusMutation.mutate({
      validationId,
      status: "aprovado",
    });
  };

  const handleReject = (validationId: number, issues: string) => {
    updateStatusMutation.mutate({
      validationId,
      status: "rejeitado",
      issues,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "aprovado":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "rejeitado":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "em_analise":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovado":
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
      case "rejeitado":
        return <Badge className="bg-red-100 text-red-800">Rejeitado</Badge>;
      case "em_analise":
        return <Badge className="bg-yellow-100 text-yellow-800">Em Análise</Badge>;
      case "correcao_solicitada":
        return <Badge className="bg-blue-100 text-blue-800">Correção Solicitada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Enviado</Badge>;
    }
  };

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link href="/admin">
          <span className="mb-6 inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-pink-700 transition-colors hover:bg-pink-50 hover:text-pink-800">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Voltar
          </span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Validação de Arquivos (Web2Print)</h1>
          <p className="text-gray-600 mt-2">Gerencie validações de DPI, cores e margens de arquivos</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Em Análise</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-yellow-600">{statusCounts?.em_analise || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-green-600">{statusCounts?.aprovado || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rejeitados</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-red-600">{statusCounts?.rejeitado || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Correção Solicitada</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCounts ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <div className="text-2xl font-bold text-blue-600">{statusCounts?.correcao_solicitada || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Abas */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedTab === "pending" ? "default" : "outline"}
            className={selectedTab === "pending" ? "bg-pink-600 text-white hover:bg-pink-700" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
            onClick={() => setSelectedTab("pending")}
            aria-pressed={selectedTab === "pending"}
          >
            Em Análise ({pendingValidations?.length || 0})
          </Button>
          <Button
            variant={selectedTab === "approved" ? "default" : "outline"}
            className={selectedTab === "approved" ? "bg-pink-600 text-white hover:bg-pink-700" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
            onClick={() => setSelectedTab("approved")}
            aria-pressed={selectedTab === "approved"}
          >
            Aprovados ({approvedValidations?.length || 0})
          </Button>
          <Button
            variant={selectedTab === "rejected" ? "default" : "outline"}
            className={selectedTab === "rejected" ? "bg-pink-600 text-white hover:bg-pink-700" : "border-pink-200 text-pink-700 hover:bg-pink-50"}
            onClick={() => setSelectedTab("rejected")}
            aria-pressed={selectedTab === "rejected"}
          >
            Rejeitados ({rejectedValidations?.length || 0})
          </Button>
        </div>

        {/* Conteúdo das abas */}
        {selectedTab === "pending" && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Pendentes de Análise</CardTitle>
              <CardDescription>Revise e aprove ou rejeite os arquivos enviados</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : pendingValidations && pendingValidations.length > 0 ? (
                <div className="space-y-4">
                  {pendingValidations.map((validation: any) => (
                    <div key={validation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileCheck className="w-4 h-4 text-pink-600" aria-hidden="true" />
                            <h3 className="font-semibold">{validation.fileName}</h3>
                            {getStatusBadge(validation.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Tamanho:</span> {(validation.fileSize / 1024).toFixed(2)} KB
                            </div>
                            <div>
                              <span className="font-medium">DPI:</span> {validation.dpi || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Cor:</span> {validation.colorMode || "N/A"}
                            </div>
                            <div>
                              <span className="font-medium">Sangria:</span> {validation.hasBleed ? "Sim" : "Não"}
                            </div>
                          </div>
                          {validation.issues && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <strong>Problemas:</strong> {validation.issues}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-pink-600 hover:bg-pink-700"
                            onClick={() => handleApprove(validation.id)}
                            disabled={updateStatusMutation.isPending}
                            aria-label={`Aprovar arquivo ${validation.fileName}`}
                            aria-busy={updateStatusMutation.isPending}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              handleReject(
                                validation.id,
                                "Arquivo não atende aos requisitos técnicos"
                              )
                            }
                            disabled={updateStatusMutation.isPending}
                            aria-label={`Rejeitar arquivo ${validation.fileName}`}
                            aria-busy={updateStatusMutation.isPending}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum arquivo pendente de análise</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedTab === "approved" && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Aprovados</CardTitle>
              <CardDescription>Arquivos que passaram na validação</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingApproved ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : approvedValidations && approvedValidations.length > 0 ? (
                <div className="space-y-2">
                  {approvedValidations.map((validation: any) => (
                    <div key={validation.id} className="border rounded-lg p-3 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" aria-hidden="true" />
                          <span className="font-medium">{validation.fileName}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(validation.validatedAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum arquivo aprovado</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedTab === "rejected" && (
          <Card>
            <CardHeader>
              <CardTitle>Arquivos Rejeitados</CardTitle>
              <CardDescription>Arquivos que não passaram na validação</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRejected ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : rejectedValidations && rejectedValidations.length > 0 ? (
                <div className="space-y-4">
                  {rejectedValidations.map((validation: any) => (
                    <div key={validation.id} className="border rounded-lg p-4 bg-red-50">
                      <div className="flex items-start gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600 mt-1" aria-hidden="true" />
                        <div className="flex-1">
                          <h3 className="font-semibold">{validation.fileName}</h3>
                          {validation.issues && (
                            <p className="text-sm text-red-700 mt-1">{validation.issues}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum arquivo rejeitado</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
