
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerEntity } from './entities/player.entity';
import { PlayerEditionEntity } from './entities/player-edition.entity';
import { PlayerSkillEntity } from './entities/player-skill.entity';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlayerEntity,
      PlayerEditionEntity,
      PlayerSkillEntity,
    ]),
  ],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [TypeOrmModule],
})
export class PlayersModule {}
