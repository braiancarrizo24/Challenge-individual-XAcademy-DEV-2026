
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from './entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playersRepository: Repository<PlayerEntity>,
  ) {}

  async findAll(
    page = 1,
    limit = 25,
    gender?: string,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const safeGender =
      gender === 'male' || gender === 'female' ? gender : null;

    const countResult = await this.playersRepository.query(
      `
      SELECT COUNT(*) AS total
      FROM players p
      WHERE (? IS NULL OR p.gender = ?)
      `,
      [safeGender, safeGender],
    );

    const total = Number(countResult[0].total);

    const data = await this.playersRepository.query(
      `
      SELECT
        ranked.id,
        ranked.source_player_id AS sourcePlayerId,
        ranked.name,
        ranked.nationality,
        ranked.gender,
        ranked.edition,
        ranked.fifa_update AS fifaUpdate,
        ranked.age,
        ranked.club,
        ranked.position,
        ranked.rating,
        ranked.potential,
        ranked.value_eur AS valueEur,
        ranked.wage_eur AS wageEur
      FROM (
        SELECT
          p.id,
          p.source_player_id,
          p.name,
          p.nationality,
          p.gender,
          pe.edition,
          pe.fifa_update,
          pe.age,
          pe.club,
          pe.position,
          pe.rating,
          pe.potential,
          pe.value_eur,
          pe.wage_eur,
          ROW_NUMBER() OVER (
            PARTITION BY p.id
            ORDER BY pe.edition DESC, pe.fifa_update DESC, pe.id DESC
          ) AS version_number
        FROM players p
        INNER JOIN player_editions pe
          ON pe.player_id = p.id
        WHERE (? IS NULL OR p.gender = ?)
      ) AS ranked
      WHERE ranked.version_number = 1
      ORDER BY ranked.name ASC, ranked.id ASC
      LIMIT ? OFFSET ?
      `,
      [safeGender, safeGender, safeLimit, offset],
    );

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}


