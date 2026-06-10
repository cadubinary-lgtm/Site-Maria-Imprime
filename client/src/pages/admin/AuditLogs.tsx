/**
 * Página de Logs de Auditoria
 * Exibe todas as ações administrativas registradas no sistema.
 * Acessível em /admin/auditoria
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollText, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

const actionLabels: Record<string, { label: string; color: string }> = {
  admin_login: { label: "Login", color: "bg-blue-500/20 text-blue-400" },
  create_admin: { label: "Criou admin", color: "bg-green-500/20 text-green-400" },
  update_admin: { label: "Editou admin", color: "bg-yellow-500/20 text-yellow-400" },
  reset_password: { label: "Resetou senha", color: "bg-orange-500/20 text-orange-400" },
  activate_admin: { label: "Ativou admin", color: "bg-green-500/20 text-green-400" },
  deactivate_admin: { label: "Desativou admin", color: "bg-red-500/20 text-red-400" },
};

export default function AuditLogs() {
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data: logs, isLoading, refetch } = trpc.adminAuth.listAuditLogs.useQuery(
    { limit, offset },
    { refetchOnWindowFocus: false }
  );

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-orange-500" />
            Logs de Auditoria
          </h1>
          <p className="text-slate-400 mt-1">Registro de todas as ações administrativas</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Histórico de Ações</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {(logs || []).map((log: any) => {
                const actionInfo = actionLabels[log.action] || { label: log.action, color: "bg-slate-700 text-slate-300" };
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                        <span className="text-white text-sm font-medium truncate">
                          {log.adminName || "Sistema"}
                        </span>
                        <span className="text-slate-500 text-xs">→</span>
                        <span className="text-slate-400 text-xs">{log.entity}</span>
                        {log.entityId && (
                          <span className="text-slate-500 text-xs">#{log.entityId}</span>
                        )}
                      </div>
                      {log.ipAddress && (
                        <p className="text-slate-500 text-xs mt-1">IP: {log.ipAddress}</p>
                      )}
                    </div>
                    <span className="text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                );
              })}

              {(!logs || logs.length === 0) && (
                <div className="text-center text-slate-500 py-8">
                  Nenhum log registrado ainda
                </div>
              )}
            </div>
          )}

          {/* Paginação */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
            <span className="text-slate-500 text-sm">
              Mostrando {offset + 1}–{offset + (logs?.length || 0)}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-700 text-slate-300"
                onClick={() => setOffset(offset + limit)}
                disabled={!logs || logs.length < limit}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
