import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { CustomerAuthProvider } from "./contexts/CustomerAuthContext";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // NÃO redirecionar se estamos em rota de cliente (customer auth)
  // Deixar a página lidar com o erro (ex: MyAccountPage redireciona para /login-cliente)
  const isCustomerRoute = window.location.pathname.startsWith('/minha-conta') ||
                          window.location.pathname.startsWith('/meus-pedidos') ||
                          window.location.pathname.startsWith('/pedido/') ||
                          window.location.pathname.startsWith('/rastreamento/');

  if (isCustomerRoute) return;

  // Rotas admin usam autenticação PRÓPRIA (adminAuth) — nunca redirecionar para Manus OAuth
  // O AdminProtectedRoutes já trata o redirect para /admin/login quando não autenticado
  const isAdminRoute = window.location.pathname.startsWith('/admin') ||
                       window.location.pathname.startsWith('/producao');
  if (isAdminRoute) return;

  // Para rotas públicas não-admin, não redirecionar
  return;
}

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);

    // Não logar erros UNAUTHORIZED de auth.me — é comportamento esperado para visitantes
    const queryKey = event.query.queryKey as string[];
    const isAuthMeQuery = queryKey?.some?.(k => typeof k === 'string' && k.includes('auth'));
    const isExpectedUnauth = error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG;
    if (!(isAuthMeQuery && isExpectedUnauth)) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <CustomerAuthProvider>
        <App />
      </CustomerAuthProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
