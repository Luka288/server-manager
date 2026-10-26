import express from 'express';
import { ServerRegistry } from '@game-server/server-manager';
import { createServerRoutes } from './routes/index';
import { db, servers as serversTable } from '@game-server/database';
import { buildMinecraftCommand } from '@game-server/command-builder';
import cors from 'cors';
import { createServer } from 'node:http';
import { ServerSocket } from './lib/server-socket';
import { errorHandler } from './lib/error-handler';
import { getServerTypeForJar } from './lib/providers';

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
      type: getServerTypeForJar(row.jarFile),
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

  let shuttingDown = false;

  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`Received ${signal}; shutting down...`);

    const httpClosed = new Promise<void>((resolve, reject) => {
      HttpServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    void (async () => {
      try {
        await serverSocket.close();

        const errors = await registry.shutdownAll();
        for (const error of errors) {
          console.error(error.message);
        }

        if (errors.length > 0) {
          process.exitCode = 1;
        }

        await httpClosed;
        console.log('Shutdown complete');
      } catch (error) {
        console.error('Shutdown failed:', error);
        process.exitCode = 1;
      }
    })();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
