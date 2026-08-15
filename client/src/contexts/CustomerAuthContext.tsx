import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  cpfCnpj: string | null;
  emailVerified: boolean;
  status: string;
  priceTier: "final" | "reseller";
  createdAt: number;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({
  customer: null,
  isLoading: true,
  isAuthenticated: false,
  refetch: () => {},
});

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.customerAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <CustomerAuthContext.Provider
      value={{
        customer: (data as Customer | null) ?? null,
        isLoading,
        isAuthenticated: !!data,
        refetch,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
