import { ApiProperty } from '@nestjs/swagger';
import { RoomPhase, Role } from '@prisma/client';

export class RoomParticipantDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty()
  joinedAt: Date;
}

export class RoomResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  organizerId: string;

  @ApiProperty()
  quizId: string;

  @ApiProperty({ enum: RoomPhase })
  phase: RoomPhase;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  startedAt?: Date;

  @ApiProperty()
  endedAt?: Date;

  @ApiProperty()
  currentRoundIndex: number;

  @ApiProperty()
  currentQuestionIndex: number;

  @ApiProperty({ type: [RoomParticipantDto] })
  participants: RoomParticipantDto[];

  @ApiProperty()
  quizTitle: string;
}

export class RoomListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: RoomPhase })
  phase: RoomPhase;

  @ApiProperty()
  quizTitle: string;

  @ApiProperty()
  participantsCount: number;

  @ApiProperty()
  createdAt: Date;
}
