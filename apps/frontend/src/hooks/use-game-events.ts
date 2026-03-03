import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { socketManager } from '@/lib/ws/socket';
import { useGameStore } from '@/store/game';
import { useAuthStore } from '@/store/auth';
import { RoomPhase } from '@/types/api';
import type {
  RoomPhaseChangedPayload,
  RoomPhaseSyncPayload,
  LobbyUpdatePayload,
  NextQuestionPayload,
  TimerTickPayload,
  AnswerResultPayload,
  LeaderboardUpdatePayload,
  QuizEndedPayload,
} from '@/types/ws';

function navigateByPhase(phase: RoomPhase, roomCode: string, router: ReturnType<typeof useRouter>) {
  switch (phase) {
    case RoomPhase.LOBBY:
      router.replace(`/room/${roomCode}/lobby`);
      break;
    case RoomPhase.PREPARING:
    case RoomPhase.QUESTION:
    case RoomPhase.RESULT:
      router.replace(`/room/${roomCode}/play`);
      break;
    case RoomPhase.FINISHED:
      router.replace(`/room/${roomCode}/results`);
      break;
  }
}

export function useGameEvents(roomCode: string) {
  const router = useRouter();
  const { accessToken } = useAuthStore();
  const {
    roomId,
    setPhase,
    setCurrentQuestion,
    syncTimer,
    setLeaderboard,
    updateAnswerResult,
    setParticipants,
    setSocketConnected,
    setReconnecting,
    setDisconnectReason,
  } = useGameStore();
  
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    if (!accessToken || !roomId) return;

    const socket = socketManager.connect(accessToken);

    const handleConnect = () => {
      console.log('[GameEvents] Connected, joining room:', roomId);
      setReconnecting(false);
      setSocketConnected(true);
      setDisconnectReason(null);
      socket.emit('room.join', { roomId });
      hasJoinedRef.current = true;
    };

    const handleDisconnect = (reason: string) => {
      console.log('[GameEvents] Disconnected:', reason);
      setSocketConnected(false);
      setDisconnectReason(reason);
      if (reason !== 'io client disconnect') {
        setReconnecting(true);
      }
      hasJoinedRef.current = false;
    };

    const handleConnectError = (error: Error) => {
      console.error('[GameEvents] Connect error:', error.message);
      setDisconnectReason('connect_error');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    socket.on('room.phase_sync', (payload: RoomPhaseSyncPayload) => {
      console.log('[GameEvents] phase_sync:', payload.phase);
      setPhase(payload.phase);
      setParticipants(payload.participants.map(p => ({
        id: p.id,
        email: p.email,
        role: p.role,
      })));
    });

    socket.on('lobby.update', (payload: LobbyUpdatePayload) => {
      console.log('[GameEvents] lobby.update:', payload.participants.length);
      setParticipants(payload.participants.map(p => ({
        id: p.id,
        email: p.email,
        role: p.role,
      })));
    });

    socket.on('room.phase_changed', (payload: RoomPhaseChangedPayload) => {
      console.log('[GameEvents] phase_changed:', payload.phase);
      setPhase(payload.phase);
      navigateByPhase(payload.phase, roomCode, router);
    });

    socket.on('quiz.next_question', (payload: NextQuestionPayload) => {
      console.log('[GameEvents] next_question:', payload.question.id);
      setCurrentQuestion(payload);
      syncTimer(payload.question.timerSeconds);
      setPhase(RoomPhase.QUESTION);
    });

    socket.on('quiz.timer_tick', (payload: TimerTickPayload) => {
      syncTimer(payload.secondsRemaining);
    });

    socket.on('quiz.answer_result', (payload: AnswerResultPayload) => {
      const { currentQuestionId } = useGameStore.getState();
      if (!currentQuestionId) return;
      
      updateAnswerResult(currentQuestionId, payload.isCorrect, payload.pointsAwarded);
      
      if (payload.isCorrect) {
        toast.success(`Правильно! +${payload.pointsAwarded} баллов`);
      } else {
        toast.error('Неправильно');
      }
    });

    socket.on('quiz.leaderboard_update', (payload: LeaderboardUpdatePayload) => {
      setLeaderboard(payload.leaderboard);
    });

    socket.on('quiz.ended', (payload: QuizEndedPayload) => {
      setLeaderboard(payload.finalLeaderboard);
      setPhase(RoomPhase.FINISHED);
      router.push(`/room/${roomCode}/results`);
    });

    if (socket.connected && !hasJoinedRef.current) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('room.phase_sync');
      socket.off('lobby.update');
      socket.off('room.phase_changed');
      socket.off('quiz.next_question');
      socket.off('quiz.timer_tick');
      socket.off('quiz.answer_result');
      socket.off('quiz.leaderboard_update');
      socket.off('quiz.ended');
      hasJoinedRef.current = false;
    };
  }, [accessToken, roomId, roomCode]);
}
