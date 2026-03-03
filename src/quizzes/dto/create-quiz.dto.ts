import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
  IsBoolean,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, AnswerMode } from '@prisma/client';

export class CreateOptionDto {
  @ApiProperty({ example: 'Option text' })
  @IsString()
  text: string;

  @ApiProperty({ example: true, description: 'Is this option correct' })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ example: 0, description: 'Display order of the option' })
  @IsInt()
  @Min(0)
  order: number;
}

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType, example: QuestionType.TEXT })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({ enum: AnswerMode, example: AnswerMode.SINGLE })
  @IsEnum(AnswerMode)
  answerMode: AnswerMode;

  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ example: 30, description: 'Timer in seconds' })
  @IsInt()
  @Min(1)
  timerSeconds: number;

  @ApiProperty({ example: 10, description: 'Points for correct answer' })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({ example: 0, description: 'Display order of the question' })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ type: [CreateOptionDto], description: 'Answer options' })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options: CreateOptionDto[];
}

export class CreateRoundDto {
  @ApiProperty({ example: 'Round 1: Geography' })
  @IsString()
  title: string;

  @ApiProperty({ example: 0, description: 'Display order of the round' })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ type: [CreateQuestionDto], description: 'Questions in this round' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class CreateQuizDto {
  @ApiProperty({ example: 'General Knowledge Quiz' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Test your general knowledge' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [CreateRoundDto], description: 'Quiz rounds' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRoundDto)
  rounds: CreateRoundDto[];
}
