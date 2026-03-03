import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GameService } from './game.service';
import {
  JoinRoomEventDto,
  StartQuizEventDto,
  NextQuestionEventDto,
  SubmitAnswerEventDto,
  EndQuizEventDto,
  RoomPhaseChangedPayload,
  RoomPhaseSyncPayload,
  LobbyUpdatePayload,
  NextQuestionPayload,
  TimerTickPayload,
  AnswerReceivedPayload,
  LeaderboardUpdatePayload,
  QuizEndedPayload,
} from './dto/game-events.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RoomPhase } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string> = new Map();

  constructor(
    private gameService: GameService,
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        console.log('[WS] Connection rejected: No token');
        client.emit('error', { code: 'UNAUTHORIZED', message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.accessSecret'),
      });

      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.data.role = payload.role;

      const existingSocketId = this.userSockets.get(payload.sub);
      if (existingSocketId) {
        const existingSocket = this.server.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          console.log(`[WS] Disconnecting previous socket for user ${payload.sub}`);
          existingSocket.disconnect(true);
        }
      }

      this.userSockets.set(payload.sub, client.id);
      console.log(`[WS] Connected: ${client.id} userId=${payload.sub}`);
    } catch (error) {
      console.log('[WS] Connection rejected:', error.message);
      client.emit('error', { code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.userSockets.delete(client.data.userId);
    }
    console.log(`[WS] Disconnected: ${client.id}`);
  }

  @SubscribeMessage('room.join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinRoomEventDto,
  ) {
    try {
      const userId = client.data.userId;
      console.log(`[WS] room.join userId=${userId} roomId=${data.roomId}`);

      const room = await this.prisma.room.findUnique({
        where: { id: data.roomId },
        include: {
          participants: { include: { user: true } },
        },
      });

      if (!room) {
        client.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
        return;
      }

      const isParticipant = room.participants.some((p) => p.userId === userId);
      const isOrganizer = room.organizerId === userId;
      if (!isParticipant && !isOrganizer) {
        client.emit('error', { code: 'NOT_ROOM_MEMBER', message: 'You are not a member of this room' });
        return;
      }

      client.join(`room:${data.roomId}`);

      const syncPayload: RoomPhaseSyncPayload = {
        roomId: data.roomId,
        phase: room.phase,
        currentQuestionIndex: room.currentQuestionIndex,
        currentRoundIndex: room.currentRoundIndex,
        participants: room.participants.map((p) => ({
          id: p.userId,
          email: p.user.email,
          role: p.user.role,
        })),
      };

      client.emit('room.phase_sync', syncPayload);
      console.log(`[WS] room.phase_sync → ${client.id} phase=${room.phase}`);

      // Broadcast updated participant list to entire room (so organizer sees new joins)
      if (isParticipant && room.phase === RoomPhase.LOBBY) {
        const lobbyPayload: LobbyUpdatePayload = {
          roomId: data.roomId,
          participants: room.participants.map((p) => ({
            id: p.userId,
            email: p.user.email,
            role: p.user.role,
          })),
        };
        this.server.to(`room:${data.roomId}`).emit('lobby.update', lobbyPayload);
        console.log(`[WS] lobby.update → room:${data.roomId} participants=${room.participants.length}`);
      }
    } catch (error) {
      console.error(`[WS] Error in room.join:`, error);
      client.emit('error', { code: 'INTERNAL_ERROR', message: error.message });
    }
  }

  @SubscribeMessage('quiz.start')
  async handleStartQuiz(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: StartQuizEventDto,
  ) {
    try {
      const userId = client.data.userId;
      console.log(`[WS] quiz.start userId=${userId} roomId=${data.roomId}`);

      const updatedRoom = await this.gameService.startQuiz(data.roomId, userId);

      this.emitPhaseChanged(data.roomId, updatedRoom.phase, updatedRoom.currentQuestionIndex, updatedRoom.currentRoundIndex);
    } catch (error) {
      console.error(`[WS] Error in quiz.start:`, error);
      client.emit('error', { code: error.response?.code || 'INTERNAL_ERROR', message: error.message });
    }
  }

  @SubscribeMessage('quiz.next_question')
  async handleNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: NextQuestionEventDto,
  ) {
    try {
      const userId = client.data.userId;

      const result = await this.gameService.nextQuestion(data.roomId, userId);

      const questionPayload: NextQuestionPayload = {
        roomId: data.roomId,
        roundIndex: result.roundIndex,
        questionIndex: result.questionIndex,
        roundTitle: result.roundTitle,
        question: result.question,
      };

      this.emitPhaseChanged(data.roomId, RoomPhase.QUESTION, result.questionIndex, result.roundIndex);
      this.server.to(`room:${data.roomId}`).emit('quiz.next_question', questionPayload);

      this.startQuestionTimer(data.roomId, result.question.id, result.question.timerSeconds);
    } catch (error) {
      client.emit('error', { code: error.response?.code || 'INTERNAL_ERROR', message: error.message });
    }
  }

  @SubscribeMessage('quiz.submit_answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubmitAnswerEventDto,
  ) {
    try {
      const userId = client.data.userId;

      const result = await this.gameService.submitAnswer(
        data.roomId,
        userId,
        data.questionId,
        data.selectedOptionIds,
        data.answerTimeMs,
      );

      if (result.alreadyAnswered) {
        client.emit('error', { code: 'ALREADY_ANSWERED', message: 'You have already answered this question' });
        return;
      }

      const answerPayload: AnswerReceivedPayload = {
        roomId: data.roomId,
        userId,
        questionId: data.questionId,
      };
      this.server.to(`room:${data.roomId}`).emit('quiz.answer_received', answerPayload);

      const leaderboard = await this.gameService.getLeaderboard(data.roomId);
      const leaderboardPayload: LeaderboardUpdatePayload = {
        roomId: data.roomId,
        leaderboard,
      };
      this.server.to(`room:${data.roomId}`).emit('quiz.leaderboard_update', leaderboardPayload);

      client.emit('quiz.answer_result', {
        isCorrect: result.isCorrect,
        pointsAwarded: result.pointsAwarded,
      });
    } catch (error) {
      client.emit('error', { code: error.response?.code || 'INTERNAL_ERROR', message: error.message });
    }
  }

  @SubscribeMessage('quiz.end')
  async handleEndQuiz(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: EndQuizEventDto,
  ) {
    try {
      const userId = client.data.userId;

      const finalLeaderboard = await this.gameService.endQuiz(data.roomId, userId);

      const payload: QuizEndedPayload = {
        roomId: data.roomId,
        finalLeaderboard,
      };

      this.emitPhaseChanged(data.roomId, RoomPhase.FINISHED, null, null);
      this.server.to(`room:${data.roomId}`).emit('quiz.ended', payload);
    } catch (error) {
      client.emit('error', { code: error.response?.code || 'INTERNAL_ERROR', message: error.message });
    }
  }

  private emitPhaseChanged(roomId: string, phase: RoomPhase, currentQuestionIndex: number | null, currentRoundIndex: number | null) {
    const payload: RoomPhaseChangedPayload = {
      roomId,
      phase,
      currentQuestionIndex,
      currentRoundIndex,
    };
    console.log(`[WS] room.phase_changed → room:${roomId} phase=${phase}`);
    this.server.to(`room:${roomId}`).emit('room.phase_changed', payload);
  }

  private startQuestionTimer(roomId: string, questionId: string, timerSeconds: number) {
    this.gameService.clearRoomTimer(roomId);

    let secondsRemaining = timerSeconds;

    const timer = setInterval(async () => {
      secondsRemaining--;

      const payload: TimerTickPayload = {
        roomId,
        questionId,
        secondsRemaining,
      };

      this.server.to(`room:${roomId}`).emit('quiz.timer_tick', payload);

      if (secondsRemaining <= 0) {
        this.gameService.clearRoomTimer(roomId);

        await this.gameService.setPhaseResult(roomId);
        this.emitPhaseChanged(roomId, RoomPhase.RESULT, null, null);
      }
    }, 1000);

    this.gameService.setRoomTimer(roomId, timer);
  }
}
