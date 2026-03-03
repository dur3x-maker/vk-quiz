export enum Role {
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
}

export enum RoomPhase {
  LOBBY = 'LOBBY',
  PREPARING = 'PREPARING',
  QUESTION = 'QUESTION',
  RESULT = 'RESULT',
  FINISHED = 'FINISHED',
}

export enum QuestionType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export enum AnswerMode {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SignInDto {
  email: string;
  password: string;
}

export interface SignUpDto {
  email: string;
  password: string;
  role: Role;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
  order: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  answerMode: AnswerMode;
  text: string;
  imageUrl?: string;
  timerSeconds: number;
  points: number;
  order: number;
  options: Option[];
}

export interface Round {
  id: string;
  title: string;
  order: number;
  questions: Question[];
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  rounds: Round[];
}

export interface QuizListItem {
  id: string;
  title: string;
  description?: string;
  roundsCount: number;
  questionsCount: number;
  createdAt: string;
}

export interface CreateQuizDto {
  title: string;
  description?: string;
  rounds: CreateRoundDto[];
}

export interface CreateRoundDto {
  title: string;
  order: number;
  questions: CreateQuestionDto[];
}

export interface CreateQuestionDto {
  type: QuestionType;
  answerMode: AnswerMode;
  text: string;
  imageUrl?: string;
  timerSeconds: number;
  points: number;
  order: number;
  options: CreateOptionDto[];
}

export interface CreateOptionDto {
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface UpdateQuizDto {
  title?: string;
  description?: string;
  rounds?: UpdateRoundDto[];
}

export interface UpdateRoundDto {
  id?: string;
  title?: string;
  order?: number;
  questions?: UpdateQuestionDto[];
}

export interface UpdateQuestionDto {
  id?: string;
  type?: QuestionType;
  answerMode?: AnswerMode;
  text?: string;
  imageUrl?: string;
  timerSeconds?: number;
  points?: number;
  order?: number;
  options?: UpdateOptionDto[];
}

export interface UpdateOptionDto {
  id?: string;
  text?: string;
  isCorrect?: boolean;
  order?: number;
}

export interface RoomParticipant {
  id: string;
  userId: string;
  email: string;
  role: Role;
  joinedAt: string;
}

export interface Room {
  id: string;
  code: string;
  organizerId: string;
  quizId: string;
  phase: RoomPhase;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  currentRoundIndex: number;
  currentQuestionIndex: number;
  participants: RoomParticipant[];
  quizTitle: string;
}

export interface RoomListItem {
  id: string;
  code: string;
  phase: RoomPhase;
  quizTitle: string;
  participantsCount: number;
  createdAt: string;
}

export interface CreateRoomDto {
  quizId: string;
}

export interface JoinRoomDto {
  code: string;
}

export interface ParticipantHistoryItem {
  roomId: string;
  quizTitle: string;
  organizerEmail: string;
  phase: RoomPhase;
  playedAt: string;
  totalPoints: number;
  rank: number;
  totalParticipants: number;
}

export interface OrganizerHistoryItem {
  roomId: string;
  quizTitle: string;
  roomCode: string;
  phase: RoomPhase;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  participantsCount: number;
  topParticipants: {
    email: string;
    totalPoints: number;
    rank: number;
  }[];
}

export interface RoomDetailedHistory {
  roomId: string;
  quizTitle: string;
  roomCode: string;
  phase: RoomPhase;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  organizerEmail: string;
  participants: {
    userId: string;
    email: string;
    totalPoints: number;
    rank: number;
    correctAnswers: number;
    totalAnswers: number;
  }[];
  questionStats: {
    questionId: string;
    questionText: string;
    correctAnswersCount: number;
    totalAnswersCount: number;
  }[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: any[];
}
