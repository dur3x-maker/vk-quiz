import { ApiProperty } from '@nestjs/swagger';
import { RoomPhase } from '@prisma/client';

export class ParticipantHistoryItemDto {
  @ApiProperty()
  roomId: string;

  @ApiProperty()
  quizTitle: string;

  @ApiProperty()
  organizerEmail: string;

  @ApiProperty({ enum: RoomPhase })
  phase: RoomPhase;

  @ApiProperty()
  playedAt: Date;

  @ApiProperty()
  totalPoints: number;

  @ApiProperty()
  rank: number;

  @ApiProperty()
  totalParticipants: number;
}

export class OrganizerHistoryItemDto {
  @ApiProperty()
  roomId: string;

  @ApiProperty()
  quizTitle: string;

  @ApiProperty()
  roomCode: string;

  @ApiProperty({ enum: RoomPhase })
  phase: RoomPhase;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  startedAt: Date | null;

  @ApiProperty()
  endedAt: Date | null;

  @ApiProperty()
  participantsCount: number;

  @ApiProperty({ type: [Object], description: 'Top 3 participants' })
  topParticipants: Array<{
    email: string;
    totalPoints: number;
    rank: number;
  }>;
}

export class RoomDetailedHistoryDto {
  @ApiProperty()
  roomId: string;

  @ApiProperty()
  quizTitle: string;

  @ApiProperty()
  roomCode: string;

  @ApiProperty({ enum: RoomPhase })
  phase: RoomPhase;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  startedAt: Date | null;

  @ApiProperty()
  endedAt: Date | null;

  @ApiProperty()
  organizerEmail: string;

  @ApiProperty({ type: [Object] })
  participants: Array<{
    userId: string;
    email: string;
    totalPoints: number;
    rank: number;
    correctAnswers: number;
    totalAnswers: number;
  }>;

  @ApiProperty({ type: [Object] })
  questionStats: Array<{
    questionId: string;
    questionText: string;
    correctAnswersCount: number;
    totalAnswersCount: number;
  }>;
}
