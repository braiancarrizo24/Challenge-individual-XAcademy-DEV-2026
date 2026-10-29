
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse';
import 'dotenv/config';
import mysql from 'mysql2/promise';

interface FifaCsvRow {
  player_id: string;
  fifa_version: string;
  fifa_update: string;
  short_name: string;
  long_name: string;
  nationality_name: string;
  player_positions: string;
  overall: string;
  potential: string;
  age: string;
  club_name: string;
  value_eur: string;
  wage_eur: string;

  pace?: string;
  shooting?: string;
  passing?: string;
  dribbling?: string;
  defending?: string;
  physic?: string;
  attacking_crossing?: string;
  attacking_finishing?: string;
  attacking_heading_accuracy?: string;
  attacking_short_passing?: string;
  attacking_volleys?: string;
  skill_dribbling?: string;
  skill_curve?: string;
  skill_fk_accuracy?: string;
  skill_long_passing?: string;
  skill_ball_control?: string;
  movement_acceleration?: string;
  movement_sprint_speed?: string;
  movement_agility?: string;
  movement_reactions?: string;
  movement_balance?: string;
  power_shot_power?: string;
  power_jumping?: string;
  power_stamina?: string;
  power_strength?: string;
  power_long_shots?: string;
  mentality_aggression?: string;
  mentality_interceptions?: string;
  mentality_positioning?: string;
  mentality_vision?: string;
  mentality_penalties?: string;
  mentality_composure?: string;
  defending_marking_awareness?: string;
  defending_standing_tackle?: string;
  defending_sliding_tackle?: string;
  goalkeeping_diving?: string;
  goalkeeping_handling?: string;
  goalkeeping_kicking?: string;
  goalkeeping_positioning?: string;
  goalkeeping_reflexes?: string;
  goalkeeping_speed?: string;
  skill_moves?: string;
}

interface PlayerToImport {
  sourcePlayerId: number;
  name: string;
  nationality: string | null;
  gender: Gender;
}

interface PlayerEditionToImport {
  sourcePlayerId: number;
  edition: number;
  fifaUpdate: number;
  age: number | null;
  club: string | null;
  position: string | null;
  rating: number | null;
  potential: number | null;
  valueEur: number | null;
  wageEur: number | null;
}

interface SkillValue {
  skill: string;
  value: number;
}

interface SkillEditionToImport {
  sourcePlayerId: number;
  edition: number;
  fifaUpdate: number;
  skills: SkillValue[];
}

const skillColumns = [
  'pace',
  'shooting',
  'passing',
  'dribbling',
  'defending',
  'physic',
  'attacking_crossing',
  'attacking_finishing',
  'attacking_heading_accuracy',
  'attacking_short_passing',
  'attacking_volleys',
  'skill_dribbling',
  'skill_curve',
  'skill_fk_accuracy',
  'skill_long_passing',
  'skill_ball_control',
  'movement_acceleration',
  'movement_sprint_speed',
  'movement_agility',
  'movement_reactions',
  'movement_balance',
  'power_shot_power',
  'power_jumping',
  'power_stamina',
  'power_strength',
  'power_long_shots',
  'mentality_aggression',
  'mentality_interceptions',
  'mentality_positioning',
  'mentality_vision',
  'mentality_penalties',
  'mentality_composure',
  'defending_marking_awareness',
  'defending_standing_tackle',
  'defending_sliding_tackle',
  'goalkeeping_diving',
  'goalkeeping_handling',
  'goalkeeping_kicking',
  'goalkeeping_positioning',
  'goalkeeping_reflexes',
  'goalkeeping_speed',
  'skill_moves',
] as const;

const datasets = [
  {
    path: resolve(process.cwd(), '..', 'data', 'male_players-1.csv'),
    gender: 'male',
  },
  {
    path: resolve(process.cwd(), '..', 'data', 'female_players-1.csv'),
    gender: 'female',
  },
] as const;

type Gender = (typeof datasets)[number]['gender'];
type SkillColumn = (typeof skillColumns)[number];

async function createImportConnection() {
  return mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: process.env.IMPORT_DB_USERNAME,
    password: process.env.IMPORT_DB_PASSWORD,
    database: 'fifa_stats',
  });
}

async function testDatabaseConnection(): Promise<void> {
  const connection = await createImportConnection();

  try {
    const [rows] = await connection.query(
      'SELECT DATABASE() AS databaseName, VERSION() AS mysqlVersion',
    );

    console.log('Conexión a MySQL verificada:');
    console.log(rows);
  } finally {
    await connection.end();
  }
}

