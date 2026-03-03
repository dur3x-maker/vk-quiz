import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateOptionDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'Option text' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;
}

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({ enum: AnswerMode })
  @IsOptional()
  @IsEnum(AnswerMode)
  answerMode?: AnswerMode;

  @ApiPropertyOptional({ example: 'What is the capital of France?' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  timerSeconds?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({ type: [UpdateOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOptionDto)
  options?: UpdateOptionDto[];
}

export class UpdateRoundDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'Round 1: Geography' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ type: [UpdateQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionDto)
  questions?: UpdateQuestionDto[];
}

export class UpdateQuizDto {
  @ApiPropertyOptional({ example: 'General Knowledge Quiz' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Test your general knowledge' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [UpdateRoundDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRoundDto)
  rounds?: UpdateRoundDto[];
}
