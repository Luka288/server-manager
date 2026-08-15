import { Router } from 'express';
import { ServerRegistry } from '@game-server/server-manager';
import {
  buildMinecraftCommand,
  provisionMinecraftJar,
} from '@game-server/command-builder';
import { randomUUID } from 'node:crypto';

export function createServerRoutes(registry: ServerRegistry) {
  const router = Router();

  router.get('/', (req, res) => {
    const managers = registry.list();

    const servers = Array.from(managers.entries()).map(([id, manager]) => ({
      id,
      status: manager.getStatus(),
    }));

    res.json(servers);
  });

  router.post('/', async (req, res) => {
    const uuid = randomUUID();

    const { name, memoryMb, jarFile, version } = req.body;

    const serverDirectory = `./servers/${uuid}`;

    const command = buildMinecraftCommand({
      memoryMb: memoryMb,
      jarFile: jarFile ?? 'server.jar',
      serverDirectory: serverDirectory,
    });

    const server = registry.create(uuid, command);

    server.on('stdout', (chunk) => {
      console.log(`[${uuid}] [stdout]: ${chunk}`);
    });

    server.on('stderr', (chunk) => {
      console.error(`[${uuid}] [stderr]: ${chunk}`);
    });

    server.on('exit', (code) => {
      console.log(`[${uuid}] [exit]: process exited with code ${code}`);
    });

    if (version) {
      try {
        await provisionMinecraftJar(version, `${serverDirectory}/server.jar`);
        server.markStatus('stopped');
        console.log(`[${uuid}] jar provisioned successfully`);
      } catch (err) {
        server.markStatus('crashed');
        console.error(
          `[${uuid}] provisioning failed: ${(err as Error).message}`,
        );
      }
    }

    res.json({
      id: uuid,
      name: name,
      status: server.getStatus(),
    });
  });

  router.post('/:id/start', (req, res) => {
    const server_id = req.params.id;

    try {
      const currentServer = registry.get(server_id);

      currentServer.start();

      res.json({
        id: server_id,
        status: currentServer.getStatus(),
      });
    } catch (error) {
      res.status(404).json({ error: 'Server not found' });
    }
  });

  router.post('/:id/stop', (req, res) => {
    const server_id = req.params.id;

    try {
      const currentServer = registry.get(server_id);

      currentServer.stop();

      res.json({
        id: server_id,
        status: currentServer.getStatus(),
      });
    } catch (error) {
      const errMsg = (error as Error).message;
      const errCode = errMsg.includes('not found') ? 404 : 409;

      res.status(errCode).json({ error: errMsg });
    }
  });

  router.post('/:id/restart', (req, res) => {
    const server_id = req.params.id;

    try {
      const currentServer = registry.get(server_id);

      currentServer.restart();

      res.json({
        id: server_id,
        status: currentServer.getStatus(),
      });
    } catch (error) {
      res.status(404).json({ error: 'Server not found' });
    }
  });

  router.get('/:id/status', (req, res) => {
    const serverId = req.params.id;

    try {
      const currentServer = registry.get(serverId);

      res
        .status(200)
        .json({ success: true, status: currentServer.getStatus() });
    } catch (error) {
      const errMsg = (error as Error).message;
      const errCode = errMsg.includes('not found') ? 404 : 409;

      res.status(errCode).json({ error: errMsg });
    }
  });

  return router;
}