function parseOptionalNumber(
  value: string | undefined,
): number | null {
  if (value === undefined || value.trim() === '') {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

async function readUniquePlayers(
  filePath: string,
  gender: Gender,
): Promise<Map<number, PlayerToImport>> {
  const players = new Map<number, PlayerToImport>();

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    }),
  );

  for await (const row of parser) {
    const csvPlayer = row as FifaCsvRow;
    const sourcePlayerId = Number(csvPlayer.player_id);

    if (!Number.isInteger(sourcePlayerId)) {
      continue;
    }

    if (!players.has(sourcePlayerId)) {
      const fullName = csvPlayer.long_name?.trim();
      const shortName = csvPlayer.short_name?.trim();
      const nationality = csvPlayer.nationality_name?.trim();

      players.set(sourcePlayerId, {
        sourcePlayerId,
        name: fullName || shortName || `Jugador ${sourcePlayerId}`,
        nationality: nationality || null,
        gender,
      });
    }
  }

  return players;
}

async function readLatestPlayerEditions(
  filePath: string,
): Promise<Map<string, PlayerEditionToImport>> {
  const editions = new Map<string, PlayerEditionToImport>();

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    }),
  );

  for await (const row of parser) {
    const csvPlayer = row as FifaCsvRow;
    const sourcePlayerId = Number(csvPlayer.player_id);
    const edition = Number(csvPlayer.fifa_version);
    const fifaUpdate = Number(csvPlayer.fifa_update);

    if (
      !Number.isInteger(sourcePlayerId) ||
      !Number.isInteger(edition) ||
      !Number.isInteger(fifaUpdate)
    ) {
      continue;
    }

    const key = `${sourcePlayerId}-${edition}`;
    const existingEdition = editions.get(key);

    if (existingEdition && existingEdition.fifaUpdate >= fifaUpdate) {
      continue;
    }

    const position = csvPlayer.player_positions?.trim();
    const club = csvPlayer.club_name?.trim();

    editions.set(key, {
      sourcePlayerId,
      edition,
      fifaUpdate,
      age: parseOptionalNumber(csvPlayer.age),
      club: club || null,
      position: position || null,
      rating: parseOptionalNumber(csvPlayer.overall),
      potential: parseOptionalNumber(csvPlayer.potential),
      valueEur: parseOptionalNumber(csvPlayer.value_eur),
      wageEur: parseOptionalNumber(csvPlayer.wage_eur),
    });
  }

  return editions;
}

async function readLatestSkillEditions(
  filePath: string,
): Promise<Map<string, SkillEditionToImport>> {
  const editions = new Map<string, SkillEditionToImport>();

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    }),
  );

  for await (const row of parser) {
    const csvPlayer = row as FifaCsvRow;
    const sourcePlayerId = Number(csvPlayer.player_id);
    const edition = Number(csvPlayer.fifa_version);
    const fifaUpdate = Number(csvPlayer.fifa_update);

    if (
      !Number.isInteger(sourcePlayerId) ||
      !Number.isInteger(edition) ||
      !Number.isInteger(fifaUpdate)
    ) {
      continue;
    }

    const key = `${sourcePlayerId}-${edition}`;
    const existing = editions.get(key);

    // Mantener la actualización más reciente de cada jugador y edición.
    if (existing && existing.fifaUpdate >= fifaUpdate) {
      continue;
    }

    const skills: SkillValue[] = [];

    for (const skill of skillColumns) {
      const value = parseOptionalNumber(csvPlayer[skill]);

      // No insertar habilidades vacías ni valores fuera de rango.
      if (
        value !== null &&
        value >= 0 &&
        value <= 100
      ) {
        skills.push({ skill, value });
      }
    }

    editions.set(key, {
      sourcePlayerId,
      edition,
      fifaUpdate,
      skills,
    });
  }

  return editions;
}

async function main(): Promise<void> {
  console.log(`Habilidades configuradas: ${skillColumns.length}`);

  let totalPlayers = 0;
  let totalEditions = 0;

  for (const dataset of datasets) {
    console.log(`\nAnalizando jugadores: ${dataset.gender}`);
    console.log(`Archivo: ${dataset.path}`);

    const players = await readUniquePlayers(
      dataset.path,
      dataset.gender,
    );

    console.log(`Jugadores únicos: ${players.size}`);
    totalPlayers += players.size;

    console.log(`\nAnalizando ediciones: ${dataset.gender}`);

    const editions = await readLatestPlayerEditions(dataset.path);

    console.log(`Ediciones únicas detectadas: ${editions.size}`);
    totalEditions += editions.size;
  }

  console.log(`\nTotal de jugadores únicos: ${totalPlayers}`);
  console.log(`Total de ediciones únicas: ${totalEditions}`);
}

