import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  LayoutDashboard, ShoppingCart, Package, Users, DollarSign,
  Settings, ChevronDown, ChevronRight, Bell, Search, LogOut,
  Kanban, BarChart3, Zap, Tag, Layers, FileCheck, Link2,
  Sliders, UserCheck, ClipboardList, Briefcase, TrendingUp,
  AlertCircle, Menu, X, Printer, Truck, Receipt, Calculator
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

interface NavItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  badge?: number;
}

const STATUS_LABELS: Record<string, string> = {
  pagamento_aprovado: "Pagamento Aprovado",
  pagamento_retirada: "Pagamento na Retirada",
  analisando: "Analisando",
  com_problemas: "Com Problemas",
  em_producao: "Em Produção",
  pronto_entrega: "Pronto para Entrega",
  pronto_retirada: "Pronto para Retirada",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function NavGroup({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
    </div>
  );
}

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = item.href ? location === item.href : false;
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
            ${isActive ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}
          `}
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge ? <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">{item.badge}</Badge> : null}
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {open && (
          <div className="mt-0.5">
            {item.children!.map((child) => (
              <NavLink key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
        ${isActive ? "bg-orange-500 text-white font-medium" : "text-gray-300 hover:bg-gray-800 hover:text-white"}
      `}
      style={{ paddingLeft: `${12 + depth * 12}px` }}
    >
      {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
      {item.badge ? <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">{item.badge}</Badge> : null}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: orders } = trpc.admin.getAllOrders.useQuery();

  const pendingCount = orders?.filter((o: any) =>
    ["analisando", "pagamento_aprovado", "pagamento_retirada"].includes(o.status)
  ).length ?? 0;

  const inProductionCount = orders?.filter((o: any) => o.status === "em_producao").length ?? 0;

  const navItems: { group?: string; item?: NavItem }[] = [
    // ERP
    { group: "ERP - OPERAÇÃO" },
    {
      item: {
        label: "Pedidos",
        icon: <ShoppingCart className="w-4 h-4" />,
        badge: pendingCount || undefined,
        children: [
          { label: "Todos os Pedidos", href: "/admin/pedidos" },
          { label: "Pedidos Kanban", href: "/admin/pedidos/kanban" },
          ...Object.entries(STATUS_LABELS).map(([key, label]) => ({
            label,
            href: `/admin/pedidos?status=${key}`,
          })),
        ],
      },
    },
    // Financeiro (ERP) - mantido funcionando internamente, ocultado do menu principal conforme especificação
    // { item: { label: "Financeiro (ERP)", href: "/admin/financeiro", icon: <DollarSign className="w-4 h-4" /> } },
    { item: { label: "Produção", href: "/admin/producao", icon: <Printer className="w-4 h-4" />, badge: inProductionCount || undefined } },
    { item: { label: "OS - Ordens de Serviço", href: "/admin/os", icon: <ClipboardList className="w-4 h-4" /> } },
    // Financeiro
    { group: "FINANCEIRO" },
    {
      item: {
        label: "Gerenciador Financeiro",
        icon: <TrendingUp className="w-4 h-4" />,
        children: [
          { label: "Dashboard Financeiro", href: "/admin/financeiro-dashboard" },
          { label: "Contas a Receber", href: "/admin/financeiro/receber" },
          { label: "Contas Recebidas", href: "/admin/financeiro/recebidas" },
          { label: "Pagamentos na Retirada", href: "/admin/financeiro/retirada" },
          { label: "Fluxo de Caixa", href: "/admin/financeiro/fluxo" },
          { label: "Relatórios Financeiros", href: "/admin/financeiro/relatorios" },
        ],
      },
    },
    {
      item: {
        label: "Gestão Fiscal",
        icon: <Receipt className="w-4 h-4" />,
        children: [
          { label: "Dashboard Fiscal", href: "/admin/fiscal" },
          { label: "Notas Fiscais", href: "/admin/fiscal/notas" },
          { label: "Configurações Fiscais", href: "/admin/fiscal/configuracoes" },
        ],
      },
    },
    // Logística
    { group: "LOGÍSTICA" },
    {
      item: {
        label: "Logística",
        icon: <Truck className="w-4 h-4" />,
        children: [
          { label: "Dashboard", href: "/admin/logistica" },
          { label: "Configurações", href: "/admin/logistica/configuracoes" },
          { label: "Transportadoras", href: "/admin/logistica/transportadoras" },
          { label: "Regras de Frete", href: "/admin/logistica/regras-frete" },
          { label: "Expedição", href: "/admin/logistica/expedicao" },
          { label: "Rastreamento", href: "/admin/logistica/rastreamento" },
        ],
      },
    },
    // Produtos
    { group: "PRODUTOS" },
    { item: { label: "Produtos", href: "/admin/produtos", icon: <Package className="w-4 h-4" /> } },
    { item: { label: "Segmentos", href: "/admin/segmentos", icon: <Layers className="w-4 h-4" /> } },
    { item: { label: "Atributos", href: "/admin/atributos", icon: <Tag className="w-4 h-4" /> } },
    { item: { label: "Regras", href: "/admin/regras", icon: <Sliders className="w-4 h-4" /> } },
    { item: { label: "Regras Dinâmicas", href: "/admin/regras-dinamicas", icon: <Zap className="w-4 h-4" /> } },
    // CRM
    { group: "CRM - CLIENTES" },
    { item: { label: "Clientes", href: "/admin/clientes", icon: <Users className="w-4 h-4" /> } },
    { item: { label: "Clientes Loja", href: "/admin/clientes-loja", icon: <UserCheck className="w-4 h-4" /> } },
    { item: { label: "Validação de Arquivos", href: "/admin/validacao-arquivos", icon: <FileCheck className="w-4 h-4" /> } },
    // Relatórios
    { group: "RELATÓRIOS" },
    { item: { label: "Dashboards", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> } },
    { item: { label: "ERP", href: "/admin/erp", icon: <BarChart3 className="w-4 h-4" /> } },
    { item: { label: "Automação", href: "/admin/automacao", icon: <Zap className="w-4 h-4" /> } },
    // Sistema
    { group: "SISTEMA" },
    { item: { label: "Usuários", href: "/admin/clientes", icon: <Users className="w-4 h-4" /> } },
    { item: { label: "Integrações", href: "/admin/vincular-atributos", icon: <Link2 className="w-4 h-4" /> } },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-gray-900 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-56" : "w-0 overflow-hidden"}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-800">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Printer className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Gráfica</p>
            <p className="text-orange-400 text-xs font-semibold">Ponto Digital</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {/* Dashboard link */}
          <NavLink item={{ label: "Painel Admin", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> }} />

          {navItems.map((entry, i) => {
            if (entry.group) return <NavGroup key={i} label={entry.group} />;
            if (entry.item) return <NavLink key={i} item={entry.item} />;
            return null;
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800 px-3 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate">{user?.name ?? "Admin"}</p>
              <p className="text-gray-400 text-[10px]">Administrador</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-gray-400 hover:text-white text-xs py-1.5 px-2 rounded hover:bg-gray-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-900 p-1 rounded"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar pedidos, clientes, produtos..."
              className="pl-9 h-9 text-sm bg-gray-50 border-gray-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">⌘K</span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notificações */}
            <button className="relative text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100">
              <Bell className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>

            {/* User */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.[0]?.toUpperCase() ?? "A"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name ?? "Admin"}</p>
                <p className="text-[11px] text-gray-500">Administrador</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
