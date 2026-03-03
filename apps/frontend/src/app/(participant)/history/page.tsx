'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { historyApi } from '@/lib/api/history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Trophy, History } from 'lucide-react';
import { LoadingState } from '@/components/common/loading-state';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';

export default function HistoryPage() {
  const router = useRouter();
  const { data: history, isLoading, error, refetch } = useQuery({
    queryKey: ['participant-history'],
    queryFn: () => historyApi.getParticipantHistory(),
  });

  if (isLoading) {
    return <LoadingState message="Загрузка истории..." />;
  }

  if (error) {
    return <ErrorState type="generic" message="Не удалось загрузить историю" onRetry={() => refetch()} />;
  }

  if (!history || history.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Нет истории игр"
        description="Вы ещё не участвовали ни в одном квизе. Присоединяйтесь к игре!"
        action={{
          label: 'Присоединиться к квизу',
          onClick: () => router.push('/join'),
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">История игр</h1>
      
      <div className="space-y-4">
        {history.map((game) => (
          <Card key={game.roomId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{game.quizTitle}</CardTitle>
                  <CardDescription>
                    Организатор: {game.organizerEmail}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold">#{game.rank}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Баллы</p>
                  <p className="text-lg font-semibold">{game.totalPoints}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Участников</p>
                  <p className="text-lg font-semibold">{game.totalParticipants}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Дата</p>
                  <p className="text-lg font-semibold">
                    {formatDate(game.playedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
