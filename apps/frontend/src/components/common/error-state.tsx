'use client';

import { AlertCircle, Lock, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  type: '401' | '403' | 'not-found' | 'invalid-code' | 'expired-token' | 'generic';
  message?: string;
  onRetry?: () => void;
}

const errorConfig = {
  '401': {
    icon: Lock,
    title: 'Требуется авторизация',
    description: 'Пожалуйста, войдите в систему для продолжения',
  },
  '403': {
    icon: Lock,
    title: 'Доступ запрещён',
    description: 'У вас нет прав для доступа к этому ресурсу',
  },
  'not-found': {
    icon: Search,
    title: 'Комната не найдена',
    description: 'Комната с таким кодом не существует или была удалена',
  },
  'invalid-code': {
    icon: AlertCircle,
    title: 'Неверный код',
    description: 'Проверьте правильность введённого кода комнаты',
  },
  'expired-token': {
    icon: RefreshCw,
    title: 'Сессия истекла',
    description: 'Ваша сессия истекла. Пожалуйста, войдите заново',
  },
  'generic': {
    icon: AlertCircle,
    title: 'Произошла ошибка',
    description: 'Что-то пошло не так. Попробуйте ещё раз',
  },
};

export function ErrorState({ type, message, onRetry }: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-red-50/60 backdrop-blur-sm border border-red-200/40 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {message || config.description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Попробовать снова
        </Button>
      )}
    </div>
  );
}
