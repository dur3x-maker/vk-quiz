// Re-export all WS event types from the canonical ws.ts file
export type {
  RoomPhaseChangedPayload,
  RoomPhaseSyncPayload,
  NextQuestionPayload,
  TimerTickPayload,
  AnswerResultPayload,
  LeaderboardUpdatePayload,
  QuizEndedPayload,
  WsError,
} from './ws';
