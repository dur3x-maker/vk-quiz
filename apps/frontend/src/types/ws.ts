import { RoomPhase } from './api';

export interface JoinRoomEvent {
  roomId: string;
}

export interface StartQuizEvent {
  roomId: string;
}

export interface NextQuestionEvent {
  roomId: string;
}

export interface SubmitAnswerEvent {
  roomId: string;
  questionId: string;
  selectedOptionIds: string[];
  answerTimeMs: number;
}

export interface EndQuizEvent {
  roomId: string;
}

export interface RoomPhaseChangedPayload {
  roomId: string;
  phase: RoomPhase;
  currentQuestionIndex: number | null;
  currentRoundIndex: number | null;
}

export interface RoomPhaseSyncPayload {
  roomId: string;
  phase: RoomPhase;
  currentQuestionIndex: number | null;
  currentRoundIndex: number | null;
  participants: {
    id: string;
    email: string;
    role: string;
  }[];
}

export interface LobbyUpdatePayload {
  roomId: string;
  participants: {
    id: string;
    email: string;
    role: string;
  }[];
}

export interface NextQuestionPayload {
  roomId: string;
  roundIndex: number;
  questionIndex: number;
  roundTitle: string;
  question: {
    id: string;
    type: string;
    answerMode: string;
    text: string;
    imageUrl?: string;
    timerSeconds: number;
    points: number;
    options: {
      id: string;
      text: string;
    }[];
  };
}

export interface TimerTickPayload {
  roomId: string;
  questionId: string;
  secondsRemaining: number;
}

export interface AnswerReceivedPayload {
  roomId: string;
  userId: string;
  questionId: string;
}

export interface AnswerResultPayload {
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface LeaderboardUpdatePayload {
  roomId: string;
  leaderboard: {
    userId: string;
    email: string;
    totalPoints: number;
    rank: number;
  }[];
}

export interface QuizEndedPayload {
  roomId: string;
  finalLeaderboard: {
    userId: string;
    email: string;
    totalPoints: number;
    rank: number;
  }[];
}

export interface WsError {
  code: string;
  message: string;
}
