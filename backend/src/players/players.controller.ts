
import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly playersService: PlayersService,
  ) {}

  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 30,
    @Query('gender') gender?: string,
    @Query('edition', new ParseIntPipe({ optional: true })) edition?: number,
    @Query('name') name?: string,
    @Query('club') club?: string,
    @Query('position') position?: string,
  ) {
    return this.playersService.findAll(
      page,
      limit,
      gender,
      edition,
      name,
      club,
      position,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.playersService.findOne(id);
  }
}



