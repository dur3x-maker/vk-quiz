import { IsString, IsUUID, IsArray, IsInt, Min } from 'class-validator';
import { RoomPhase } from '@prisma/client';

export class JoinRoomEventDto {
  @IsString()
  @IsUUID()
  roomId: string;
}

export class StartQuizEventDto {
  @IsString()
  @IsUUID()
  roomId: string;
}

export class NextQuestionEventDto {
  @IsString()
  @IsUUID()
  roomId: string;
}

export class SubmitAnswerEventDto {
  @IsString()
  @IsUUID()
  roomId: string;

  @IsString()
  @IsUUID()
  questionId: string;

  @IsArray()
  @IsString({ each: true })
  selectedOptionIds: string[];

  @IsInt()
  @Min(0)
  answerTimeMs: number;
}

export class EndQuizEventDto {
  @IsString()
  @IsUUID()
  roomId: string;
}

export interface RoomUserJoinedPayload {
  roomId: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface LobbyUpdatePayload {
  roomId: string;
  participants: Array<{
    id: string;
    email: string;
    role: string;
  }>;
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
  participants: Array<{
    id: string;
    email: string;
    role: string;
  }>;
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
    options: Array<{
      id: string;
      text: string;
    }>;
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

export interface LeaderboardUpdatePayload {
  roomId: string;
  leaderboard: Array<{
    userId: string;
    email: string;
    totalPoints: number;
    rank: number;
  }>;
}

export interface QuizEndedPayload {
  roomId: string;
  finalLeaderboard: Array<{
    userId: string;
    email: string;
    totalPoints: number;
    rank: number;
  }>;
}
