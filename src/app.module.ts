import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { RoomsModule } from './rooms/rooms.module';
import { GameModule } from './game/game.module';
import { HistoryModule } from './history/history.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    QuizzesModule,
    RoomsModule,
    GameModule,
    HistoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
