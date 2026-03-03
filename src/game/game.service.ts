import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomPhase } from '@prisma/client';

@Injectable()
export class GameService {
  private roomTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private prisma: PrismaService) {}

  async startQuiz(roomId: string, userId: string) {
    // Step 1: Validate room state
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        quiz: {
          include: {
            rounds: {
              include: {
                questions: { orderBy: { order: 'asc' } },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        participants: { include: { user: true } },
      },
    });

    if (!room) {
      throw new NotFoundException({
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found',
      });
    }

    if (room.organizerId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_ORGANIZER',
        message: 'Only organizer can start the quiz',
      });
    }

    if (room.phase !== RoomPhase.LOBBY) {
      throw new BadRequestException({
        code: 'INVALID_PHASE',
        message: `Cannot start quiz from phase ${room.phase}`,
      });
    }

    if (room.participants.length < 1) {
      throw new BadRequestException({
        code: 'NOT_ENOUGH_PARTICIPANTS',
        message: 'At least 1 participant required to start',
      });
    }

    console.log(`[GameService.startQuiz] roomId=${roomId} phase=${room.phase} participants=${room.participants.length}`);

    // Step 2: Optimistic phase transition (idempotency guard — only LOBBY→PREPARING)
    const { count } = await this.prisma.room.updateMany({
      where: { id: roomId, phase: RoomPhase.LOBBY },
      data: {
        phase: RoomPhase.PREPARING,
        startedAt: new Date(),
        currentRoundIndex: 0,
        currentQuestionIndex: 0,
      },
    });

    if (count === 0) {
      throw new BadRequestException({
        code: 'ALREADY_STARTED',
        message: 'Quiz has already been started (concurrent request)',
      });
    }

    // Step 3: Re-fetch actual participants (may have changed since step 1)
    const currentParticipants = await this.prisma.roomParticipant.findMany({
      where: { roomId },
    });

    console.log(`[GameService.startQuiz] actual participants=${currentParticipants.length} (was ${room.participants.length} at validation)`);

    if (currentParticipants.length === 0) {
      console.error(`[GameService.startQuiz] ABORT: 0 participants for roomId=${roomId}`);
      throw new BadRequestException({
        code: 'NO_PARTICIPANTS',
        message: 'No participants found in room',
      });
    }

    // Step 4: Initialize score snapshots for all current participants
    for (const participant of currentParticipants) {
      await this.prisma.scoreSnapshot.upsert({
        where: {
          ScoreSnapshot_roomId_userId: { roomId, userId: participant.userId },
        },
        create: { roomId, userId: participant.userId, totalPoints: 0 },
        update: { totalPoints: 0 },
      });
    }
    console.log(`[GameService.startQuiz] ${currentParticipants.length} scoreSnapshots initialized`);

    // Step 5: Fetch updated room for return
    const updatedRoom = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    return updatedRoom!;
  }

  async nextQuestion(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        quiz: {
          include: {
            rounds: {
              include: {
                questions: {
                  include: {
                    options: { orderBy: { order: 'asc' } },
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
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

    if (room.organizerId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_ORGANIZER',
        message: 'Only organizer can control quiz flow',
      });
    }

    const validPhases: RoomPhase[] = [RoomPhase.PREPARING, RoomPhase.QUESTION, RoomPhase.RESULT];
    if (!validPhases.includes(room.phase)) {
      throw new BadRequestException({
        code: 'INVALID_PHASE',
        message: `Cannot advance question from phase ${room.phase}`,
      });
    }

    let roundIdx = room.currentRoundIndex;
    let questionIdx = room.currentQuestionIndex;

    const currentRound = room.quiz.rounds[roundIdx];
    if (!currentRound) {
      throw new BadRequestException({
        code: 'NO_MORE_ROUNDS',
        message: 'No more rounds available',
      });
    }

    const currentQuestion = currentRound.questions[questionIdx];
    if (!currentQuestion) {
      if (roundIdx + 1 < room.quiz.rounds.length) {
        roundIdx = roundIdx + 1;
        questionIdx = 0;
      } else {
        throw new BadRequestException({
          code: 'NO_MORE_QUESTIONS',
          message: 'No more questions available',
        });
      }
    }

    const targetRound = room.quiz.rounds[roundIdx];
    const targetQuestion = targetRound.questions[questionIdx];

    const nextQuestionIdx = questionIdx + 1;

    await this.prisma.room.update({
      where: { id: roomId },
      data: {
        phase: RoomPhase.QUESTION,
        currentRoundIndex: roundIdx,
        currentQuestionIndex: nextQuestionIdx,
      },
    });

    console.log(`[GameService.nextQuestion] roomId=${roomId} round=${roundIdx} question=${questionIdx} phase=QUESTION`);

    return {
      roundIndex: roundIdx,
      questionIndex: questionIdx,
      roundTitle: targetRound.title,
      question: this.formatQuestion(targetQuestion),
    };
  }

  async setPhaseResult(roomId: string) {
    await this.prisma.room.update({
      where: { id: roomId },
      data: { phase: RoomPhase.RESULT },
    });
    console.log(`[GameService.setPhaseResult] roomId=${roomId} phase=RESULT`);
  }

  async submitAnswer(
    roomId: string,
    userId: string,
    questionId: string,
    selectedOptionIds: string[],
    answerTimeMs: number,
  ) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });

    if (!room) {
      throw new NotFoundException({
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found',
      });
    }

    if (room.phase !== RoomPhase.QUESTION) {
      throw new BadRequestException({
        code: 'INVALID_PHASE',
        message: 'Answers only accepted during QUESTION phase',
      });
    }

    const isParticipant = room.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new ForbiddenException({
        code: 'NOT_PARTICIPANT',
        message: 'You are not a participant of this room',
      });
    }

    const existingAnswer = await this.prisma.answer.findUnique({
      where: {
        Answer_roomId_questionId_userId: { roomId, questionId, userId },
      },
    });

    if (existingAnswer) {
      return { alreadyAnswered: true };
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });

    if (!question) {
      throw new NotFoundException({
        code: 'QUESTION_NOT_FOUND',
        message: 'Question not found',
      });
    }

    if (answerTimeMs > question.timerSeconds * 1000) {
      throw new BadRequestException({
        code: 'TIME_EXCEEDED',
        message: 'Answer submitted after timer expired',
      });
    }

    const correctOptionIds = question.options
      .filter((opt) => opt.isCorrect)
      .map((opt) => opt.id)
      .sort();

    const isCorrect =
      selectedOptionIds.length === correctOptionIds.length &&
      selectedOptionIds.sort().every((id, idx) => id === correctOptionIds[idx]);

    const pointsAwarded = isCorrect ? question.points : 0;

    await this.prisma.answer.create({
      data: {
        roomId,
        questionId,
        userId,
        selectedOptionIds,
        isCorrect,
        pointsAwarded,
        answerTimeMs,
      },
    });

    await this.prisma.scoreSnapshot.upsert({
      where: {
        ScoreSnapshot_roomId_userId: { roomId, userId },
      },
      create: { roomId, userId, totalPoints: pointsAwarded },
      update: { totalPoints: { increment: pointsAwarded } },
    });

    return { isCorrect, pointsAwarded };
  }

  async getLeaderboard(roomId: string) {
    const scores = await this.prisma.scoreSnapshot.findMany({
      where: { roomId },
      include: { user: true },
      orderBy: { totalPoints: 'desc' },
    });

    return scores.map((score, index) => ({
      userId: score.userId,
      email: score.user.email,
      totalPoints: score.totalPoints,
      rank: index + 1,
    }));
  }

  async endQuiz(roomId: string, userId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException({
        code: 'ROOM_NOT_FOUND',
        message: 'Room not found',
      });
    }

    if (room.organizerId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_ORGANIZER',
        message: 'Only organizer can end the quiz',
      });
    }

    if (room.phase === RoomPhase.LOBBY || room.phase === RoomPhase.FINISHED) {
      throw new BadRequestException({
        code: 'INVALID_PHASE',
        message: `Cannot end quiz from phase ${room.phase}`,
      });
    }

    await this.prisma.room.update({
      where: { id: roomId },
      data: {
        phase: RoomPhase.FINISHED,
        endedAt: new Date(),
      },
    });

    this.clearRoomTimer(roomId);
    console.log(`[GameService.endQuiz] roomId=${roomId} phase=FINISHED`);

    return await this.getLeaderboard(roomId);
  }

  async getRoomWithParticipants(roomId: string) {
    return this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        participants: { include: { user: true } },
      },
    });
  }

  setRoomTimer(roomId: string, timer: NodeJS.Timeout) {
    this.clearRoomTimer(roomId);
    this.roomTimers.set(roomId, timer);
  }

  clearRoomTimer(roomId: string) {
    const timer = this.roomTimers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.roomTimers.delete(roomId);
    }
  }

  private formatQuestion(question: any) {
    return {
      id: question.id,
      type: question.type,
      answerMode: question.answerMode,
      text: question.text,
      imageUrl: question.imageUrl,
      timerSeconds: question.timerSeconds,
      points: question.points,
      options: question.options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
      })),
    };
  }
}
