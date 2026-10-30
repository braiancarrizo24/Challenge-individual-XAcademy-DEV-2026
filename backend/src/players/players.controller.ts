import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly playersService: PlayersService,
  ) {}

  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 25,
    @Query('gender') gender?: string,
  ) {
    return this.playersService.findAll(page, limit, gender);
  }
}


