
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
    limit = 30,
    gender?: string,
    edition?: number,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(30, Math.max(1, limit));
    const offset = (safePage - 1) * safeLimit;

    const safeGender =
      gender === 'male' || gender === 'female' ? gender : null;

    const safeEdition =
  edition !== undefined &&
  Number.isInteger(edition) &&
  edition >= 15 &&
  edition <= 23
    ? edition
    : null;

    let countResult: any[];
    let data: any[];

    if (safeEdition !== null) {
      countResult = await this.playersRepository.query(
        `
        SELECT COUNT(*) AS total
        FROM players p
        INNER JOIN player_editions pe
          ON pe.player_id = p.id
        WHERE (? IS NULL OR p.gender = ?)
          AND pe.edition = ?
        `,
        [safeGender, safeGender, safeEdition],
      );

      data = await this.playersRepository.query(
        `
        SELECT
          p.id,
          p.source_player_id AS sourcePlayerId,
          p.name,
          p.nationality,
          p.gender,
          pe.edition,
          pe.fifa_update AS fifaUpdate,
          pe.age,
          pe.club,
          pe.position,
          pe.rating,
          pe.potential,
          pe.value_eur AS valueEur,
          pe.wage_eur AS wageEur
        FROM players p
        INNER JOIN player_editions pe
          ON pe.player_id = p.id
        WHERE (? IS NULL OR p.gender = ?)
          AND pe.edition = ?
        ORDER BY p.name ASC, p.id ASC
        LIMIT ? OFFSET ?
        `,
        [safeGender, safeGender, safeEdition, safeLimit, offset],
      );
    } else {
      countResult = await this.playersRepository.query(
        `
        SELECT COUNT(*) AS total
        FROM players p
        WHERE (? IS NULL OR p.gender = ?)
        `,
        [safeGender, safeGender],
      );

      data = await this.playersRepository.query(
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
    }

    const total = Number(countResult[0].total);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }
}




