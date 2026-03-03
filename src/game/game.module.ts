import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [GameGateway, GameService],
  exports: [GameService],
})
export class GameModule {}
