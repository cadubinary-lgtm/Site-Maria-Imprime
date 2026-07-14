import { useState, useRef, useEffect, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  LayoutDashboard, ShoppingCart, Package, Users, DollarSign,
  Settings, ChevronDown, ChevronRight, Bell, Search, LogOut,
  Kanban, BarChart3, Zap, Tag, Layers, FileCheck, Link2,
  Sliders, UserCheck, ClipboardList, Briefcase, TrendingUp,
  AlertCircle, Menu, X, Printer, Truck, Receipt, Calculator,
  ShieldCheck, ScrollText, UserCircle, Plus, CreditCard, X as XIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const SIDEBAR_SCROLL_KEY = "admin_sidebar_scroll";

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

// Contexto para compartilhar a ref da nav com os NavLinks
interface SidebarScrollCtx {
  navRef: React.RefObject<HTMLElement | null>;
  searchQuery: string;
}
const SidebarScrollContext = createContext<SidebarScrollCtx | null>(null);

function NavGroup({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
    </div>
  );
}

// Função para verificar se um item corresponde à busca (recursivamente)
function matchesSearch(item: NavItem, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  if (item.label.toLowerCase().includes(lowerQuery)) {
    return true;
  }
  if (item.children) {
    return item.children.some((child) => matchesSearch(child, query));
  }
  return false;
}

function NavLink({ item, depth = 0, searchQuery }: { item: NavItem; depth?: number; searchQuery: string }) {
  const [location] = useLocation();
  const ctx = useContext(SidebarScrollContext);

  const hasActiveChild = item.children?.some(
    (child) => child.href && (location === child.href || location.startsWith(child.href + "?"))
  ) ?? false;
  const [open, setOpen] = useState(() => hasActiveChild);
  const isActive = item.href ? location === item.href : false;
  const hasChildren = item.children && item.children.length > 0;
  const isGroupActive = hasChildren && hasActiveChild;

  // Mantém o dropdown aberto sempre que um filho estiver ativo
  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
    }
  }, [hasActiveChild, location]);

  // Abre automaticamente se há busca e o item ou seus filhos correspondem
  useEffect(() => {
    if (searchQuery && hasChildren && matchesSearch(item, searchQuery)) {
      setOpen(true);
    }
  }, [searchQuery, hasChildren, item]);

  // Se há busca e o item não corresponde, não renderiza
  if (searchQuery && !matchesSearch(item, searchQuery)) {
    return null;
  }

  // Salva a posição do scroll no localStorage ANTES de navegar
  const saveScrollPosition = () => {
    if (ctx?.navRef.current) {
      const scrollTop = ctx.navRef.current.scrollTop;
      try {
        localStorage.setItem(SIDEBAR_SCROLL_KEY, String(scrollTop));
      } catch (_) {}
    }
  };

  if (hasChildren) {
    // Filtra filhos se houver busca
    const filteredChildren = searchQuery
      ? item.children!.filter((child) => matchesSearch(child, searchQuery))
      : item.children!;

    // Se não há filhos após filtrar, não renderiza o grupo
    if (searchQuery && filteredChildren.length === 0) {
      return null;
    }

    return (
      <div>
        <button
          onClick={() => {
            saveScrollPosition();
            setOpen(!open);
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
            ${isGroupActive ? "bg-gray-800 text-white" : isActive ? "bg-orange-500 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"}
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
            {filteredChildren.map((child) => (
              <NavLink key={child.label} item={child} depth={depth + 1} searchQuery={searchQuery} />
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
      onClick={(e) => {
        saveScrollPosition();
        if (item.href === "#") {
          e.preventDefault();
        }
      }}
    >
      {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label}</span>
      {item.badge ? <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0 h-4">{item.badge}</Badge> : null}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { adminUser: user, logout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mainRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Ao montar o layout E ao mudar de rota: restaura posição do scroll da sidebar
  useEffect(() => {
    // Reseta scroll do conteúdo principal
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    // Restaura posição da sidebar a partir do localStorage
    const restore = () => {
      if (navRef.current) {
        try {
          const saved = localStorage.getItem(SIDEBAR_SCROLL_KEY);
          if (saved !== null) {
            navRef.current.scrollTop = parseInt(saved, 10);
          }
        } catch (_) {}
      }
    };
    const raf = requestAnimationFrame(() => {
      restore();
    });
    return () => cancelAnimationFrame(raf);
  }, [location]);

  // Também salva o scroll continuamente enquanto o usuário rola a sidebar
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const handleScroll = () => {
      try {
        localStorage.setItem(SIDEBAR_SCROLL_KEY, String(nav.scrollTop));
      } catch (_) {}
    };
    nav.addEventListener("scroll", handleScroll, { passive: true });
    return () => nav.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: orders } = trpc.admin.getAllOrders.useQuery();

  const pendingCount = orders?.filter((o: any) =>
    ["analisando", "pagamento_aprovado", "pagamento_retirada"].includes(o.status)
  ).length ?? 0;

  const inProductionCount = orders?.filter((o: any) => o.status === "em_producao").length ?? 0;

  const navItems: { group?: string; item?: NavItem }[] = [
    // COMERCIAL E VENDAS
    { group: "COMERCIAL E VENDAS" },
    {
      item: {
        label: "Novos Pedidos",
        icon: <ShoppingCart className="w-4 h-4" />,
        badge: pendingCount || undefined,
        href: "/admin/pedidos/novos",
      },
    },
    {
      item: {
        label: "Pedidos",
        icon: <ShoppingCart className="w-4 h-4" />,
        children: [
          { label: "Todos os Pedidos", href: "/admin/pedidos" },
          { label: "Pedidos Kanban", href: "/admin/pedidos/kanban" },
          { label: "Com Problemas", href: "/admin/pedidos?status=cancelado" },
        ],
      },
    },
    // LINHA DE PRODUÇÃO
    { group: "LINHA DE PRODUÇÃO" },
    { item: { label: "Ordens de Serviço (O.S.)", href: "/admin/os", icon: <ClipboardList className="w-4 h-4" /> } },
    {
      item: {
        label: "Pré-Impressão",
        icon: <Layers className="w-4 h-4" />,
        children: [
          { label: "Liberado para Análise", href: "/admin/pre-impressao?status=liberado_analise" },
          { label: "Arte Final Aprovada", href: "/admin/pre-impressao?status=arte_final_aprovada" },
        ],
      },
    },
    {
      item: {
        label: "Status de Produção",
        icon: <Printer className="w-4 h-4" />,
        children: [
          { label: "Pendente", href: "/admin/status-producao?status=pendente" },
          { label: "Impresso", href: "/admin/status-producao?status=impresso" },
          { label: "Acabamento Finalizado", href: "/admin/status-producao?status=acabamento_finalizado" },
        ],
      },
    },
    { item: { label: "Produção Kanban", href: "/admin/producao/kanban", icon: <Kanban className="w-4 h-4" />, badge: inProductionCount || undefined } },
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
    // Pagamentos
    { group: "PAGAMENTOS" },
    {
      item: {
        label: "Mercado Pago",
        icon: <CreditCard className="w-4 h-4" />,
        href: "/admin/pagamentos/mercadopago",
      },
    },
    // Produtos
    { group: "PRODUTOS" },
    { item: { label: "Produtos", href: "/admin/produtos", icon: <Package className="w-4 h-4" /> } },
    { item: { label: "Novo Produto", href: "/admin/novo-produto", icon: <Plus className="w-4 h-4" /> } },
    { item: { label: "Gerenciar Variações", href: "/admin/variacoes", icon: <Settings className="w-4 h-4" /> } },
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
    // Backoffice
    { group: "BACKOFFICE" },
    { item: { label: "Meu Perfil", href: "/admin/perfil", icon: <UserCircle className="w-4 h-4" /> } },
    { item: { label: "Administradores", href: "/admin/administradores", icon: <ShieldCheck className="w-4 h-4" /> } },
    { item: { label: "Logs de Auditoria", href: "/admin/auditoria", icon: <ScrollText className="w-4 h-4" /> } },
  ];

  return (
    <SidebarScrollContext.Provider value={{ navRef, searchQuery }}>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`flex flex-col bg-gray-900 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}
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

          {/* Search */}
          <div className="px-3 py-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-0.5"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav ref={navRef as React.RefObject<HTMLElement>} className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {/* Dashboard link */}
            <NavLink item={{ label: "Painel Admin", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> }} searchQuery={searchQuery} />

            {navItems.map((entry, i) => {
              // Se há busca, não renderiza grupos vazios
              if (entry.group) {
                if (searchQuery) {
                  // Verifica se há algum item no grupo que corresponde à busca
                  const hasMatchingItems = navItems.slice(i + 1).some((e) => {
                    if (e.group) return false; // Próximo grupo encontrado
                    return e.item && matchesSearch(e.item, searchQuery);
                  });
                  if (!hasMatchingItems) return null;
                }
                return <NavGroup key={i} label={entry.group} />;
              }
              if (entry.item) return <NavLink key={i} item={entry.item} searchQuery={searchQuery} />;
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
          <main ref={mainRef} className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </SidebarScrollContext.Provider>
  );
}
