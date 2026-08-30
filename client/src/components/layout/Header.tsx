import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCartDrawer } from "@/contexts/CartDrawerContext";
import { useAdminAuth as useManusAdminAuth } from "@/_core/hooks/useAdminAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X, LogOut, User, ShoppingCart, UserCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { formatProductPrice } from "@/lib/productPrice";
import { HOME_PRIMARY_ACTION_CLASS, HOME_SECONDARY_ACTION_CLASS } from "@/lib/homeActionStyles";

function CartIcon() {
  const { data: count } = trpc.cart.getCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const cartCount = Number(count ?? 0);
  const { toggleCart } = useCartDrawer();
  return (
    <button onClick={toggleCart} className="relative rounded-lg p-2 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500" aria-label={`Abrir carrinho com ${cartCount} ${cartCount === 1 ? "item" : "itens"}`} aria-haspopup="dialog">
      <ShoppingCart className="w-5 h-5 text-gray-600" aria-hidden="true" />
      {cartCount > 0 && (
        <span aria-hidden="true" className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-xs font-bold text-white">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
}

export default function Header() {
  const [, navigate] = useLocation();
  const { user: manusUser, isAuthenticated: isManusAuth, logout: manusLogout } = useManusAdminAuth();
  const { adminUser, logout: adminLogout } = useAdminAuth();
  
  // Detectar se está no Manus (preview) ou no site de produção
  const isManus = typeof window !== 'undefined' && 
    (window.location.hostname.includes('manus.') || window.location.hostname.includes('manus.space'));
  
  // No Manus: usar Manus OAuth | No site: usar sistema próprio
  const isAuthenticated = isManus ? isManusAuth : !!adminUser;
  const user = isManus ? manusUser : (adminUser ? { name: adminUser.name, email: adminUser.email } : null);
  const isSellerSession = !isManus && adminUser?.role === "seller";
  const { customer, isAuthenticated: isCustomerAuth, refetch: refetchCustomer } = useCustomerAuth();
  const priceAudience = customer?.priceTier === "reseller" ? "reseller" : "final";
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const customerLogout = trpc.customerAuth.logout.useMutation({
    onSuccess: () => {
      refetchCustomer();
      toast.success("Desconectado com sucesso");
      navigate("/");
      setMobileMenuOpen(false);
    },
  });

  const { data: searchResults, isLoading: isSearching } = trpc.search.global.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleSelectProduct = (productId: number) => {
    navigate(`/produto/${productId}`);
    setSearchQuery("");
    setShowResults(false);
    setMobileMenuOpen(false);
  };

  const handleAdminLogout = async () => {
    if (isManus) {
      await manusLogout();
    } else {
      await adminLogout();
    }
    toast.success("Desconectado com sucesso");
    navigate("/");
    setMobileMenuOpen(false);
  };

  const scrollHomeToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    setShowResults(false);

    if (window.location.pathname === "/") {
      scrollHomeToTop();
      return;
    }

    navigate("/");
    requestAnimationFrame(() => window.setTimeout(scrollHomeToTop, 80));
  };

  const totalResults =
    (searchResults?.products.length || 0) +
    (searchResults?.categories.length || 0) +
    (searchResults?.materials.length || 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4" style={{paddingTop: '18px', paddingBottom: '2px', paddingLeft: '1px'}}>
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-6" style={{height: '73px', paddingLeft: '23px'}}>
          {/* Logo Oficial */}
          <div
            onClick={handleLogoClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleLogoClick();
              }
            }}
            role="button"
            tabIndex={0}
            className="flex items-center cursor-pointer hover:opacity-80 transition flex-shrink-0"
          >
            <img
              src="/manus-storage/logo-maria-imprime_acc5585b.webp"
              alt="Maria Imprime - Sua Gráfica Online"
              className="h-10 w-auto" style={{height: '62px', width: '203px', paddingBottom: '4px', paddingTop: '2px'}}
            />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
              <Input
                type="search"
                name="site-search"
                autoComplete="off"
                placeholder="Buscar produtos, materiais ou serviços…"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery && setShowResults(true)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus-visible:ring-pink-500"
                aria-label="Buscar produtos, materiais ou serviços"
                aria-controls="header-search-results"
                aria-expanded={showResults && Boolean(searchQuery)}
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchQuery && (
              <div id="header-search-results" role="status" aria-live="polite" className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500">Buscando...</div>
                ) : totalResults === 0 ? (
                  <div className="p-4 text-center text-gray-500">Nenhum resultado encontrado</div>
                ) : (
                  <div className="divide-y">
                    {searchResults?.products && searchResults.products.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700">
                          Produtos ({searchResults.products.length})
                        </div>
                        {searchResults.products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleSelectProduct(product.id)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition text-sm"
                          >
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-gray-600 text-xs">{formatProductPrice(product, priceAudience)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults?.categories && searchResults.categories.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700">
                          Categorias ({searchResults.categories.length})
                        </div>
                        {searchResults.categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              navigate(`/catalogo?segmentId=${category.id}`);
                              setSearchQuery("");
                              setShowResults(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition text-sm"
                          >
                            <div className="font-medium text-gray-900">{category.name}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults?.materials && searchResults.materials.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700">
                          Materiais ({searchResults.materials.length})
                        </div>
                        {searchResults.materials.map((material) => (
                          <div key={material.id} className="px-4 py-2 hover:bg-gray-50 transition text-sm">
                            <div className="font-medium text-gray-900">{material.name}</div>
                            {material.description && (
                              <div className="text-gray-600 text-xs">{material.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Carrinho sempre visível */}
            <CartIcon />

            {/* Sessão comercial do vendedor */}
            {isSellerSession && adminUser ? (
              <div className="flex items-center gap-2">
                <Link href="/vendedor/pedidos">
                  <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-gray-700 hover:text-pink-600">
                    <Package className="w-4 h-4" />
                    Minhas Vendas
                  </Button>
                </Link>
                <span className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-pink-700" translate="no">
                  Modo vendedor: {adminUser.name}
                </span>
                <Button onClick={handleAdminLogout} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" title="Sair do modo vendedor">
                  <LogOut className="mr-1 h-4 w-4" />Sair
                </Button>
              </div>
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAdminLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition" title="Sair"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ) : isCustomerAuth && customer ? (
              /* Cliente logado via email/senha */
              <div className="flex items-center gap-3">
                <Link href="/meus-pedidos">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1.5 text-gray-700 hover:text-pink-600"
                  >
                    <Package className="w-4 h-4" />
                    Meus Pedidos
                  </Button>
                </Link>
                <Link href="/minha-conta">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-2 ${HOME_SECONDARY_ACTION_CLASS}`}
                  >
                    <UserCircle className="w-4 h-4" />
                    <span translate="no">{customer.firstName}</span>
                  </Button>
                </Link>
                <Button
                  onClick={() => customerLogout.mutate()}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={customerLogout.isPending}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sair
                </Button>
              </div>
            ) : (
              /* Visitante */
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/cadastro">
                  <Button size="sm" className={HOME_PRIMARY_ACTION_CLASS}>
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between px-4">
          <div
            onClick={handleLogoClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleLogoClick();
              }
            }}
            role="button"
            tabIndex={0}
            className="flex items-center self-center cursor-pointer"
          >
              <img
                src="/manus-storage/logo-maria-imprime_acc5585b.webp"
                alt="Maria Imprime - Sua Gráfica Online"
                className="h-8 w-auto"
              />
          </div>

          <div className="flex items-center gap-2">
            <CartIcon />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 transition hover:bg-pink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-navigation" className="md:hidden mt-4 space-y-4 border-t pt-4">
            {/* Mobile Search */}
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden="true" />
                <Input
                  type="search"
                  name="site-search-mobile"
                  autoComplete="off"
                  placeholder="Buscar…"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                  aria-label="Buscar produtos, materiais ou serviços"
                  aria-controls="mobile-search-results"
                  aria-expanded={showResults && Boolean(searchQuery)}
                />
              </div>
              {showResults && searchQuery && (
                <div id="mobile-search-results" role="status" aria-live="polite" className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Buscando...</div>
                  ) : totalResults === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Nenhum resultado</div>
                  ) : (
                    <div className="divide-y">
                      {searchResults?.products?.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product.id)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition text-sm"
                        >
                          <div className="font-medium text-gray-900">{product.name}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile User Menu */}
            {isSellerSession && adminUser ? (
              <div className="space-y-2">
                <div className="rounded-lg bg-pink-50 px-3 py-2 text-sm font-medium text-pink-700" translate="no">Modo vendedor: {adminUser.name}</div>
                <Link href="/vendedor/pedidos">
                  <Button variant="outline" size="sm" className={`w-full justify-start ${HOME_SECONDARY_ACTION_CLASS}`} onClick={() => setMobileMenuOpen(false)}>
                    <Package className="mr-2 h-4 w-4" />Minhas Vendas
                  </Button>
                </Link>
                <Button onClick={handleAdminLogout} variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700">
                  <LogOut className="mr-2 h-4 w-4" />Sair
                </Button>
              </div>
            ) : isAuthenticated && user ? (
              /* Admin */
              <div className="space-y-2">
                <div className="text-sm text-gray-700" translate="no">{user.name || user.email}</div>
                <Button
                  onClick={handleAdminLogout}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : isCustomerAuth && customer ? (
              /* Cliente */
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-800">
                  <span translate="no">Olá, {customer.firstName}!</span>
                </div>
                <Link href="/meus-pedidos">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full justify-start ${HOME_SECONDARY_ACTION_CLASS}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Meus Pedidos
                  </Button>
                </Link>
                <Link href="/minha-conta">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Minha Conta
                  </Button>
                </Link>
                <Button
                  onClick={() => customerLogout.mutate()}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={customerLogout.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              /* Visitante */
              <div className="space-y-2">
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/cadastro">
                  <Button
                    size="sm"
                    className={`w-full ${HOME_PRIMARY_ACTION_CLASS}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
