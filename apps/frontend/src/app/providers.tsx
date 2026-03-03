'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) return;

    const initAuth = async () => {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        clearAuth();
        return;
      }

      try {
        const response = await authApi.refresh(storedRefreshToken);
        setAuth(response.user, response.accessToken, response.refreshToken);
      } catch (error) {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [isLoading, setAuth, clearAuth, setLoading]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        {children}
      </AuthInitializer>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