async function importPlayers(): Promise<void> {
  const connection = await createImportConnection();

  try {
    let totalProcessed = 0;
    const batchSize = 500;

    for (const dataset of datasets) {
      console.log(`\nPreparando jugadores: ${dataset.gender}`);

      const players = await readUniquePlayers(
        dataset.path,
        dataset.gender,
      );

      const playerList = Array.from(players.values());
      console.log(`Jugadores únicos detectados: ${playerList.length}`);

      for (let i = 0; i < playerList.length; i += batchSize) {
        const batch = playerList.slice(i, i + batchSize);

        const values = batch.map((player) => [
          player.sourcePlayerId,
          player.name,
          player.nationality,
          player.gender,
        ]);

        await connection.query(
          `INSERT INTO players
            (source_player_id, name, nationality, gender)
           VALUES ?
           ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            nationality = VALUES(nationality)`,
          [values],
        );

        totalProcessed += batch.length;

        if (totalProcessed % 5000 === 0) {
          console.log(`Registros procesados: ${totalProcessed}`);
        }
      }

      console.log(`Finalizado género: ${dataset.gender}`);
    }

    const [rows] = await connection.query(
      'SELECT COUNT(*) AS total FROM players',
    );

    console.log('\nImportación de jugadores finalizada.');
    console.log('Total de registros en players:', rows);
  } finally {
    await connection.end();
  }
}

async function importPlayerEditions(): Promise<void> {
  const connection = await createImportConnection();

  try {
    const batchSize = 500;
    let totalProcessed = 0;

    for (const dataset of datasets) {
      console.log(`\nPreparando ediciones: ${dataset.gender}`);

      const editions = await readLatestPlayerEditions(dataset.path);
      const editionList = Array.from(editions.values());

      console.log(`Ediciones únicas detectadas: ${editionList.length}`);

      for (let i = 0; i < editionList.length; i += batchSize) {
        const batch = editionList.slice(i, i + batchSize);
        const sourcePlayerIds = [
          ...new Set(batch.map((edition) => edition.sourcePlayerId)),
        ];

        const placeholders = sourcePlayerIds.map(() => '?').join(', ');

        const [playerRows] = await connection.query(
          `SELECT id, source_player_id
           FROM players
           WHERE gender = ? AND source_player_id IN (${placeholders})`,
          [dataset.gender, ...sourcePlayerIds],
        );

        const playerIdBySourceId = new Map<number, number>();

        for (const row of playerRows as {
          id: number;
          source_player_id: number;
        }[]) {
          playerIdBySourceId.set(
            Number(row.source_player_id),
            Number(row.id),
          );
        }

        const values = batch.map((edition) => {
          const playerId = playerIdBySourceId.get(
            edition.sourcePlayerId,
          );

          if (playerId === undefined) {
            throw new Error(
              `No se encontró el jugador ${edition.sourcePlayerId} (${dataset.gender})`,
            );
          }

          return [
            playerId,
            edition.edition,
            edition.fifaUpdate,
            edition.age,
            edition.club,
            edition.position,
            edition.rating,
            edition.potential,
            edition.valueEur,
            edition.wageEur,
          ];
        });

        await connection.query(
          `INSERT INTO player_editions
            (player_id, edition, fifa_update, age, club, position,
             rating, potential, value_eur, wage_eur)
           VALUES ?
           ON DUPLICATE KEY UPDATE
             fifa_update = VALUES(fifa_update),
             age = VALUES(age),
             club = VALUES(club),
             position = VALUES(position),
             rating = VALUES(rating),
             potential = VALUES(potential),
             value_eur = VALUES(value_eur),
             wage_eur = VALUES(wage_eur)`,
          [values],
        );

        totalProcessed += batch.length;

        if (totalProcessed % 5000 === 0) {
          console.log(`Ediciones procesadas: ${totalProcessed}`);
        }
      }

      console.log(`Finalizado género: ${dataset.gender}`);
    }

    const [rows] = await connection.query(
      'SELECT COUNT(*) AS total FROM player_editions',
    );

    console.log('\nImportación de ediciones finalizada.');
    console.log('Total de registros en player_editions:', rows);
  } finally {
    await connection.end();
  }
}

