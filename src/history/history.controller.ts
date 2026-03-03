import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HistoryService } from './history.service';
import {
  ParticipantHistoryItemDto,
  OrganizerHistoryItemDto,
  RoomDetailedHistoryDto,
} from './dto/history-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('History')
@ApiBearerAuth('access-token')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('participant')
  @Roles(Role.PARTICIPANT)
  @ApiOperation({ summary: 'Get participant game history' })
  @ApiResponse({
    status: 200,
    description: 'Participant history',
    type: [ParticipantHistoryItemDto],
  })
  async getParticipantHistory(
    @CurrentUser('sub') userId: string,
  ): Promise<ParticipantHistoryItemDto[]> {
    return this.historyService.getParticipantHistory(userId);
  }

  @Get('organizer')
  @Roles(Role.ORGANIZER)
  @ApiOperation({ summary: 'Get organizer hosted games history' })
  @ApiResponse({
    status: 200,
    description: 'Organizer history',
    type: [OrganizerHistoryItemDto],
  })
  async getOrganizerHistory(
    @CurrentUser('sub') userId: string,
  ): Promise<OrganizerHistoryItemDto[]> {
    return this.historyService.getOrganizerHistory(userId);
  }

  @Get('room/:id')
  @ApiOperation({ summary: 'Get detailed room history' })
  @ApiResponse({
    status: 200,
    description: 'Detailed room history with statistics',
    type: RoomDetailedHistoryDto,
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 403, description: 'Not authorized' })
  async getRoomDetailedHistory(
    @Param('id') roomId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<RoomDetailedHistoryDto> {
    return this.historyService.getRoomDetailedHistory(roomId, userId);
  }
}
