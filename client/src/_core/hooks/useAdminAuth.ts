/**
 * useAdminAuth — versão leve de useAuth para uso no Header e componentes globais.
 *
 * Diferença em relação a useAuth():
 * - NÃO redireciona automaticamente para OAuth quando não autenticado
 * - NÃO causa loading state global que bloqueia renderização de páginas públicas
 * - Apenas expõe user/isAuthenticated/logout para uso condicional na UI
 *
 * Use este hook em componentes renderizados em TODAS as páginas (Header, etc).
 * Use useAuth({ redirectOnUnauthenticated: true }) apenas em páginas admin.
 */
import { trpc } from "@/lib/trpc";
import { useCallback } from "react";
import { TRPCClientError } from "@trpc/client";

export function useAdminAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    // Não lançar erro no console para visitantes — é comportamento esperado
    throwOnError: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        return;
      }
      throw error;
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  return {
    user: meQuery.data ?? null,
    isAuthenticated: Boolean(meQuery.data),
    loading: meQuery.isLoading || logoutMutation.isPending,
    logout,
  };
}
