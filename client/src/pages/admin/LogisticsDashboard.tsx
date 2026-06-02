'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import AdminLayout from '@/components/AdminLayout';
import { Loader2, Truck, Package, MapPin, Clock, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function KpiCard({ icon, iconBg, title, value, sub, subColor }: {
  icon: React.ReactNode; iconBg: string; title: string; value: string | number;
  sub?: string; subColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className={`text-xs mt-1 ${subColor ?? "text-gray-500"}`}>{sub}</p>}
      </div>
    </div>
  );
}

export default function LogisticsDashboard() {
  const { data: shipments, isLoading } = trpc.logistics.shipments.list.useQuery();
  const { data: carriers } = trpc.logistics.carriers.list.useQuery();
  const { data: tracking } = trpc.logistics.tracking.getByShipment.useQuery({ shipmentId: 1 });

  const allShipments = (shipments ?? []) as any[];
  const allCarriers = (carriers ?? []) as any[];

  const pendingShipments = useMemo(() => allShipments.filter(s => s.status === 'pending').length, [allShipments]);
  const shippedShipments = useMemo(() => allShipments.filter(s => s.status === 'shipped').length, [allShipments]);
  const deliveredShipments = useMemo(() => allShipments.filter(s => s.status === 'delivered').length, [allShipments]);
  const failedShipments = useMemo(() => allShipments.filter(s => s.status === 'failed').length, [allShipments]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Logística</h1>
            <p className="text-sm text-gray-500">Gerenciamento de transportadoras e expedições</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={<Truck className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" title="Transportadoras" value={allCarriers.length} sub="Ativas" />
          <KpiCard icon={<Package className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-100" title="Pendentes" value={pendingShipments} sub="Aguardando envio" />
          <KpiCard icon={<MapPin className="w-5 h-5 text-orange-600" />} iconBg="bg-orange-100" title="Em Trânsito" value={shippedShipments} sub="Enviados" />
          <KpiCard icon={<Clock className="w-5 h-5 text-green-600" />} iconBg="bg-green-100" title="Entregues" value={deliveredShipments} sub="Completados" />
        </div>

        {/* Alerts */}
        {failedShipments > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{failedShipments} envio(s) com falha</p>
              <p className="text-sm text-red-700">Verifique os detalhes e tente novamente</p>
            </div>
          </div>
        )}

        {/* Gráfico de Expedições */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Expedições (últimos 7 dias)</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Últimos 7 dias</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={[
              { date: '1', pending: 5, shipped: 3, delivered: 8 },
              { date: '2', pending: 4, shipped: 5, delivered: 10 },
              { date: '3', pending: 3, shipped: 7, delivered: 12 },
              { date: '4', pending: 6, shipped: 4, delivered: 15 },
              { date: '5', pending: 2, shipped: 8, delivered: 18 },
              { date: '6', pending: 5, shipped: 6, delivered: 20 },
              { date: '7', pending: 3, shipped: 9, delivered: 22 },
            ]} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
              <Area type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2.5} fill="url(#colorDelivered)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expedições Recentes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">Expedições Recentes</h2>
          <div className="space-y-2">
            {allShipments.slice(0, 5).map((shipment: any) => (
              <div key={shipment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Pedido #{shipment.orderId}</p>
                  <p className="text-xs text-gray-500">Rastreamento: {shipment.trackingNumber}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  shipment.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  shipment.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  shipment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {shipment.status === 'delivered' ? 'Entregue' :
                   shipment.status === 'shipped' ? 'Em Trânsito' :
                   shipment.status === 'pending' ? 'Pendente' :
                   'Falha'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
