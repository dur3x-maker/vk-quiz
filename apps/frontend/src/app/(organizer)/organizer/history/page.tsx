'use client';

import { useQuery } from '@tanstack/react-query';
import { historyApi } from '@/lib/api/history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Users, Trophy } from 'lucide-react';

export default function OrganizerHistoryPage() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['organizer-history'],
    queryFn: () => historyApi.getOrganizerHistory(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">У вас пока нет истории проведённых игр</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">История проведённых игр</h1>
      
      <div className="space-y-4">
        {history.map((game) => (
          <Card key={game.roomId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{game.quizTitle}</CardTitle>
                  <CardDescription>
                    {formatDate(game.endedAt ?? game.startedAt ?? game.createdAt)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{game.participantsCount}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Топ-3 участника</p>
                  <div className="space-y-2">
                    {game.topParticipants.slice(0, 3).map((participant, index) => (
                      <div
                        key={participant.email}
                        className="flex items-center justify-between p-2 rounded-lg bg-white/40 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:bg-white/60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6">
                            {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                            {index === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                            {index === 2 && <Trophy className="w-5 h-5 text-amber-600" />}
                          </div>
                          <span className="font-medium">{participant.email}</span>
                        </div>
                        <span className="font-bold">{participant.totalPoints}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
