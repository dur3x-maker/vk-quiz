'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Role } from '@/types/api';
import { LogOut, User } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={user.role === Role.ORGANIZER ? '/organizer/quizzes' : '/join'}>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">VK Quiz</h1>
          </Link>
          
          {user.role === Role.ORGANIZER ? (
            <div className="flex gap-4">
              <Link href="/organizer/quizzes">
                <Button variant="ghost">Мои квизы</Button>
              </Link>
              <Link href="/organizer/history">
                <Button variant="ghost">История</Button>
              </Link>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link href="/join">
                <Button variant="ghost">Присоединиться</Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost">История</Button>
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Выйти
          </Button>
        </div>
      </div>
    </nav>
  );
}
