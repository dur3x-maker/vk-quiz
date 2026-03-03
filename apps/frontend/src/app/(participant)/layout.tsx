'use client';

import { useRoleGuard } from '@/hooks/use-role-guard';
import { Role } from '@/types/api';
import { Navbar } from '@/components/common/navbar';

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useRoleGuard(Role.PARTICIPANT);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
