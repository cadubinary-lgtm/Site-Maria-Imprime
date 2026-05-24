import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdminAuth } from "@/_core/hooks/useAdminAuth";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X, LogOut, User, Settings, ShoppingCart, UserCircle } from "lucide-react";
import { toast } from "sonner";

function CartIcon() {
  const { data: count } = trpc.cart.getCount.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const cartCount = Number(count ?? 0);
  return (
    <Link href="/carrinho">
      <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
        <ShoppingCart className="w-5 h-5 text-gray-600" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </button>
    </Link>
  );
}

export default function Header() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAdminAuth();
  const { customer, isAuthenticated: isCustomerAuth, refetch: refetchCustomer } = useCustomerAuth();
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
    await logout();
    toast.success("Desconectado com sucesso");
    navigate("/");
    setMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate("/");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  const totalResults =
    (searchResults?.products.length || 0) +
    (searchResults?.categories.length || 0) +
    (searchResults?.materials.length || 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-6">
          {/* Logo */}
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
          >
            <img
              src="/manus-storage/logo-ponto-digital_8ede665b.webp"
              alt="Gráfica Ponto Digital"
              className="h-12 w-auto"
            />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar produtos, materiais ou serviços…"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => searchQuery && setShowResults(true)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
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
                            <div className="text-gray-600 text-xs">R$ {parseFloat(product.price).toFixed(2)}</div>
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
                              navigate(`/categoria/${category.id}`);
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

            {/* Admin logado via Manus OAuth */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <Link href="/admin">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Painel Admin
                  </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span className="text-gray-700">{user.name || user.email}</span>
                </div>
                <Button
                  onClick={handleAdminLogout}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sair
                </Button>
              </div>
            ) : isCustomerAuth && customer ? (
              /* Cliente logado via email/senha */
              <div className="flex items-center gap-3">
                <Link href="/minha-conta">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 flex items-center gap-2"
                  >
                    <UserCircle className="w-4 h-4" />
                    {customer.firstName}
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
                <Link href="/login-cliente">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/cadastro">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img
                src="/manus-storage/logo-ponto-digital_8ede665b.webp"
                alt="Gráfica Ponto Digital"
                className="h-10 w-auto"
              />
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <CartIcon />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
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
          <div className="md:hidden mt-4 space-y-4 border-t pt-4">
            {/* Mobile Search */}
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar…"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg"
                />
              </div>
              {showResults && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
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
            {isAuthenticated && user ? (
              /* Admin */
              <div className="space-y-2">
                <div className="text-sm text-gray-700">{user.name || user.email}</div>
                <Link href="/admin">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Painel Admin
                  </Button>
                </Link>
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
                  Olá, {customer.firstName}!
                </div>
                <Link href="/minha-conta">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start border-orange-200 text-orange-700"
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
                <Link href="/login-cliente">
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
                    className="w-full bg-orange-500 hover:bg-orange-600"
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
