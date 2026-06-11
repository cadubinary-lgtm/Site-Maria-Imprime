import DashboardLayout from "@/components/DashboardLayout";

export function ShipmentsManager() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Expedição</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-gray-700">
            🔄 Módulo de expedição em reimplementação.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Volte em breve para gerenciar suas expedições.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
