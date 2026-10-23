import type { Request, Response } from 'express';
import { selectfolder } from '@game-server/server/selectfolder';
import { HttpError } from './../lib/http-error';
import { fetchReleaseVersions } from './../lib/minecraft-versions';
import type { ServersService } from './server.service';
import type { CreateServerInput } from './server.types';

/**
 * Explicitly whitelists the fields we accept, so random extra keys in the
 * body can never end up in server.properties.
 * (Swap this for a zod schema if you want stricter validation later.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCreateBody(body: any): CreateServerInput {
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
    serverDirectory,
  } = body ?? {};

  if (typeof name !== 'string' || !name.trim()) {
    throw HttpError.badRequest('name is required');
  }

  if (
    typeof memoryMb !== 'number' ||
    !Number.isFinite(memoryMb) ||
    memoryMb <= 0 ||
    !Number.isInteger(memoryMb)
  ) {
    throw HttpError.badRequest('memoryMb must be a positive integer');
  }

  return {
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
    serverDirectory: requireString(serverDirectory, 'serverDirectory'),
  };
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw HttpError.badRequest(`Missing or invalid ${field}`);
  }
  return value;
}

function getIdParam(req: Request): string {
  const id = req.params.id;

  if (typeof id !== 'string' || !id) {
    throw HttpError.badRequest('Invalid server id');
  }

  return id;
}

export function createServersController(service: ServersService) {
  return {
    list: (_req: Request, res: Response) => {
      res.json(service.list());
    },

    create: async (req: Request, res: Response) => {
      res.json(await service.create(parseCreateBody(req.body)));
    },

    versions: async (_req: Request, res: Response) => {
      try {
        res.json(await fetchReleaseVersions());
      } catch (err) {
        console.error('Failed to fetch Minecraft versions:', err);
        throw new HttpError(500, 'Failed to fetch Minecraft versions');
      }
    },

    getOne: async (req: Request, res: Response) => {
      res.json(await service.getConnectionInfo(getIdParam(req)));
    },

    status: (req: Request, res: Response) => {
      res.json({ success: true, status: service.getStatus(getIdParam(req)) });
    },

    start: async (req: Request, res: Response) => {
      res.json(await service.start(getIdParam(req)));
    },

    stop: async (req: Request, res: Response) => {
      res.json(await service.stop(getIdParam(req)));
    },

    restart: (req: Request, res: Response) => {
      res.json(service.restart(getIdParam(req)));
    },

    remove: async (req: Request, res: Response) => {
      res.json(await service.remove(getIdParam(req)));
    },

    selectFolder: async (_req: Request, res: Response) => {
      const path = await selectfolder();

      if (!path) {
        res
          .status(404)
          .json({ error: 'Folder path could not found', path: null });
        return;
      }

      res.json({ path });
    },

    updateFolderPath: async (req: Request, res: Response) => {
      const serverId = requireString(req.body?.serverId, 'serverId');
      const path = requireString(req.body?.path, 'path');

      const server = await service.updateFolderPath(serverId, path);

      res.json({ message: 'Folder path updated successfully', server });
    },
  };
}
