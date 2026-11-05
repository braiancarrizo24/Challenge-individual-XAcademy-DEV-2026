
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PlayerEntity } from './entities/player.entity';
import { PlayerEditionEntity } from './entities/player-edition.entity';
import { PlayerSkillEntity } from './entities/player-skill.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { CreatePlayerEditionDto } from './dto/create-player-edition.dto';
import { UpdatePlayerEditionDto } from './dto/update-player-edition.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playersRepository: Repository<PlayerEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePlayerDto): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    let lockAcquired = false;

    try {
      await queryRunner.connect();

      const lockResult = await queryRunner.query(
        `SELECT GET_LOCK(?, 10) AS acquired`,
        ['fifa_stats_manual_player_id'],
      );

      lockAcquired = Number(lockResult[0].acquired) === 1;

      if (!lockAcquired) {
        throw new ConflictException(
          'No se pudo reservar un identificador. Intentá nuevamente.',
        );
      }

      await queryRunner.startTransaction();

      const duplicateSkills = dto.edition.skills
        .map((skill) => skill.skill.trim().toLowerCase())
        .filter((skill, index, skills) => skills.indexOf(skill) !== index);

      if (duplicateSkills.length > 0) {
        throw new BadRequestException(
          'La edición contiene habilidades repetidas.',
        );
      }

      const playerRepository =
        queryRunner.manager.getRepository(PlayerEntity);

      const editionRepository =
        queryRunner.manager.getRepository(PlayerEditionEntity);

      const skillRepository =
        queryRunner.manager.getRepository(PlayerSkillEntity);

      const result = await queryRunner.query(
        `
        SELECT COALESCE(MIN(source_player_id), 0) - 1 AS nextId
        FROM players
        WHERE gender = ?
          AND source_player_id < 0
        `,
        [dto.gender],
      );

      const sourcePlayerId = Number(result[0].nextId);

      if (sourcePlayerId < -2147483648) {
        throw new InternalServerErrorException(
          'Se agotaron los identificadores disponibles.',
        );
      }

      const player = playerRepository.create({
        sourcePlayerId,
        name: dto.name.trim(),
        nationality: dto.nationality?.trim() || null,
        gender: dto.gender,
      });

      const savedPlayer = await playerRepository.save(player);

      const edition = editionRepository.create({
        playerId: savedPlayer.id,
        edition: dto.edition.edition,
        fifaUpdate: dto.edition.fifaUpdate,
        age: dto.edition.age ?? null,
        club: dto.edition.club?.trim() || null,
        position: dto.edition.position?.trim() || null,
        rating: dto.edition.rating ?? null,
        potential: dto.edition.potential ?? null,
        valueEur: dto.edition.valueEur ?? null,
        wageEur: dto.edition.wageEur ?? null,
      });

      const savedEdition = await editionRepository.save(edition);

      if (dto.edition.skills.length > 0) {
        const skills = dto.edition.skills.map((skill) =>
          skillRepository.create({
            playerEditionId: savedEdition.id,
            skill: skill.skill.trim(),
            value: skill.value,
          }),
        );

        await skillRepository.save(skills);
      }

      await queryRunner.commitTransaction();

      return await this.findOne(savedPlayer.id);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'Ya existe un registro duplicado para este jugador.',
        );
      }

      throw error;
    } finally {
      if (lockAcquired) {
        await queryRunner.query(
          `SELECT RELEASE_LOCK(?)`,
          ['fifa_stats_manual_player_id'],
        );
      }

      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  async update(id: number, dto: UpdatePlayerDto): Promise<any> {
    const player = await this.playersRepository.findOne({
      where: { id },
    });

    if (!player) {
      throw new NotFoundException('Jugador no encontrado');
    }

    if (dto.name !== undefined) {
      player.name = dto.name.trim();
    }

    if (dto.nationality !== undefined) {
      player.nationality = dto.nationality.trim() || null;
    }

    await this.playersRepository.save(player);

    return this.findOne(id);
  }

  async addEdition(
    playerId: number,
    dto: CreatePlayerEditionDto,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const playerRepository =
        queryRunner.manager.getRepository(PlayerEntity);

      const editionRepository =
        queryRunner.manager.getRepository(PlayerEditionEntity);

      const skillRepository =
        queryRunner.manager.getRepository(PlayerSkillEntity);

      const player = await playerRepository.findOne({
        where: { id: playerId },
      });

      if (!player) {
        throw new NotFoundException('Jugador no encontrado');
      }

      const existingEdition = await editionRepository.findOne({
        where: {
        playerId,
        edition: dto.edition,
        fifaUpdate: dto.fifaUpdate,
      },
    });

     if (existingEdition) {
       throw new ConflictException(
       'El jugador ya tiene registrada esta edición y actualización de FIFA.',
      );
     }

      const duplicateSkills = dto.skills
        .map((skill) => skill.skill.trim().toLowerCase())
        .filter((skill, index, skills) => skills.indexOf(skill) !== index);

      if (duplicateSkills.length > 0) {
        throw new BadRequestException(
          'La edición contiene habilidades repetidas.',
        );
      }

      const edition = editionRepository.create({
        playerId,
        edition: dto.edition,
        fifaUpdate: dto.fifaUpdate,
        age: dto.age ?? null,
        club: dto.club?.trim() || null,
        position: dto.position?.trim() || null,
        rating: dto.rating ?? null,
        potential: dto.potential ?? null,
        valueEur: dto.valueEur ?? null,
        wageEur: dto.wageEur ?? null,
      });

      const savedEdition = await editionRepository.save(edition);

      if (dto.skills.length > 0) {
        const skills = dto.skills.map((skill) =>
          skillRepository.create({
            playerEditionId: savedEdition.id,
            skill: skill.skill.trim(),
            value: skill.value,
          }),
        );

        await skillRepository.save(skills);
      }

      await queryRunner.commitTransaction();

      return await this.findOne(playerId);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'Ya existe una edición o habilidad duplicada.',
        );
      }

      throw error;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  async updateEdition(
    playerId: number,
    editionId: number,
    dto: UpdatePlayerEditionDto,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const playerRepository =
        queryRunner.manager.getRepository(PlayerEntity);

      const editionRepository =
        queryRunner.manager.getRepository(PlayerEditionEntity);

      const skillRepository =
        queryRunner.manager.getRepository(PlayerSkillEntity);

      const player = await playerRepository.findOne({
        where: { id: playerId },
      });

      if (!player) {
        throw new NotFoundException('Jugador no encontrado');
      }

      const edition = await editionRepository.findOne({
        where: {
          id: editionId,
          playerId,
        },
      });

      if (!edition) {
        throw new NotFoundException(
          'La edición no existe o no pertenece a este jugador.',
        );
      }

      if (dto.skills !== undefined) {
        const duplicateSkills = dto.skills
          .map((skill) => skill.skill.trim().toLowerCase())
          .filter(
            (skill, index, skills) => skills.indexOf(skill) !== index,
          );

        if (duplicateSkills.length > 0) {
          throw new BadRequestException(
            'La edición contiene habilidades repetidas.',
          );
        }
      }

      if (dto.edition !== undefined) {
        edition.edition = dto.edition;
      }

      if (dto.fifaUpdate !== undefined) {
        edition.fifaUpdate = dto.fifaUpdate;
      }

      if (dto.age !== undefined) {
        edition.age = dto.age;
      }

      if (dto.club !== undefined) {
        edition.club = dto.club.trim() || null;
      }

      if (dto.position !== undefined) {
        edition.position = dto.position.trim() || null;
      }

      if (dto.rating !== undefined) {
        edition.rating = dto.rating;
      }

      if (dto.potential !== undefined) {
        edition.potential = dto.potential;
      }

      if (dto.valueEur !== undefined) {
        edition.valueEur = dto.valueEur;
      }

      if (dto.wageEur !== undefined) {
        edition.wageEur = dto.wageEur;
      }

      await editionRepository.save(edition);

      if (dto.skills !== undefined) {
        await skillRepository.delete({
          playerEditionId: editionId,
        });

        if (dto.skills.length > 0) {
          const skills = dto.skills.map((skill) =>
            skillRepository.create({
              playerEditionId: editionId,
              skill: skill.skill.trim(),
              value: skill.value,
            }),
          );

          await skillRepository.save(skills);
        }
      }

      await queryRunner.commitTransaction();

      return await this.findOne(playerId);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }

      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'Ya existe una edición o habilidad duplicada.',
        );
      }

      throw error;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }

  async findAll(
    page = 1,
    limit = 30,
    gender?: string,
    edition?: number,
    name?: string,
    club?: string,
    position?: string,
    exportAll = false,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(30, Math.max(1, limit));
    const offset = exportAll ? 0 : (safePage - 1) * safeLimit;

    const paginationSql = exportAll ? '' : 'LIMIT ? OFFSET ?';
    const paginationParams = exportAll ? [] : [safeLimit, offset];

    const safeGender =
      gender === 'male' || gender === 'female' ? gender : null;

    const safeEdition =
      edition !== undefined &&
      Number.isInteger(edition) &&
      edition >= 15 &&
      edition <= 23
        ? edition
        : null;

    const safeName = name?.trim() || null;
    const safeClub = club?.trim() || null;
    const safePosition = position?.trim() || null;

    const hasFilters = Boolean(
      safeName || safeClub || safePosition,
    );

    const filters = `
      (? IS NULL OR p.name LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR pe.club LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR pe.position LIKE CONCAT('%', ?, '%'))
    `;

    const filterParams = [
      safeName,
      safeName,
      safeClub,
      safeClub,
      safePosition,
      safePosition,
    ];

    let countResult: any[];
    let data: any[];

    if (hasFilters) {
      countResult = await this.playersRepository.query(
        `
        SELECT COUNT(*) AS total
        FROM players p
        INNER JOIN player_editions pe
          ON pe.player_id = p.id
        WHERE (? IS NULL OR p.gender = ?)
          AND pe.edition BETWEEN 15 AND 23
          AND ${filters}
        `,
        [
          safeGender,
          safeGender,
          ...filterParams,
        ],
      );

      data = await this.playersRepository.query(
        `
        SELECT
          p.id,
          pe.id AS playerEditionId,
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
          AND pe.edition BETWEEN 15 AND 23
          AND ${filters}
        ORDER BY p.name ASC, pe.edition DESC, pe.fifa_update DESC, pe.id DESC
        ${paginationSql}
        `,
        [
          safeGender,
          safeGender,
          ...filterParams,
          ...paginationParams,
        ],
      );
    } else if (safeEdition !== null) {
      countResult = await this.playersRepository.query(
        `
        SELECT COUNT(*) AS total
        FROM players p
        INNER JOIN player_editions pe
          ON pe.player_id = p.id
        WHERE (? IS NULL OR p.gender = ?)
          AND pe.edition = ?
        `,
        [
          safeGender,
          safeGender,
          safeEdition,
        ],
      );

      data = await this.playersRepository.query(
        `
        SELECT
          p.id,
          pe.id AS playerEditionId,
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
        ORDER BY p.name ASC, p.id ASC, pe.fifa_update DESC, pe.id DESC
        ${paginationSql}
        `,
        [
          safeGender,
          safeGender,
          safeEdition,
          ...paginationParams,
        ],
      );
    } else {
      const latestVersionQuery = `
        SELECT
          p.id,
          pe.id AS player_edition_id,
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
      `;

      countResult = await this.playersRepository.query(
        `
        SELECT COUNT(*) AS total
        FROM (${latestVersionQuery}) AS ranked
        WHERE ranked.version_number = 1
        `,
        [
          safeGender,
          safeGender,
        ],
      );

      data = await this.playersRepository.query(
        `
        SELECT
          ranked.id,
          ranked.player_edition_id AS playerEditionId,
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
        FROM (${latestVersionQuery}) AS ranked
        WHERE ranked.version_number = 1
        ORDER BY ranked.name ASC, ranked.id ASC
        ${paginationSql}
        `,
        [
          safeGender,
          safeGender,
          ...paginationParams,
        ],
      );
    }

    const total = Number(countResult[0].total);

    return {
      data,
      total,
      page: exportAll ? 1 : safePage,
      limit: exportAll ? total : safeLimit,
      totalPages: exportAll
        ? (total > 0 ? 1 : 0)
        : Math.ceil(total / safeLimit),
    };
  }

  async findOne(id: number): Promise<any> {
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

    if (players.length === 0) {
      throw new NotFoundException('Jugador no encontrado');
    }

    const player = players[0];

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

    return {
      ...player,
      editions: editionsWithSkills,
    };
  }
}













