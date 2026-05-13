import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X, LogOut, User } from "lucide-react";
import { toast } from "sonner";

export default function Header() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: searchResults, isLoading: isSearching } = trpc.search.global.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  // Fechar resultados ao clicar fora
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

  const handleSelectProduct = (productId: number, productName: string) => {
    navigate(`/produto/${productId}`);
    setSearchQuery("");
    setShowResults(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Desconectado com sucesso");
    navigate("/");
    setMobileMenuOpen(false);
  };

  const totalResults = (searchResults?.products.length || 0) +
    (searchResults?.categories.length || 0) +
    (searchResults?.materials.length || 0);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
              <img 
                src="/manus-storage/logo-ponto-digital_8ede665b.webp" 
                alt="Gráfica Ponto Digital" 
                className="h-12 w-auto"
              />
            </div>
          </Link>

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
                    {/* Produtos */}
                    {searchResults?.products && searchResults.products.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700">
                          Produtos ({searchResults.products.length})
                        </div>
                        {searchResults.products.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleSelectProduct(product.id, product.name)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 transition text-sm"
                          >
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-gray-600 text-xs">R$ {parseFloat(product.price).toFixed(2)}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Categorias */}
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

                    {/* Materiais */}
                    {searchResults?.materials && searchResults.materials.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 font-semibold text-sm text-gray-700">
                          Materiais ({searchResults.materials.length})
                        </div>
                        {searchResults.materials.map((material) => (
                          <div
                            key={material.id}
                            className="px-4 py-2 hover:bg-gray-50 transition text-sm"
                          >
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
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span className="text-gray-700">{user.name || user.email}</span>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Sair
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login">
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
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <img 
                src="/manus-storage/logo-ponto-digital_8ede665b.webp" 
                alt="Gráfica Ponto Digital" 
                className="h-10 w-auto"
              />
            </div>
          </Link>

          {/* Search Icon */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Menu Toggle */}
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

              {/* Mobile Search Results */}
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
                          onClick={() => handleSelectProduct(product.id, product.name)}
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
              <div className="space-y-2">
                <div className="text-sm text-gray-700">{user.name || user.email}</div>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/cadastro">
                  <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
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
