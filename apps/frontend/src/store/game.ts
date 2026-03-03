import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NextQuestionPayload } from '@/types/ws';
import { RoomPhase } from '@/types/api';

interface Participant {
  id: string;
  email: string;
  role: string;
}

interface LeaderboardEntry {
  userId: string;
  email: string;
  totalPoints: number;
  rank: number;
}

interface SubmittedAnswer {
  questionId: string;
  selectedOptionIds: string[];
  answerTimeMs: number;
  submittedAt: number;
  isCorrect?: boolean;
  pointsAwarded?: number;
}

interface GameState {
  roomId: string | null;
  phase: RoomPhase;
  participants: Participant[];
  currentQuestion: NextQuestionPayload | null;
  currentQuestionId: string | null;
  timerSeconds: number;
  serverTimerSeconds: number | null;
  lastTimerSync: number | null;
  leaderboard: LeaderboardEntry[];
  submittedAnswers: Record<string, SubmittedAnswer>;
  processedEvents: Record<string, boolean>;
  isSocketConnected: boolean;
  isReconnecting: boolean;
  disconnectReason: string | null;

  setRoomId: (roomId: string) => void;
  setPhase: (phase: RoomPhase) => void;
  setSocketConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setDisconnectReason: (reason: string | null) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  setCurrentQuestion: (question: NextQuestionPayload | null) => void;
  setTimer: (seconds: number) => void;
  syncTimer: (serverSeconds: number) => void;
  decrementTimer: () => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;
  shouldProcessEvent: (eventKey: string) => boolean;
  markEventProcessed: (eventKey: string) => void;
  canSubmitAnswer: (questionId: string) => boolean;
  submitAnswer: (answer: SubmittedAnswer) => void;
  updateAnswerResult: (questionId: string, isCorrect: boolean, points: number) => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  phase: RoomPhase.LOBBY,
  participants: [],
  currentQuestion: null,
  currentQuestionId: null,
  timerSeconds: 0,
  serverTimerSeconds: null,
  lastTimerSync: null,
  leaderboard: [],
  submittedAnswers: {},
  processedEvents: {},
  isSocketConnected: false,
  isReconnecting: false,
  disconnectReason: null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setRoomId: (roomId) => set({ roomId }),
      
      setPhase: (phase) => set({ phase }),
      
      setSocketConnected: (connected) => set({ isSocketConnected: connected }),
      
      setReconnecting: (reconnecting) => set({ isReconnecting: reconnecting }),
      
      setDisconnectReason: (reason) => set({ disconnectReason: reason }),
      
      setParticipants: (participants) => set({ participants }),
      
      addParticipant: (participant) =>
        set((state) => ({
          participants: [...state.participants, participant],
        })),
      
      setCurrentQuestion: (currentQuestion) => {
        const questionId = currentQuestion?.question.id || null;
        const hasAnswered = questionId ? !!get().submittedAnswers[questionId] : false;
        
        set({
          currentQuestion,
          currentQuestionId: questionId,
        });
      },
      
      setTimer: (timerSeconds) => set({ timerSeconds }),
      
      syncTimer: (serverSeconds) => set({
        serverTimerSeconds: serverSeconds,
        timerSeconds: serverSeconds,
        lastTimerSync: Date.now(),
      }),
      
      decrementTimer: () => {
        const { timerSeconds, serverTimerSeconds, lastTimerSync } = get();
        
        if (serverTimerSeconds !== null && lastTimerSync !== null) {
          const elapsed = Math.floor((Date.now() - lastTimerSync) / 1000);
          const correctedTime = Math.max(0, serverTimerSeconds - elapsed);
          set({ timerSeconds: correctedTime });
        } else {
          set({ timerSeconds: Math.max(0, timerSeconds - 1) });
        }
      },
      
      setLeaderboard: (leaderboard) => set({ leaderboard }),
      
      shouldProcessEvent: (eventKey) => {
        const { processedEvents } = get();
        return !processedEvents[eventKey];
      },
      
      markEventProcessed: (eventKey) => {
        set((state) => {
          const newProcessed = { ...state.processedEvents };
          newProcessed[eventKey] = true;
          
          const keys = Object.keys(newProcessed);
          if (keys.length > 100) {
            const toDelete = keys.slice(0, keys.length - 100);
            toDelete.forEach(k => delete newProcessed[k]);
          }
          
          return { processedEvents: newProcessed };
        });
      },
      
      canSubmitAnswer: (questionId) => {
        const { currentQuestionId, submittedAnswers } = get();
        return questionId === currentQuestionId && !submittedAnswers[questionId];
      },
      
      submitAnswer: (answer) => {
        if (!get().canSubmitAnswer(answer.questionId)) {
          return;
        }
        
        set((state) => ({
          submittedAnswers: {
            ...state.submittedAnswers,
            [answer.questionId]: answer,
          },
        }));
      },
      
      updateAnswerResult: (questionId, isCorrect, points) => {
        set((state) => {
          const answer = state.submittedAnswers[questionId];
          if (!answer) return state;
          
          return {
            submittedAnswers: {
              ...state.submittedAnswers,
              [questionId]: {
                ...answer,
                isCorrect,
                pointsAwarded: points,
              },
            },
          };
        });
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'vkquiz-game-state',
      partialize: (state) => ({
        roomId: state.roomId,
        currentQuestionId: state.currentQuestionId,
        submittedAnswers: state.submittedAnswers,
        participants: state.participants,
        leaderboard: state.leaderboard,
      }),
    }
  )
);
