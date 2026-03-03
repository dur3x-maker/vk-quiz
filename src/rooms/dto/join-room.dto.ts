import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    example: 'ABC123',
    description: 'Room code (6 characters)',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
