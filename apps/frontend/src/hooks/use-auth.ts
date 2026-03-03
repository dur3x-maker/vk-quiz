import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { toast } from 'sonner';
import { Role } from '@/types/api';
import { socketManager } from '@/lib/ws/socket';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();

  useEffect(() => {
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

    if (isLoading) {
      initAuth();
    }
  }, [isLoading, setAuth, clearAuth, setLoading]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.signIn({ email, password });
      setAuth(response.user, response.accessToken, response.refreshToken);
      toast.success('Вход выполнен успешно');
      return response.user;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка входа');
      throw error;
    }
  };

  const signUp = async (email: string, password: string, role: Role) => {
    try {
      const response = await authApi.signUp({ email, password, role });
      setAuth(response.user, response.accessToken, response.refreshToken);
      toast.success('Регистрация успешна');
      return response.user;
    } catch (error: any) {
      toast.error(error.message || 'Ошибка регистрации');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { refreshToken } = useAuthStore.getState();
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      socketManager.clearOnLogout();
      router.push('/sign-in');
      toast.success('Выход выполнен');
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    logout,
  };
}
