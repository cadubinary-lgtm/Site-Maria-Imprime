import AdminLayout from "@/components/AdminLayout";
import { MapPinned, RefreshCw } from "lucide-react";

export function TrackingManager() {
  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-pink-50 p-2 text-pink-600">
            <MapPinned className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rastreamento</h1>
            <p className="mt-1 text-sm text-gray-500">Acompanhamento de expedições e atualizações de entrega.</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6" role="status" aria-live="polite">
          <div className="flex items-start gap-3">
            <RefreshCw className="mt-0.5 h-5 w-5 text-amber-700" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-900">Módulo de rastreamento em reimplementação</p>
              <p className="mt-1 text-sm text-amber-800">As informações de rastreio serão disponibilizadas aqui assim que a integração de expedição estiver concluída.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
