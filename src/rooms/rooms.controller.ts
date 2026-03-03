import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import {
  RoomResponseDto,
  RoomListItemDto,
  RoomParticipantDto,
} from './dto/room-response.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Rooms')
@ApiBearerAuth('access-token')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(Role.ORGANIZER)
  @ApiOperation({ summary: 'Create a new room (Organizer only)' })
  @ApiResponse({
    status: 201,
    description: 'Room successfully created',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Organizer role required' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() createRoomDto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.create(userId, createRoomDto);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join a room by code' })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined room',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 400, description: 'Room not in lobby state' })
  async join(
    @CurrentUser('sub') userId: string,
    @Body() joinRoomDto: JoinRoomDto,
  ): Promise<RoomResponseDto> {
    return this.roomsService.join(userId, joinRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user rooms' })
  @ApiResponse({
    status: 200,
    description: 'List of user rooms',
    type: [RoomListItemDto],
  })
  async findUserRooms(
    @CurrentUser('sub') userId: string,
  ): Promise<RoomListItemDto[]> {
    return this.roomsService.findUserRooms(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room details' })
  @ApiResponse({
    status: 200,
    description: 'Room details',
    type: RoomResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 400, description: 'Not a room participant' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<RoomResponseDto> {
    return this.roomsService.findOne(id, userId);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get room participants' })
  @ApiResponse({
    status: 200,
    description: 'List of room participants',
    type: [RoomParticipantDto],
  })
  @ApiResponse({ status: 404, description: 'Room not found' })
  @ApiResponse({ status: 400, description: 'Not a room participant' })
  async getParticipants(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ): Promise<RoomParticipantDto[]> {
    return this.roomsService.getParticipants(id, userId);
  }
}
