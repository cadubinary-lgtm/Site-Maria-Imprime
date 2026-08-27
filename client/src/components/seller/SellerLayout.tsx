import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { BarChart3, ClipboardList, FileText, LogOut, Menu, PlusCircle, ReceiptText, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navigation = [
  { href: "/vendedor", label: "Visão geral", icon: BarChart3 },
  { href: "/vendedor/vendas/nova", label: "Nova venda", icon: PlusCircle },
  { href: "/vendedor/pedidos", label: "Meus pedidos", icon: ClipboardList },
  { href: "/vendedor/orcamentos", label: "Meus orçamentos", icon: FileText },
  { href: "/vendedor/comissoes", label: "Minhas comissões", icon: ReceiptText },
];

export default function SellerLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const [location] = useLocation();
  const { adminUser, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside className="flex h-full w-72 flex-col bg-slate-950 px-4 py-5 text-slate-100 shadow-xl">
      <div className="mb-8 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-400">Maria Imprime</p>
        <h1 className="mt-1 text-lg font-semibold">Central do Vendedor</h1>
      </div>
      <nav className="space-y-1" aria-label="Navegação do vendedor">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
            location === href ? "bg-pink-600 font-semibold text-white shadow-lg shadow-pink-950/40" : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/80 p-3">
        <p className="truncate text-sm font-medium">{adminUser?.name ?? "Vendedor"}</p>
        <p className="truncate text-xs text-slate-400">{adminUser?.email ?? ""}</p>
        <Button variant="ghost" onClick={() => logout()} className="mt-3 h-8 w-full justify-start px-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white">
          <LogOut className="mr-2 h-3.5 w-3.5" /> Sair
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{sidebar}</div>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-slate-950/55" onClick={() => setMobileOpen(false)} /><div className="relative h-full w-72">{sidebar}<Button variant="ghost" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 text-white"><X /></Button></div></div>}
      <main className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu do vendedor"><Menu className="h-5 w-5" /></Button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900">{title}</h2>
            <p className="hidden text-sm text-slate-500 sm:block">{description}</p>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
