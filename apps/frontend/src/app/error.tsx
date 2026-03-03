'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-destructive">Ошибка</h1>
          <p className="text-muted-foreground">
            Произошла непредвиденная ошибка
          </p>
        </div>
        
        {error.message && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-mono">
              {error.message}
            </p>
          </div>
        )}

        <button
          onClick={reset}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Попробовать снова
        </button>

        <button
          onClick={() => window.location.href = '/'}
          className="w-full px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  );
}
