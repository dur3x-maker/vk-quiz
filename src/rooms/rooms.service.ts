import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import {
  RoomResponseDto,
  RoomListItemDto,
  RoomParticipantDto,
} from './dto/room-response.dto';
import { RoomPhase } from '@prisma/client';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateRoomDto): Promise<RoomResponseDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: dto.quizId },
      include: { rounds: true },
    });

    if (!quiz) {
      throw new NotFoundException({
        code: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found',
      });
    }

    if (quiz.ownerId !== userId) {
      throw new BadRequestException({
        code: 'NOT_QUIZ_OWNER',
        message: 'You can only create rooms for your own quizzes',
      });
    }

    let code = '';
    let isUnique = false;

    while (!isUnique) {
      code = nanoid();
      const existing = await this.prisma.room.findUnique({
        where: { code },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    const room = await this.prisma.room.create({
      data: {
        code,
        organizerId: userId,
        quizId: dto.quizId,
        phase: RoomPhase.LOBBY,
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        quiz: true,
      },
    });

    return this.mapToRoomResponse(room);
  }

  async join(userId: string, dto: JoinRoomDto): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { code: dto.code.toUpperCase() },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        quiz: true,
      },
    });

    if (!room) {
      throw new NotFoundException({
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found with this code',
      });
    }

    if (room.phase !== RoomPhase.LOBBY) {
      throw new BadRequestException({
        code: 'ROOM_NOT_IN_LOBBY',
        message: 'Cannot join room that is not in lobby phase',
      });
    }

    if (room.organizerId === userId) {
      return this.mapToRoomResponse(room);
    }

    const existingParticipant = room.participants.find(
      (p) => p.userId === userId,
    );

    if (existingParticipant) {
      return this.mapToRoomResponse(room);
    }

    await this.prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        isOrganizer: false,
      },
    });

    const updatedRoom = await this.prisma.room.findUnique({
      where: { id: room.id },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        quiz: true,
      },
    });

    return this.mapToRoomResponse(updatedRoom);
  }

  async findOne(id: string, userId: string): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        quiz: true,
      },
    });

    if (!room) {
      throw new NotFoundException({
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found',
      });
    }

    const isParticipant = room.participants.some((p) => p.userId === userId);
    const isOrganizer = room.organizerId === userId;

    if (!isParticipant && !isOrganizer) {
      throw new BadRequestException({
        code: 'NOT_ROOM_MEMBER',
        message: 'You are not a member of this room',
      });
    }

    return this.mapToRoomResponse(room);
  }

  async findUserRooms(userId: string): Promise<RoomListItemDto[]> {
    const rooms = await this.prisma.room.findMany({
      where: {
        OR: [
          { participants: { some: { userId } } },
          { organizerId: userId },
        ],
      },
      include: {
        quiz: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((room) => ({
      id: room.id,
      code: room.code,
      phase: room.phase,
      quizTitle: room.quiz.title,
      participantsCount: room._count.participants,
      createdAt: room.createdAt,
    }));
  }

  async getParticipants(
    roomId: string,
    userId: string,
  ): Promise<RoomParticipantDto[]> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException({
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found',
      });
    }

    const isParticipant = room.participants.some((p) => p.userId === userId);
    const isOrganizer = room.organizerId === userId;

    if (!isParticipant && !isOrganizer) {
      throw new BadRequestException({
        code: 'NOT_ROOM_MEMBER',
        message: 'You are not a member of this room',
      });
    }

    return room.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      email: p.user.email,
      role: p.user.role,
      joinedAt: p.joinedAt,
    }));
  }

  private mapToRoomResponse(room: any): RoomResponseDto {
    return {
      id: room.id,
      code: room.code,
      organizerId: room.organizerId,
      quizId: room.quizId,
      phase: room.phase,
      createdAt: room.createdAt,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      currentRoundIndex: room.currentRoundIndex,
      currentQuestionIndex: room.currentQuestionIndex,
      quizTitle: room.quiz.title,
      participants: room.participants.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        email: p.user.email,
        role: p.user.role,
        joinedAt: p.joinedAt,
      })),
    };
  }
}
