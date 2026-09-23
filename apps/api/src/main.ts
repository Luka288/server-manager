import express from 'express';
import { ServerRegistry } from '@game-server/server-manager';
import { createServerRoutes } from './routes/index';
import { db, servers as serversTable } from '@game-server/database';
import { buildMinecraftCommand } from '@game-server/command-builder';
import cors from 'cors';
import { createServer } from 'node:http';
import { ServerSocket } from './lib/server-socket';
import { errorHandler } from './lib/error-handler';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main(): Promise<void> {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const registry = new ServerRegistry();

  const HttpServer = createServer(app);
  const serverSocket = new ServerSocket(HttpServer, registry);

  const rows = await db.select().from(serversTable);

  for (const row of rows) {
    const command = buildMinecraftCommand({
      memoryMb: row.memoryMb,
      jarFile: row.jarFile,
      serverDirectory: row.serverDirectory,
      name: row.name,
    });

    const manager = registry.create(row.id, {
      ...command,
      name: row.name,
    });

    serverSocket.attachManager(row.id, manager);
  }

  app.use(
    '/',
    createServerRoutes(registry, (serverId, manager) => {
      serverSocket.attachManager(serverId, manager);
    }),
  );

  app.use(errorHandler);

  HttpServer.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
    console.log(`[ ws ] ws://${host}:${port}/ws`);
  });
}

main();
