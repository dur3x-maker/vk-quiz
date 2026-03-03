import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, AnswerMode } from '@prisma/client';

export class OptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  order: number;
}

export class QuestionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: QuestionType })
  type: QuestionType;

  @ApiProperty({ enum: AnswerMode })
  answerMode: AnswerMode;

  @ApiProperty()
  text: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  timerSeconds: number;

  @ApiProperty()
  points: number;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [OptionResponseDto] })
  options: OptionResponseDto[];
}

export class RoundResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ type: [QuestionResponseDto] })
  questions: QuestionResponseDto[];
}

export class QuizResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [RoundResponseDto] })
  rounds: RoundResponseDto[];
}

export class QuizListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'Number of rounds' })
  roundsCount: number;

  @ApiProperty({ description: 'Total number of questions' })
  questionsCount: number;
}
