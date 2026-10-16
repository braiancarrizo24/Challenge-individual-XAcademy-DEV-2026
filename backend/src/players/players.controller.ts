
import { Controller, Get } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayerEntity } from './entities/player.entity';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly playersService: PlayersService,
  ) {}

  @Get()
  findAll(): Promise<PlayerEntity[]> {
    return this.playersService.findAll();
  }
}
