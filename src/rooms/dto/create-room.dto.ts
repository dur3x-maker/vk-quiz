import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    example: 'uuid-of-quiz',
    description: 'Quiz ID to create room for',
  })
  @IsString()
  @IsUUID()
  quizId: string;
}