async function importPlayerSkills(): Promise<void> {
  const connection = await createImportConnection();

  try {
    const batchSize = 500;
    let totalEditionsProcessed = 0;
    let totalSkillsPrepared = 0;

    for (const dataset of datasets) {
      console.log(`\nPreparando habilidades: ${dataset.gender}`);

      const editions = await readLatestSkillEditions(dataset.path);
      const editionList = Array.from(editions.values());

      console.log(`Ediciones únicas detectadas: ${editionList.length}`);

      for (let i = 0; i < editionList.length; i += batchSize) {
        const batch = editionList.slice(i, i + batchSize);

        const tuplePlaceholders = batch
          .map(() => '(?, ?)')
          .join(', ');

        const queryParameters: (string | number)[] = [
          dataset.gender,
        ];

        for (const edition of batch) {
          queryParameters.push(
            edition.sourcePlayerId,
            edition.edition,
          );
        }

        const [editionRows] = await connection.query(
          `SELECT pe.id, p.source_player_id, pe.edition
           FROM player_editions pe
           INNER JOIN players p ON p.id = pe.player_id
           WHERE p.gender = ?
             AND (p.source_player_id, pe.edition) IN (${tuplePlaceholders})`,
          queryParameters,
        );

        const editionIdByKey = new Map<string, number>();

        for (const row of editionRows as {
          id: number;
          source_player_id: number;
          edition: number;
        }[]) {
          editionIdByKey.set(
            `${Number(row.source_player_id)}-${Number(row.edition)}`,
            Number(row.id),
          );
        }

        const skillValues: [number, string, number][] = [];

        for (const edition of batch) {
          const key = `${edition.sourcePlayerId}-${edition.edition}`;
          const playerEditionId = editionIdByKey.get(key);

          if (playerEditionId === undefined) {
            throw new Error(
              `No se encontró player_edition para ${dataset.gender}, jugador ${edition.sourcePlayerId}, edición ${edition.edition}`,
            );
          }

          for (const skill of edition.skills) {
            skillValues.push([
              playerEditionId,
              skill.skill,
              skill.value,
            ]);
          }
        }

        // Los registros se insertan en bloques para controlar el tamaño
        // de las consultas. ON DUPLICATE KEY UPDATE permite reintentar.
        const skillBatchSize = 5000;

        for (
          let skillIndex = 0;
          skillIndex < skillValues.length;
          skillIndex += skillBatchSize
        ) {
          const skillBatch = skillValues.slice(
            skillIndex,
            skillIndex + skillBatchSize,
          );

          await connection.query(
            `INSERT INTO player_skills
              (player_edition_id, skill, value)
             VALUES ?
             ON DUPLICATE KEY UPDATE
              value = VALUES(value)`,
            [skillBatch],
          );

          totalSkillsPrepared += skillBatch.length;
        }

        totalEditionsProcessed += batch.length;

        if (totalEditionsProcessed % 5000 === 0) {
          console.log(
            `Ediciones procesadas: ${totalEditionsProcessed}; habilidades preparadas: ${totalSkillsPrepared}`,
          );
        }
      }

      console.log(`Finalizado género: ${dataset.gender}`);
    }

    const [rows] = await connection.query(
      'SELECT COUNT(*) AS total FROM player_skills',
    );

    console.log('\nImportación de habilidades finalizada.');
    console.log(`Habilidades procesadas: ${totalSkillsPrepared}`);
    console.log('Total de registros en player_skills:', rows);
  } finally {
    await connection.end();
  }
}

async function runValidation(): Promise<void> {
  await testDatabaseConnection();
  await main();
}

const shouldImportPlayers = process.argv.includes('--import-players');
const shouldImportEditions = process.argv.includes('--import-editions');
const shouldImportSkills = process.argv.includes('--import-skills');

const selectedModes = [
  shouldImportPlayers,
  shouldImportEditions,
  shouldImportSkills,
].filter(Boolean).length;

if (selectedModes > 1) {
  console.error(
    'Elegí un solo modo: --import-players, --import-editions o --import-skills.',
  );
  process.exitCode = 1;
} else {
  const execution = shouldImportPlayers
    ? importPlayers()
    : shouldImportEditions
      ? importPlayerEditions()
      : shouldImportSkills
        ? importPlayerSkills()
        : runValidation();

  execution.catch((error: unknown) => {
    console.error('Falló la ejecución del importador.');
    console.error(
      error instanceof Error ? error.message : 'Error desconocido',
    );
    process.exitCode = 1;
  });
}



