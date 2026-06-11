import DashboardLayout from "@/components/DashboardLayout";

export function LogisticsDashboard() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard de Logística</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-gray-700">
            ✓ Módulo de logística reiniciado e pronto para nova integração.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Acesse as outras abas para configurar transportadoras, regras de frete, expedição e rastreamento.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
