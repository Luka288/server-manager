import { Router } from 'express';
import { ServerRegistry } from '@game-server/server-manager';
import {
  buildMinecraftCommand,
  provisionMinecraftJar,
  writeServerProperties,
} from '@game-server/command-builder';
import { randomUUID } from 'node:crypto';
import { db, servers as serversTable } from '@game-server/database';
import { eq } from 'drizzle-orm';
import { getPublicIp, getServerPort } from '../lib/public-ip';
import { existsSync } from 'node:fs';
import { openPort, closePort } from '@game-server/server/unpnp';
import { Socket } from 'node:dgram';

export function createServerRoutes(
  registry: ServerRegistry,
  onServerCreated?: (
    serverId: string,
    manager: ReturnType<ServerRegistry['create']>,
  ) => void,
) {
  const router = Router();

  router.get('/', (req, res) => {
    const managers = registry.list();

    const servers = Array.from(managers.entries()).map(([id, manager]) => ({
      id,
      name: manager.getName(),
      status: manager.getStatus(),
    }));

    res.json(servers);
  });

  // server creation endpoint
  router.post('/', async (req, res) => {
    const uuid = randomUUID();

    const {
      name,
      memoryMb,
      jarFile,
      version,
      gamemode,
      difficulty,
      maxPlayers,
      pvp,
      whitelist,
      onlineMode,
      worldSeed,
    } = req.body;

    const serverDirectory = `./servers/${uuid}`;

    const command = buildMinecraftCommand({
      memoryMb: memoryMb,
      jarFile: jarFile ?? 'server.jar',
      serverDirectory: serverDirectory,
      name: name,
    });

    writeServerProperties(serverDirectory, {
      gamemode,
      difficulty,
      maxPlayers,
      pvp,
      whitelist,
      onlineMode,
      worldSeed,
    });

    const server = registry.create(uuid, { ...command, name });

    onServerCreated?.(uuid, server);

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

    await db.insert(serversTable).values({
      id: uuid,
      name: name,
      memoryMb: memoryMb,
      jarFile: jarFile ?? 'server.jar',
      serverDirectory: serverDirectory,
      version: version ?? null,
      status: server.getStatus(),
    });

    res.json({
      id: uuid,
      name: name,
      status: server.getStatus(),
    });
  });

  router.get('/versions', async (req, res) => {
    try {
      const response = await fetch(
        'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',
      );

      if (!response.ok) {
        throw new Error(`Mojang API returned ${response.status}`);
      }

      const data = await response.json();

      const versions = data.versions
        .filter((version: { type: string }) => version.type === 'release')
        .map((version: { id: string }) => version.id);

      res.json(versions);
    } catch (error) {
      console.error('Failed to fetch Minecraft versions:', error);

      res.status(500).json({
        error: 'Failed to fetch Minecraft versions',
      });
    }
  });

  router.post('/:id/start', async (req, res) => {
    const server_id = req.params.id;

    try {
      const currentServer = registry.get(server_id);

      const [row] = await db
        .select()
        .from(serversTable)
        .where(eq(serversTable.id, server_id));

      if (row.initialized && !existsSync(row.serverDirectory)) {
        res.status(409).json({
          error: 'Server folder is missing. It may have been moved or deleted.',
          code: 'FOLDER_MISSING',
        });
        return;
      }

      currentServer.start();

      const port = getServerPort(row.serverDirectory);
      try {
        await openPort(port);
        console.log(`[${server_id}] UPnP: opened port ${port}`);
      } catch (upnpErr) {
        console.error(
          `[${server_id}] UPnP open failed: ${(upnpErr as Error).message}`,
        );
      }

      if (!row.initialized) {
        await db
          .update(serversTable)
          .set({ initialized: true })
          .where(eq(serversTable.id, server_id));
      }

      res.json({
        id: server_id,
        status: currentServer.getStatus(),
      });
    } catch (error) {
      res.status(404).json({ error: 'Server not found' });
    }
  });

  router.post('/:id/stop', async (req, res) => {
    const server_id = req.params.id;

    try {
      const currentServer = registry.get(server_id);

      currentServer.stop();

      const [row] = await db
        .select()
        .from(serversTable)
        .where(eq(serversTable.id, server_id));

      const port = getServerPort(row.serverDirectory);
      try {
        await closePort(port);
        console.log(`[${server_id}] UPnP: closed port ${port}`);
      } catch (upnpErr) {
        console.error(
          `[${server_id}] UPnP close failed: ${(upnpErr as Error).message}`,
        );
      }

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

  router.get('/:id', async (req, res) => {
    try {
      const serverId = req.params.id;

      const server = registry.get(serverId);
      const publicIp = await getPublicIp();
      const port = getServerPort(`./servers/${serverId}`);

      const serverDirectory = `./servers/${serverId}`;

      res.json({
        id: serverId,
        name: server.getName(),
        status: server.getStatus(),
        ip: publicIp,
        port: getServerPort(serverDirectory),
        connectAddress: `${publicIp}:${port}`,
        note: 'Share this address with friends. If they cannot connect, you may need to enable port forwarding for this port on your router.',
      });
    } catch (error) {
      res.status(404).json({ success: false, error: 'server not found' });
    }
  });

  router.delete('/:id/delete', async (req, res) => {
    const serverId = req.params.id;

    try {
      const currentServer = registry.get(serverId);

      if (currentServer.getStatus() === 'running') {
        res
          .status(403)
          .json({ success: false, error: 'Cannot remove running server' });

        return;
      }

      registry.delete(serverId);

      await db.delete(serversTable).where(eq(serversTable.id, serverId));
      res.json({ id: serverId, deleted: true });
    } catch (error) {
      res.status(404).json({ error: 'Server not found' });
    }
  });

  return router;
}
