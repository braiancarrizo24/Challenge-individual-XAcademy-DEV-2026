
import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: number): Promise<any> {
    // 1. Buscar los datos generales del jugador.
    const players = await this.playersRepository.query(
      `
      SELECT
        p.id,
        p.source_player_id AS sourcePlayerId,
        p.name,
        p.nationality,
        p.gender
      FROM players p
      WHERE p.id = ?
      `,
      [id],
    );

    // 2. Comprobar si el jugador existe.
    if (players.length === 0) {
      throw new NotFoundException('Jugador no encontrado');
    }

    const player = players[0];

    // 3. Recuperar todas las ediciones del jugador.
    const editions = await this.playersRepository.query(
      `
      SELECT
        pe.id,
        pe.edition,
        pe.fifa_update AS fifaUpdate,
        pe.age,
        pe.club,
        pe.position,
        pe.rating,
        pe.potential,
        pe.value_eur AS valueEur,
        pe.wage_eur AS wageEur
      FROM player_editions pe
      WHERE pe.player_id = ?
      ORDER BY pe.edition DESC, pe.fifa_update DESC
      `,
      [id],
    );

    // 4. Recuperar las habilidades de todas sus ediciones.
    const skills = await this.playersRepository.query(
      `
      SELECT
        ps.player_edition_id AS playerEditionId,
        ps.skill,
        ps.value
      FROM player_skills ps
      INNER JOIN player_editions pe
        ON pe.id = ps.player_edition_id
      WHERE pe.player_id = ?
      ORDER BY ps.skill ASC
      `,
      [id],
    );

    // 5. Asociar cada habilidad con su edición.
    const editionsWithSkills = editions.map(
      (edition: any) => ({
        ...edition,
        skills: skills
          .filter(
            (skill: any) => skill.playerEditionId === edition.id,
          )
          .map((skill: any) => ({
            skill: skill.skill,
            value: skill.value,
          })),
      }),
    );

    // 6. Devolver el perfil completo.
    return {
      ...player,
      editions: editionsWithSkills,
    };
  }
}







