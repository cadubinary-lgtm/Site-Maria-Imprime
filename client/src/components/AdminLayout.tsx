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
import { rememberAdminOrigin } from "@/lib/adminNavigation";

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
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.href ? location === item.href : false;
  const isGroupActive = hasChildren && hasActiveChild;

  // Chave única para persistir o estado no localStorage
  const storageKey = hasChildren ? `sidebar_open_${item.label}` : null;

  const [open, setOpen] = useState(() => {
    // Prioridade: filho ativo > localStorage > fechado por padrão
    if (hasActiveChild) return true;
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved !== null) return saved === "true";
      } catch (_) {}
    }
    return false;
  });

  // Persiste o estado no localStorage ao mudar
  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (storageKey) {
      try { localStorage.setItem(storageKey, String(next)); } catch (_) {}
    }
  };

  // Garante que o menu fique aberto quando um filho está ativo (ex: ao navegar diretamente pela URL)
  useEffect(() => {
    if (hasActiveChild) {
      setOpen(true);
      if (storageKey) {
        try { localStorage.setItem(storageKey, "true"); } catch (_) {}
      }
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
            toggleOpen();
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

  // Buscar permissões do operador logado (null = acesso total, [] = sem acesso, [...] = lista de chaves)
  const { data: myPermissions } = trpc.adminAuth.myPermissions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Mapa: label do menu → chave de permissão
  const MENU_PERMISSION_MAP: Record<string, string> = {
    "VENDAS": "VENDAS",
    "LINHA DE PRODUÇÃO": "LINHA_PRODUCAO",
    "FINANCEIRO": "FINANCEIRO",
    "LOGÍSTICA": "LOGISTICA",
    "API PAGAMENTOS": "API_PAGAMENTOS",
    "PRODUTOS": "PRODUTOS",
    "CRM - CLIENTES": "CRM",
    "RELATÓRIOS": "RELATORIOS",
    "SISTEMA": "SISTEMA",
    "BACKOFFICE": "BACKOFFICE",
  };

  // null = acesso total, array = lista de chaves permitidas
  const hasPermission = (label: string): boolean => {
    if (myPermissions === undefined) return true;
    if (myPermissions === null) return true;
    const key = MENU_PERMISSION_MAP[label];
    if (!key) return true;
    return (myPermissions as string[]).includes(key);
  };

  // Ao montar o layout E ao mudar de rota: restaura posição do scroll da sidebar
  useEffect(() => {
    rememberAdminOrigin(location);
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

  // Badge de Novos Pedidos: apenas status iniciais de criação
  // Ao mudar para "analisando" ou posterior, o pedido sai desta contagem automaticamente
  const pendingCount = orders?.filter((o: any) =>
    ["pagamento_aprovado", "pagamento_retirada"].includes(o.status)
  ).length ?? 0;

  // O Kanban deve alertar a linha de produção sobre os itens que ainda exigem análise.
  const awaitingAnalysisCount = orders?.filter((o: any) => o.status === "analisando").length ?? 0;

  const navItems: { group?: string; item?: NavItem }[] = [
    // COMERCIAL E VENDAS - Transformado em menu retrátil
    {
      item: {
        label: "VENDAS",
        icon: <ShoppingCart className="w-4 h-4" />,
        children: [
          { label: "Novos Pedidos", href: "/admin/pedidos/novos", badge: pendingCount || undefined },
          { label: "Todos os Pedidos", href: "/admin/pedidos" },
          { label: "Pedidos Kanban", href: "/admin/pedidos/kanban" },
          { label: "Ordens de Serviço (O.S.)", href: "/admin/os" },
          { label: "Orçamentos", href: "/admin/orcamentos" },
          { label: "Carrinho Abandonado", href: "/admin/pedidos?view=carrinho-abandonado" },
        ],
      },
    },
    // LINHA DE PRODUÇÃO - Transformado em menu retrátil
    {
      item: {
        label: "LINHA DE PRODUÇÃO",
        icon: <Printer className="w-4 h-4" />,
        children: [
          {
            label: "Pré-Impressão",
            children: [
              { label: "Liberado para Análise", href: "/admin/pre-impressao?status=liberado_analise" },
              { label: "Arte Final Aprovada", href: "/admin/pre-impressao?status=arte_final_aprovada" },
            ],
          },
          {
            label: "Status de Produção",
            children: [
              { label: "Pendente", href: "/admin/status-producao?status=pendente" },
              { label: "Impresso", href: "/admin/status-producao?status=impresso" },
              { label: "Acabamento Finalizado", href: "/admin/status-producao?status=acabamento_finalizado" },
            ],
          },
          { label: "Produção Kanban", href: "/admin/producao/kanban", badge: awaitingAnalysisCount || undefined },
          { label: "Validação de Arquivos", href: "/admin/validacao-arquivos" },
        ],
      },
    },
    // Financeiro - Transformado em menu retrátil
    {
      item: {
        label: "FINANCEIRO",
        icon: <DollarSign className="w-4 h-4" />,
        children: [
          {
            label: "Gerenciador Financeiro",
            children: [
              { label: "Dashboard Financeiro", href: "/admin/financeiro-dashboard" },
              { label: "Contas a Receber", href: "/admin/financeiro/receber" },
              { label: "Contas Recebidas", href: "/admin/financeiro/recebidas" },
              { label: "Pagamentos na Retirada", href: "/admin/financeiro/retirada" },
              { label: "Fluxo de Caixa", href: "/admin/financeiro/fluxo" },
              { label: "Relatórios Financeiros", href: "/admin/financeiro/relatorios" },
            ],
          },
          {
            label: "Gestão Fiscal",
            children: [
              { label: "Dashboard Fiscal", href: "/admin/fiscal" },
              { label: "Notas Fiscais", href: "/admin/fiscal/notas" },
              { label: "Configurações Fiscais", href: "/admin/fiscal/configuracoes" },
            ],
          },
        ],
      },
    },
    // Logística - Transformado em menu retrátil
    {
      item: {
        label: "LOGÍSTICA",
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
    // API Pagamentos - Transformado em menu retrátil
    {
      item: {
        label: "API PAGAMENTOS",
        icon: <CreditCard className="w-4 h-4" />,
        children: [
          { label: "Mercado Pago", href: "/admin/pagamentos/mercadopago" },
        ],
      },
    },
    // Produtos - Transformado em menu retrátil
    {
      item: {
        label: "PRODUTOS",
        icon: <Package className="w-4 h-4" />,
        children: [
          { label: "Todos os Produtos", href: "/admin/produtos" },
          { label: "Novo Produto", href: "/admin/novo-produto" },
          { label: "Gerenciar Variações", href: "/admin/variacoes" },
          { label: "Variações Offset", href: "/admin/variacoesoffset" },
          { label: "Variações Comunicação Visual", href: "/admin/variacoescomunicacaovisual" },
          { label: "Segmentos", href: "/admin/segmentos" },
        ],
      },
    },
    // CRM - Transformado em menu retrátil
    {
      item: {
        label: "CRM - CLIENTES",
        icon: <Users className="w-4 h-4" />,
        children: [
          { label: "Clientes Site", href: "/admin/clientes-loja" },
          { label: "Clientes Balcão", href: "/admin/clientes-balcao" },
          { label: "Todos os Clientes", href: "/admin/clientes" },
        ],
      },
    },
    // Relatórios - Transformado em menu retrátil
    {
      item: {
        label: "RELATÓRIOS",
        icon: <BarChart3 className="w-4 h-4" />,
        children: [
          { label: "Dashboards", href: "/admin" },
          { label: "ERP", href: "/admin/erp" },
          { label: "Automação", href: "/admin/automacao" },
        ],
      },
    },
    // Sistema - Transformado em menu retrátil
    {
      item: {
        label: "SISTEMA",
        icon: <Settings className="w-4 h-4" />,
        children: [
          { label: "Usuários", href: "/admin/usuarios" },
          { label: "Integrações", href: "/admin/vincular-atributos" },
          { label: "Dados da Empresa", href: "/admin/dados-da-empresa" },
        ],
      },
    },
    // Backoffice - Transformado em menu retrátil
    {
      item: {
        label: "BACKOFFICE",
        icon: <Settings className="w-4 h-4" />,
        children: [
          { label: "Meu Perfil", href: "/admin/perfil" },
          { label: "Administradores", href: "/admin/administradores" },
          { label: "Logs de Auditoria", href: "/admin/auditoria" },
        ],
      },
    },
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
                className="w-full bg-gray-800 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav
            ref={navRef}
            className="flex-1 overflow-y-auto px-2 py-3 space-y-1"
            style={{ scrollBehavior: "auto" }}
          >
            {navItems.map((item, idx) => {
              if (item.group) {
                return <NavGroup key={`group-${idx}`} label={item.group} />;
              }
              // Filtrar menus principais com base nas permissões do operador
              if (item.item && !hasPermission(item.item.label)) return null;
              return (
                <NavLink
                  key={item.item?.label || idx}
                  item={item.item!}
                  searchQuery={searchQuery}
                />
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-3 py-3 border-t border-gray-800">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          ref={mainRef}
          className="flex-1 overflow-auto bg-white"
        >
          {/* Barra de topo administrativa */}
          <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
              <div>
                <p className="text-xs text-gray-400 leading-none">Painel Admin</p>
                <p className="text-sm font-semibold text-gray-800 leading-tight mt-0.5">
                  Bem-vindo de volta{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate">
                  {user?.name || "Operador"}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  user?.role === "superadmin" ? "bg-orange-100 text-orange-600" :
                  user?.role === "production" ? "bg-gray-100 text-gray-500" :
                  "bg-blue-100 text-blue-600"
                }`}>
                  {user?.role === "superadmin" ? "Super" : user?.role === "production" ? "Prod." : "Admin"}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarScrollContext.Provider>
  );
}
