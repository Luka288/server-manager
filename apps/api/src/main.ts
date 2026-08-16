import express from 'express';
import { ServerRegistry } from '@game-server/server-manager';
import { createServerRoutes } from './routes/servers';
import { db, servers as serversTable } from '@game-server/database';
import { buildMinecraftCommand } from '@game-server/command-builder';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main(): Promise<void> {
  const app = express();
  app.use(express.json());

  const registry = new ServerRegistry();

  const rows = await db.select().from(serversTable);

  for (const row of rows) {
    const command = buildMinecraftCommand({
      memoryMb: row.memoryMb,
      jarFile: row.jarFile,
      serverDirectory: row.serverDirectory,
      name: row.name,
    });

    registry.create(row.id, { ...command, name: row.name });
  }

  app.use('/api/servers', createServerRoutes(registry));

  app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
  });
}

main();
