
import { createReadStream } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse';

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
}

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

async function main(): Promise<void> {
  for (const dataset of datasets) {
    console.log(`\nAnalizando archivo: ${dataset.path}`);

    let rowsRead = 0;
    let rowsWithInvalidIds = 0;

    const latestUpdates = new Map<string, number>();

    const parser = createReadStream(dataset.path).pipe(
      parse({
        columns: true,
        bom: true,
        skip_empty_lines: true,
        relax_column_count: false,
      }),
    );

    for await (const row of parser) {
      const player = row as FifaCsvRow;

      const playerId = Number(player.player_id);
      const edition = Number(player.fifa_version);
      const update = Number(player.fifa_update);

      rowsRead++;

      if (
        !Number.isInteger(playerId) ||
        !Number.isInteger(edition) ||
        !Number.isInteger(update)
      ) {
        rowsWithInvalidIds++;
        continue;
      }

      const key = `${playerId}:${edition}`;
      const currentUpdate = latestUpdates.get(key);

      if (
        currentUpdate === undefined ||
        update > currentUpdate
      ) {
        latestUpdates.set(key, update);
      }

      if (rowsRead % 25000 === 0) {
        console.log(`Filas leídas: ${rowsRead}`);
      }
    }

    console.log(`Género: ${dataset.gender}`);
    console.log(`Filas leídas: ${rowsRead}`);
    console.log(`Jugadores/ediciones únicas: ${latestUpdates.size}`);
    console.log(`Filas con identificadores inválidos: ${rowsWithInvalidIds}`);
  }
}

main().catch((error: unknown) => {
  console.error('Error al analizar los CSV:', error);
  process.exitCode = 1;
});
