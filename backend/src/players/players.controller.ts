
import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  ParseIntPipe,
  Body,
  UseGuards,
} from '@nestjs/common';

import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { CreatePlayerEditionDto } from './dto/create-player-edition.dto';
import { UpdatePlayerEditionDto } from './dto/update-player-edition.dto';

import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';

@Controller('players')
export class PlayersController {
  constructor(
    private readonly playersService: PlayersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  @Post(':id/editions')
  @UseGuards(JwtAuthGuard)
  addEdition(
    @Param('id', ParseIntPipe) id: number,
    @Body() createPlayerEditionDto: CreatePlayerEditionDto,
  ) {
    return this.playersService.addEdition(
      id,
      createPlayerEditionDto,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlayerDto: UpdatePlayerDto,
  ) {
    return this.playersService.update(id, updatePlayerDto);
  }

  @Patch(':id/editions/:editionId')
  @UseGuards(JwtAuthGuard)
  updateEdition(
    @Param('id', ParseIntPipe) id: number,
    @Param('editionId', ParseIntPipe) editionId: number,
    @Body() updatePlayerEditionDto: UpdatePlayerEditionDto,
  ) {
    return this.playersService.updateEdition(
      id,
      editionId,
      updatePlayerEditionDto,
    );
  }

  @Get()
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 30,
    @Query('gender') gender?: string,
    @Query('edition', new ParseIntPipe({ optional: true })) edition?: number,
    @Query('name') name?: string,
    @Query('club') club?: string,
    @Query('position') position?: string,
    @Query('exportAll') exportAll?: string,
  ) {
    return this.playersService.findAll(
      page,
      limit,
      gender,
      edition,
      name,
      club,
      position,
      exportAll === 'true',
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.playersService.findOne(id);
  }
}











