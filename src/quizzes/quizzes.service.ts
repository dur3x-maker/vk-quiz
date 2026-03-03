import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { QuizResponseDto, QuizListItemDto } from './dto/quiz-response.dto';
import { Role } from '@prisma/client';

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateQuizDto): Promise<QuizResponseDto> {
    const quiz = await this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description,
        ownerId: userId,
        rounds: {
          create: dto.rounds.map((round, roundIndex) => ({
            title: round.title,
            order: roundIndex,
            questions: {
              create: round.questions.map((question, questionIndex) => ({
                type: question.type,
                answerMode: question.answerMode,
                text: question.text,
                imageUrl: question.imageUrl,
                timerSeconds: question.timerSeconds,
                points: question.points,
                order: questionIndex,
                options: {
                  create: question.options.map((option, optionIndex) => ({
                    text: option.text,
                    isCorrect: option.isCorrect,
                    order: optionIndex,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        rounds: {
          include: {
            questions: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapToQuizResponse(quiz);
  }

  async findAll(userId?: string, userRole?: string): Promise<QuizListItemDto[]> {
    const quizzes = await this.prisma.quiz.findMany({
      where: userRole === Role.ORGANIZER && userId ? { ownerId: userId } : undefined,
      include: {
        rounds: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      ownerId: quiz.ownerId,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      roundsCount: quiz.rounds.length,
      questionsCount: quiz.rounds.reduce(
        (sum, round) => sum + round._count.questions,
        0,
      ),
    }));
  }

  async findOne(id: string): Promise<QuizResponseDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        rounds: {
          include: {
            questions: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException({
        code: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found',
      });
    }

    return this.mapToQuizResponse(quiz);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateQuizDto,
  ): Promise<QuizResponseDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundException({
        code: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found',
      });
    }

    if (quiz.ownerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only update your own quizzes',
      });
    }

    if (dto.rounds) {
      await this.prisma.round.deleteMany({
        where: { quizId: id },
      });
    }

    const updatedQuiz = await this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.rounds && {
          rounds: {
            create: dto.rounds.map((round, roundIndex) => ({
              title: round.title || '',
              order: roundIndex,
              questions: {
                create: (round.questions || []).map((question, questionIndex) => ({
                  type: question.type || 'TEXT',
                  answerMode: question.answerMode || 'SINGLE',
                  text: question.text || '',
                  imageUrl: question.imageUrl,
                  timerSeconds: question.timerSeconds || 30,
                  points: question.points || 10,
                  order: questionIndex,
                  options: {
                    create: (question.options || []).map((option, optionIndex) => ({
                      text: option.text || '',
                      isCorrect: option.isCorrect || false,
                      order: optionIndex,
                    })),
                  },
                })),
              },
            })),
          },
        }),
      },
      include: {
        rounds: {
          include: {
            questions: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    return this.mapToQuizResponse(updatedQuiz);
  }

  async remove(id: string, userId: string): Promise<void> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      throw new NotFoundException({
        code: 'QUIZ_NOT_FOUND',
        message: 'Quiz not found',
      });
    }

    if (quiz.ownerId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You can only delete your own quizzes',
      });
    }

    await this.prisma.quiz.delete({
      where: { id },
    });
  }

  private mapToQuizResponse(quiz: any): QuizResponseDto {
    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      ownerId: quiz.ownerId,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      rounds: quiz.rounds.map((round: any) => ({
        id: round.id,
        title: round.title,
        order: round.order,
        questions: round.questions.map((question: any) => ({
          id: question.id,
          type: question.type,
          answerMode: question.answerMode,
          text: question.text,
          imageUrl: question.imageUrl,
          timerSeconds: question.timerSeconds,
          points: question.points,
          order: question.order,
          options: question.options.map((option: any) => ({
            id: option.id,
            text: option.text,
            isCorrect: option.isCorrect,
            order: option.order,
          })),
        })),
      })),
    };
  }
}
