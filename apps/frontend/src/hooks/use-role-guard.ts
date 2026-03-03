import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Role } from '@/types/api';

export function useRoleGuard(requiredRole?: Role) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      if (user?.role === Role.ORGANIZER) {
        router.push('/organizer/quizzes');
      } else {
        router.push('/join');
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  return { user, isAuthenticated, isLoading };
}
