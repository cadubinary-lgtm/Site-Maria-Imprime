/**
 * Hook de autenticação para administradores do sistema.
 * Usa a autenticação própria (email/senha) independente do Manus OAuth.
 */

import { trpc } from "@/lib/trpc";
import { useCallback } from "react";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "production";
};

export function useAdminAuth() {
  const { data: adminUser, isLoading, refetch } = trpc.adminAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60 * 1000, // 1 minuto
  });

  const loginMutation = trpc.adminAuth.login.useMutation();
  const logoutMutation = trpc.adminAuth.logout.useMutation();

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    await refetch();
    return result;
  }, [loginMutation, refetch]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    await refetch();
    window.location.href = "/admin/login";
  }, [logoutMutation, refetch]);

  return {
    adminUser: adminUser ?? null,
    isLoading,
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
  };
}
