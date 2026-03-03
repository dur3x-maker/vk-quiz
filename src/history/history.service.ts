import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ParticipantHistoryItemDto,
  OrganizerHistoryItemDto,
  RoomDetailedHistoryDto,
} from './dto/history-response.dto';
import { RoomPhase } from '@prisma/client';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async getParticipantHistory(userId: string): Promise<ParticipantHistoryItemDto[]> {
    const rooms = await this.prisma.room.findMany({
      where: {
        participants: {
          some: {
            userId,
            isOrganizer: false,
          },
        },
        phase: RoomPhase.FINISHED,
      },
      include: {
        quiz: true,
        organizer: true,
        scoreSnapshots: {
          where: { userId },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { endedAt: 'desc' },
    });

    const history: ParticipantHistoryItemDto[] = [];

    for (const room of rooms) {
      const allScores = await this.prisma.scoreSnapshot.findMany({
        where: { roomId: room.id },
        orderBy: { totalPoints: 'desc' },
      });

      const userScore = room.scoreSnapshots[0];
      const rank = allScores.findIndex((s) => s.userId === userId) + 1;

      history.push({
        roomId: room.id,
        quizTitle: room.quiz.title,
        organizerEmail: room.organizer.email,
        phase: room.phase,
        playedAt: room.endedAt || room.createdAt,
        totalPoints: userScore?.totalPoints || 0,
        rank,
        totalParticipants: room._count.participants,
      });
    }

    return history;
  }

  async getOrganizerHistory(userId: string): Promise<OrganizerHistoryItemDto[]> {
    const rooms = await this.prisma.room.findMany({
      where: {
        organizerId: userId,
      },
      include: {
        quiz: true,
        scoreSnapshots: {
          include: {
            user: true,
          },
          orderBy: { totalPoints: 'desc' },
          take: 3,
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rooms.map((room) => ({
      roomId: room.id,
      quizTitle: room.quiz.title,
      roomCode: room.code,
      phase: room.phase,
      createdAt: room.createdAt,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      participantsCount: room._count.participants,
      topParticipants: room.scoreSnapshots.map((score, index) => ({
        email: score.user.email,
        totalPoints: score.totalPoints,
        rank: index + 1,
      })),
    }));
  }

  async getRoomDetailedHistory(
    roomId: string,
    userId: string,
  ): Promise<RoomDetailedHistoryDto> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        quiz: {
          include: {
            rounds: {
              include: {
                questions: true,
              },
            },
          },
        },
        organizer: true,
        participants: {
          include: {
            user: true,
          },
        },
        scoreSnapshots: {
          include: {
            user: true,
          },
          orderBy: { totalPoints: 'desc' },
        },
        answers: {
          include: {
            question: true,
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
      throw new ForbiddenException({
        code: 'NOT_AUTHORIZED',
        message: 'You are not authorized to view this room history',
      });
    }

    const participants = room.scoreSnapshots.map((score, index) => {
      const userAnswers = room.answers.filter((a) => a.userId === score.userId);
      const correctAnswers = userAnswers.filter((a) => a.isCorrect).length;

      return {
        userId: score.userId,
        email: score.user.email,
        totalPoints: score.totalPoints,
        rank: index + 1,
        correctAnswers,
        totalAnswers: userAnswers.length,
      };
    });

    const allQuestions = room.quiz.rounds.flatMap((round) => round.questions);

    const questionStats = allQuestions.map((question) => {
      const questionAnswers = room.answers.filter((a) => a.questionId === question.id);
      const correctAnswers = questionAnswers.filter((a) => a.isCorrect).length;

      return {
        questionId: question.id,
        questionText: question.text,
        correctAnswersCount: correctAnswers,
        totalAnswersCount: questionAnswers.length,
      };
    });

    return {
      roomId: room.id,
      quizTitle: room.quiz.title,
      roomCode: room.code,
      phase: room.phase,
      createdAt: room.createdAt,
      startedAt: room.startedAt,
      endedAt: room.endedAt,
      organizerEmail: room.organizer.email,
      participants,
      questionStats,
    };
  }
}
