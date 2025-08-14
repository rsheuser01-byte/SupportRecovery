import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Handle inactivity logout responses
  useEffect(() => {
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage?.includes('inactivity') || errorMessage?.includes('Session expired')) {
        // Clear all cached data and redirect to logout
        queryClient.clear();
        window.location.href = '/api/logout';
      }
    }
  }, [error, queryClient]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: () => {
      queryClient.clear();
      window.location.href = '/api/logout';
    },
  };
}