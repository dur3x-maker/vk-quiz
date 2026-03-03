import { io, Socket } from 'socket.io-client';
import {
  JoinRoomEvent,
  StartQuizEvent,
  NextQuestionEvent,
  SubmitAnswerEvent,
  EndQuizEvent,
  RoomPhaseChangedPayload,
  RoomPhaseSyncPayload,
  LobbyUpdatePayload,
  NextQuestionPayload,
  TimerTickPayload,
  AnswerReceivedPayload,
  AnswerResultPayload,
  LeaderboardUpdatePayload,
  QuizEndedPayload,
  WsError,
} from '@/types/ws';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

interface ServerToClientEvents {
  'room.phase_changed': (payload: RoomPhaseChangedPayload) => void;
  'room.phase_sync': (payload: RoomPhaseSyncPayload) => void;
  'lobby.update': (payload: LobbyUpdatePayload) => void;
  'quiz.next_question': (payload: NextQuestionPayload) => void;
  'quiz.timer_tick': (payload: TimerTickPayload) => void;
  'quiz.answer_received': (payload: AnswerReceivedPayload) => void;
  'quiz.answer_result': (payload: AnswerResultPayload) => void;
  'quiz.leaderboard_update': (payload: LeaderboardUpdatePayload) => void;
  'quiz.ended': (payload: QuizEndedPayload) => void;
  error: (error: WsError) => void;
}

interface ClientToServerEvents {
  'room.join': (event: JoinRoomEvent) => void;
  'quiz.start': (event: StartQuizEvent) => void;
  'quiz.next_question': (event: NextQuestionEvent) => void;
  'quiz.submit_answer': (event: SubmitAnswerEvent) => void;
  'quiz.end': (event: EndQuizEvent) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketManager {
  private socket: TypedSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private pendingAnswers: Set<string> = new Set();
  private currentToken: string | null = null;

  connect(accessToken: string): TypedSocket {
    if (this.socket?.connected && this.currentToken === accessToken) {
      return this.socket;
    }

    if (this.currentToken && this.currentToken !== accessToken) {
      console.log('[WS] Token changed, disconnecting old socket');
      this.disconnect();
    }

    if (this.socket && !this.socket.connected) {
      console.log('[WS] Reconnecting existing socket');
      this.socket.connect();
      this.currentToken = accessToken;
      return this.socket;
    }

    console.log('[WS] Creating new socket connection');
    this.currentToken = accessToken;

    this.socket = io(WS_URL, {
      auth: {
        token: accessToken,
      },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.3,
      timeout: 15000,
      transports: ['websocket', 'polling'],
    }) as TypedSocket;

    this.socket.on('connect', () => {
      console.log('[WS] Connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[WS] Connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[WS] Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error: WsError) => {
      console.error('[WS] Error:', error);
      if (error.code === 'UNAUTHORIZED') {
        this.currentToken = null;
        this.disconnect();
      }
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('[WS] Disconnecting socket');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.currentToken = null;
      this.reconnectAttempts = 0;
      this.pendingAnswers.clear();
    }
  }

  clearOnLogout() {
    this.disconnect();
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  emitJoinRoom(data: JoinRoomEvent) {
    if (!this.socket?.connected) {
      console.warn('[WS] Cannot emit - socket not connected');
      return;
    }
    this.socket.emit('room.join', data);
  }

  emitStartQuiz(data: StartQuizEvent) {
    if (!this.socket?.connected) {
      console.warn('[WS] Cannot emit - socket not connected');
      return;
    }
    this.socket.emit('quiz.start', data);
  }

  emitNextQuestion(data: NextQuestionEvent) {
    if (!this.socket?.connected) {
      console.warn('[WS] Cannot emit - socket not connected');
      return;
    }
    this.socket.emit('quiz.next_question', data);
  }

  emitEndQuiz(data: EndQuizEvent) {
    if (!this.socket?.connected) {
      console.warn('[WS] Cannot emit - socket not connected');
      return;
    }
    this.socket.emit('quiz.end', data);
  }

  submitAnswer(data: SubmitAnswerEvent): boolean {
    const key = `${data.roomId}_${data.questionId}`;
    
    if (this.pendingAnswers.has(key)) {
      console.warn('[WS] Answer submission already in progress:', key);
      return false;
    }
    
    if (!this.socket?.connected) {
      console.warn('[WS] Cannot submit answer - socket not connected');
      return false;
    }
    
    this.pendingAnswers.add(key);
    this.socket.emit('quiz.submit_answer', data);
    
    setTimeout(() => {
      this.pendingAnswers.delete(key);
    }, 5000);
    
    return true;
  }

}

export const socketManager = new SocketManager();
