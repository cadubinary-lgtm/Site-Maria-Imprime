/**
 * Hook de autenticação para administradores do sistema.
 * Usa a autenticação própria (email/senha) independente do Manus OAuth.
 */

import { trpc } from "@/lib/trpc";
import { useAdminAuth as useManusAdminAuth } from "@/_core/hooks/useAdminAuth";
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
  const manusAuth = useManusAdminAuth();
  const manusUser = manusAuth.user;
  const usesManusAuth = typeof window !== "undefined" &&
    (window.location.hostname.includes("manus.") || window.location.hostname.includes("manus.space"));
  const manusRole = String(manusUser?.role ?? "");
  const isManusAdministrator = manusRole === "admin" || manusRole === "superadmin";
  const manusAdminUser = usesManusAuth && manusAuth.isAuthenticated && manusUser && isManusAdministrator
    ? {
        id: manusUser.id,
        name: manusUser.name || "Administrador",
        email: manusUser.email || "",
        role: manusRole === "superadmin" ? "superadmin" : "admin",
      }
    : null;
  const effectiveAdminUser = adminUser ?? manusAdminUser;

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password });
    await refetch();
    return result;
  }, [loginMutation, refetch]);

  const logout = useCallback(async () => {
    if (!adminUser && manusAdminUser) {
      await manusAuth.logout();
      return;
    }
    await logoutMutation.mutateAsync();
    await refetch();
    window.location.href = "/admin/login";
  }, [adminUser, logoutMutation, manusAdminUser, manusAuth, refetch]);

  return {
    adminUser: effectiveAdminUser,
    isLoading: isLoading || (usesManusAuth && manusAuth.loading),
    login,
    logout,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
  };
}
