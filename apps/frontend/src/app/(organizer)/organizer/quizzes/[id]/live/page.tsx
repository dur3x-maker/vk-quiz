'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { quizzesApi } from '@/lib/api/quizzes';
import { roomsApi } from '@/lib/api/rooms';
import { socketManager } from '@/lib/ws/socket';
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';
import { useGameTimer } from '@/hooks/use-game-timer';
import { RoomPhase } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Play, SkipForward, StopCircle, Timer, Trophy } from 'lucide-react';
import type {
  RoomPhaseChangedPayload,
  RoomPhaseSyncPayload,
  LobbyUpdatePayload,
  NextQuestionPayload,
  TimerTickPayload,
  LeaderboardUpdatePayload,
  QuizEndedPayload,
} from '@/types/ws';

export default function LiveControlPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const quizId = params.id as string;
  const roomId = searchParams.get('roomId');
  const { accessToken } = useAuthStore();
  const {
    phase,
    participants,
    currentQuestion,
    leaderboard,
    setRoomId,
    setPhase,
    setParticipants,
    setCurrentQuestion,
    syncTimer,
    setLeaderboard,
  } = useGameStore();
  const timerSeconds = useGameTimer();

  const [roomCode, setRoomCode] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isNexting, setIsNexting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const { data: quiz } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizzesApi.getById(quizId),
  });

  const { data: room } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => roomsApi.getById(roomId!),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (!roomId || !accessToken) return;

    setRoomId(roomId);
    const socket = socketManager.connect(accessToken);

    const handleConnect = () => {
      console.log('[Organizer Live] Connected, joining room:', roomId);
      socket.emit('room.join', { roomId });
    };

    const handleDisconnect = (reason: string) => {
      console.log('[Organizer Live] Disconnected:', reason);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('room.phase_sync', (payload: RoomPhaseSyncPayload) => {
      console.log('[Organizer Live] phase_sync:', payload.phase);
      setPhase(payload.phase);
      setParticipants(payload.participants.map(p => ({
        id: p.id,
        email: p.email,
        role: p.role,
      })));
    });

    socket.on('lobby.update', (payload: LobbyUpdatePayload) => {
      console.log('[Organizer Live] lobby.update:', payload.participants.length);
      setParticipants(payload.participants.map(p => ({
        id: p.id,
        email: p.email,
        role: p.role,
      })));
    });

    socket.on('room.phase_changed', (payload: RoomPhaseChangedPayload) => {
      console.log('[Organizer Live] phase_changed:', payload.phase);
      setPhase(payload.phase);
      setIsStarting(false);
      setIsNexting(false);
      if (payload.phase === RoomPhase.FINISHED) {
        setIsEnding(false);
        toast.success('Квиз завершён');
      }
    });

    socket.on('quiz.next_question', (payload: NextQuestionPayload) => {
      console.log('[Organizer Live] next_question:', payload.question.id);
      setCurrentQuestion(payload);
      syncTimer(payload.question.timerSeconds);
      setIsNexting(false);
    });

    socket.on('quiz.timer_tick', (payload: TimerTickPayload) => {
      syncTimer(payload.secondsRemaining);
    });

    socket.on('quiz.leaderboard_update', (payload: LeaderboardUpdatePayload) => {
      setLeaderboard(payload.leaderboard);
    });

    socket.on('quiz.ended', (payload: QuizEndedPayload) => {
      setLeaderboard(payload.finalLeaderboard);
      setPhase(RoomPhase.FINISHED);
      setIsEnding(false);
      toast.success('Квиз завершён');
    });

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('room.phase_sync');
      socket.off('lobby.update');
      socket.off('room.phase_changed');
      socket.off('quiz.next_question');
      socket.off('quiz.timer_tick');
      socket.off('quiz.leaderboard_update');
      socket.off('quiz.ended');
    };
  }, [roomId, accessToken]);

  useEffect(() => {
    if (room) {
      setRoomCode(room.code);
    }
  }, [room]);

  const handleStart = () => {
    if (!roomId) return;
    setIsStarting(true);
    const socket = socketManager.getSocket();
    socket?.emit('quiz.start', { roomId });
  };

  const handleNext = () => {
    if (!roomId) return;
    setIsNexting(true);
    const socket = socketManager.getSocket();
    socket?.emit('quiz.next_question', { roomId });
  };

  const handleEnd = () => {
    if (!roomId || !confirm('Завершить квиз?')) return;
    setIsEnding(true);
    const socket = socketManager.getSocket();
    socket?.emit('quiz.end', { roomId });
  };

  const handleFinish = () => {
    router.push('/organizer/quizzes');
  };

  if (!roomId) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Room ID не найден</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quiz?.title || 'Квиз'}</h1>
          <p className="text-muted-foreground">
            Код комнаты: <span className="font-mono text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">{roomCode}</span>
          </p>
        </div>
        <div className="flex gap-2">
          {phase === RoomPhase.LOBBY && (
            <Button onClick={handleStart} disabled={isStarting || participants.length === 0} size="lg">
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? 'Запуск...' : 'Начать квиз'}
            </Button>
          )}
          {(phase === RoomPhase.PREPARING || phase === RoomPhase.QUESTION || phase === RoomPhase.RESULT) && (
            <Button onClick={handleNext} disabled={isNexting} size="lg">
              <SkipForward className="w-4 h-4 mr-2" />
              {isNexting ? 'Загрузка...' : 'Следующий вопрос'}
            </Button>
          )}
          {phase !== RoomPhase.LOBBY && phase !== RoomPhase.FINISHED && (
            <Button onClick={handleEnd} disabled={isEnding} variant="destructive" size="lg">
              <StopCircle className="w-4 h-4 mr-2" />
              {isEnding ? 'Завершение...' : 'Завершить'}
            </Button>
          )}
          {phase === RoomPhase.FINISHED && (
            <Button onClick={handleFinish} size="lg">
              Закрыть
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Участники ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {participants.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Ожидание участников...
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:bg-white/60 animate-slide-up"
                  >
                    <span className="font-medium">{participant.email}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статус игры</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Фаза</p>
              <p className="text-2xl font-bold">
                {phase === RoomPhase.LOBBY && 'Лобби'}
                {phase === RoomPhase.PREPARING && 'Подготовка'}
                {phase === RoomPhase.QUESTION && 'Вопрос'}
                {phase === RoomPhase.RESULT && 'Результаты'}
                {phase === RoomPhase.FINISHED && 'Завершено'}
              </p>
            </div>

            {currentQuestion && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Текущий вопрос</p>
                  <p className="font-medium">{currentQuestion.question.text}</p>
                </div>

                {phase === RoomPhase.QUESTION && (
                  <div className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary" />
                    <span className="text-3xl font-bold">{timerSeconds}с</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {leaderboard.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Лидерборд
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 10).map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30 transition-all duration-200 hover:bg-white/60 hover:translate-y-[-1px] hover:shadow-md ${entry.rank === 1 ? 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-transparent' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-muted-foreground w-8">
                      {entry.rank}
                    </span>
                    <span className="font-medium">{entry.email}</span>
                  </div>
                  <span className="text-xl font-bold">{entry.totalPoints}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
