import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Printer,
  Wrench,
  Layers,
  Calculator,
  Clock,
  UserCheck,
  MessageSquare,
  CreditCard,
  Wallet,
  FileText,
  TrendingUp,
  Factory,
  ShoppingBag,
  UserCog,
  Plug,
  Bell,
  Search,
  ExternalLink,
} from "lucide-react";

// ─── Estrutura da navegação ──────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin",
    exact: true,
  },
  {
    id: "pedidos",
    label: "Pedidos",
    icon: ShoppingCart,
    children: [
      { label: "Todos os Pedidos", path: "/admin/pedidos", icon: ShoppingCart },
      { label: "Produção", path: "/admin/producao", icon: Factory },
      { label: "Impressão", path: "/admin/pedidos?status=impressao", icon: Printer },
      { label: "Acabamento", path: "/admin/pedidos?status=acabamento", icon: Wrench },
      { label: "Expedição", path: "/admin/pedidos?status=saiu_para_entrega", icon: ShoppingBag },
    ],
  },
  {
    id: "produtos",
    label: "Produtos",
    icon: Package,
    children: [
      { label: "Produtos", path: "/admin/produtos", icon: Package },
      { label: "Variações", path: "/admin/variacoes", icon: Layers },
      { label: "Atributos", path: "/admin/atributos", icon: Wrench },
      { label: "Calculadoras", path: "/admin/regras-dinamicas", icon: Calculator },
      { label: "Prazos de Produção", path: "/admin/precos", icon: Clock },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
    children: [
      { label: "Clientes", path: "/admin/clientes-loja", icon: Users },
      { label: "Orçamentos", path: "/admin/orcamentos", icon: FileText },
      { label: "Atendimento", path: "/admin/clientes", icon: MessageSquare },
    ],
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: DollarSign,
    children: [
      { label: "Pagamentos", path: "/admin/financeiro", icon: CreditCard },
      { label: "Caixa", path: "/admin/caixa", icon: Wallet },
      { label: "Faturas", path: "/admin/faturas", icon: FileText },
    ],
  },
  {
    id: "relatorios",
    label: "Relatórios",
    icon: BarChart3,
    children: [
      { label: "Vendas", path: "/admin/erp", icon: TrendingUp },
      { label: "Produção", path: "/admin/automacao", icon: Factory },
      { label: "Produtos", path: "/admin/relatorios-produtos", icon: Package },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    icon: Settings,
    children: [
      { label: "Usuários", path: "/admin/usuarios", icon: UserCog },
      { label: "Configurações", path: "/admin/configuracoes", icon: Settings },
      { label: "Integrações", path: "/admin/integracoes", icon: Plug },
    ],
  },
];

// ─── Mapeamento de títulos por rota ──────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pedidos": "Todos os Pedidos",
  "/admin/produtos": "Produtos",
  "/admin/variacoes": "Variações",
  "/admin/atributos": "Atributos",
  "/admin/regras-dinamicas": "Calculadoras",
  "/admin/precos": "Prazos de Produção",
  "/admin/clientes-loja": "Clientes",
  "/admin/clientes": "Atendimento",
  "/admin/financeiro": "Financeiro",
  "/admin/erp": "Relatório de Vendas",
  "/admin/automacao": "Relatório de Produção",
  "/admin/producao": "Produção",
  "/admin/segmentos": "Segmentos",
  "/admin/vincular-atributos": "Vincular Atributos",
  "/admin/regras": "Regras de Preço",
  "/admin/regras-builder": "Construtor de Regras",
  "/admin/validacao-arquivos": "Validação de Arquivos",
};

function getPageTitle(location: string): string {
  // Pedido específico
  if (/^\/admin\/pedidos\/\d+/.test(location)) return "Detalhes do Pedido";
  return PAGE_TITLES[location] ?? "Admin";
}

// ─── Item de navegação ───────────────────────────────────────────────────────
function NavItem({
  item,
  isCollapsed,
  openSections,
  toggleSection,
}: {
  item: (typeof NAV_SECTIONS)[0];
  isCollapsed: boolean;
  openSections: Set<string>;
  toggleSection: (id: string) => void;
}) {
  const [location] = useLocation();

  if (!item.children) {
    const isActive = item.exact ? location === item.path : location.startsWith(item.path!);
    return (
      <Link href={item.path!}>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group",
            isActive
              ? "bg-orange-500 text-white shadow-sm"
              : "text-slate-300 hover:bg-slate-700 hover:text-white"
          )}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
        </div>
      </Link>
    );
  }

  const isOpen = openSections.has(item.id);
  const isAnyChildActive = item.children.some((c) => location.startsWith(c.path));

  return (
    <div>
      <button
        onClick={() => toggleSection(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150",
          isAnyChildActive
            ? "bg-slate-700 text-white"
            : "text-slate-300 hover:bg-slate-700 hover:text-white"
        )}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 opacity-60" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-60" />
            )}
          </>
        )}
      </button>

      {isOpen && !isCollapsed && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-700 pl-3">
          {item.children.map((child) => {
            const isActive = location === child.path || location.startsWith(child.path.split("?")[0]);
            return (
              <Link key={child.path} href={child.path}>
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer transition-all duration-150 text-sm",
                    isActive
                      ? "bg-orange-500/20 text-orange-400 font-medium"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <child.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{child.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    // Abrir a seção ativa por padrão
    const active = new Set<string>();
    NAV_SECTIONS.forEach((s) => {
      if (s.children?.some((c) => location.startsWith(c.path.split("?")[0]))) {
        active.add(s.id);
      }
    });
    return active;
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pageTitle = getPageTitle(location);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Printer className="w-4 h-4 text-white" />
        </div>
        {!isCollapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-tight">Gráfica</p>
            <p className="text-orange-400 text-xs font-medium">Ponto Digital</p>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_SECTIONS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            openSections={openSections}
            toggleSection={toggleSection}
          />
        ))}
      </nav>

      {/* Rodapé */}
      <div className="border-t border-slate-700 p-3">
        {!isCollapsed && user && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-700/50 mb-2">
            <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name ?? "Admin"}</p>
              <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-400 px-1 py-0 h-4">
                Admin
              </Badge>
            </div>
          </div>
        )}
        <Link href="/" target="_blank">
          <button className="w-full flex items-center gap-2 px-2 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm">
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Ver Loja</span>}
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-slate-800 transition-all duration-300 flex-shrink-0",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Sidebar Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative w-64 bg-slate-800 flex flex-col h-full z-10">
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0 shadow-sm">
          {/* Toggle sidebar */}
          <button
            onClick={() => {
              if (window.innerWidth >= 1024) setIsCollapsed((v) => !v);
              else setIsMobileOpen(true);
            }}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Título da página */}
          <h1 className="text-slate-800 font-semibold text-lg flex-1">{pageTitle}</h1>

          {/* Ações do topbar */}
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 text-slate-600">
                <ExternalLink className="w-3.5 h-3.5" />
                Ver Loja
              </Button>
            </Link>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
