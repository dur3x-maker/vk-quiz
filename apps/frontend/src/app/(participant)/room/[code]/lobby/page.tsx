'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { roomsApi } from '@/lib/api/rooms';
import { useGameStore } from '@/store/game';
import { useGameEvents } from '@/hooks/use-game-events';
import { RoomPhase } from '@/types/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { participants, setRoomId } = useGameStore();

  useGameEvents(code);

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', code],
    queryFn: () => roomsApi.join({ code }),
  });

  useEffect(() => {
    if (!room) return;
    setRoomId(room.id);

    console.log('[Lobby] Room phase:', room.phase);
    if (room.phase !== RoomPhase.LOBBY) {
      if (room.phase === RoomPhase.FINISHED) {
        router.replace(`/room/${code}/results`);
      } else {
        router.replace(`/room/${code}/play`);
      }
    }
  }, [room, setRoomId, code, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Подключение к комнате...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Комната не найдена</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{room.quizTitle}</span>
            <span className="text-2xl font-mono bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">{room.code}</span>
          </CardTitle>
          <CardDescription>
            Ожидание начала игры...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Организатор скоро начнёт квиз</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Участники ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:bg-white/60"
              >
                <span className="font-medium">{participant.email}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
