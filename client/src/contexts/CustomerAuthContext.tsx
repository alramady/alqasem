import { createContext, useContext, ReactNode, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface CustomerData {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  avatar: string | null;
  preferredLanguage: string;
  isVerified: boolean;
  createdAt: Date;
}

interface CustomerAuthContextType {
  customer: CustomerData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  refetch: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const { data: customer, isLoading, refetch } = trpc.customer.me.useQuery(undefined, {
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <CustomerAuthContext.Provider value={{
      customer: customer ?? null,
      isLoading,
      isLoggedIn: !!customer,
      refetch,
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
