import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import type { ServerRegistry } from '@game-server/server-manager';
import {
  buildMinecraftCommand,
  provisionMinecraftJar,
  writeServerProperties,
} from '@game-server/command-builder';
import { getPublicIp, getServerPort } from './../lib/public-ip';
import { tryClosePort, tryOpenPort } from './../lib/port-forwarding';
import { HttpError } from './../lib/http-error';
import { serversRepository } from './server.repository';
import { getLocalIp } from './../lib/local-ip';
import {
  createOwnedServerDirectory,
  removeOwnedServerDirectory,
} from './server-directory';

import type {
  CreateServerInput,
  OnServerCreated,
  ServerManager,
} from './server.types';
import path from 'node:path';

const DEFAULT_JAR_FILE = 'server.jar';

const CONNECT_NOTE =
  'Share this address with friends. If they cannot connect, you may need to enable port forwarding for this port on your router.';

export class ServersService {
  constructor(
    private readonly registry: ServerRegistry,
    private readonly onServerCreated?: OnServerCreated,
  ) {}

  list() {
    return Array.from(this.registry.list().entries()).map(([id, manager]) =>
      toSummary(id, manager),
    );
  }

  getStatus(id: string) {
    return this.getManager(id).getStatus();
  }

  async getConnectionInfo(id: string) {
    const manager = this.getManager(id);
    const row = await this.getRow(id);

    const ip = await getPublicIp();
    const port = getServerPort(row.serverDirectory);
    const localIp = getLocalIp();

    return {
      id,
      name: manager.getName(),
      status: manager.getStatus(),
      ip,
      localIp,
      port,
      connectAddress: `${ip}:${port}`,
      localAddress: localIp ? `${localIp}:${port}` : null,
      note: CONNECT_NOTE,
    };
  }

  async create(input: CreateServerInput) {
    const {
      name,
      memoryMb,
      version,
      serverDirectory,
      jarFile = DEFAULT_JAR_FILE,
      ...properties
    } = input;

    if (typeof version !== 'string' || !version.trim()) {
      throw HttpError.badRequest('version is required');
    }

    const id = randomUUID();
    // changed folder naming from UUID to actual servers name with servers UUID first letters
    const directory = path.join(serverDirectory, toFolderName(name, id));

    const command = buildMinecraftCommand({
      memoryMb,
      jarFile,
      serverDirectory: directory,
      name,
    });

    let directoryCreated = false;
    let databaseInserted = false;
    let registryCreated = false;

    try {
      await createOwnedServerDirectory(directory, id);

      directoryCreated = true;

      writeServerProperties(directory, properties);
      await this.provisionJar(version, path.join(directory, jarFile));

      await serversRepository.insert({
        id,
        name,
        memoryMb,
        jarFile,
        serverDirectory: directory,
        version,
        status: 'stopped',
      });
      databaseInserted = true;

      const server = this.registry.create(id, { ...command, name });
      registryCreated = true;

      this.onServerCreated?.(id, server);
      attachProcessLogging(id, server);

      return toSummary(id, server);
    } catch (error) {
      if (registryCreated) {
        try {
          this.registry.delete(id);
        } catch (cleanupError) {
          console.error(`[${id}] registry cleanup failed:`, cleanupError);
        }
      }

      if (databaseInserted) {
        await serversRepository.delete(id).catch((cleanupError) => {
          console.error(`[${id}] database cleanup failed:`, cleanupError);
        });
      }

      if (directoryCreated) {
        await removeOwnedServerDirectory(directory, id)
          .then((removed) => {
            if (!removed) {
              console.error(
                `[${id}] could not verify ownership during cleanup`,
              );
            }
          })
          .catch((cleanupError) => {
            console.error(`[${id}] folder cleanup failed:`, cleanupError);
          });
      }

      throw error;
    }
  }

  async start(id: string) {
    const manager = this.getManager(id);
    const row = await this.getRow(id);

    if (row.initialized && !existsSync(row.serverDirectory)) {
      manager.markStatus('crashed');
      await serversRepository.update(id, { status: 'crashed' });

      throw HttpError.conflict(
        'Server folder is missing. It may have been moved or deleted.',
        'FOLDER_MISSING',
      );
    }

    asConflict(() => manager.start());

    await tryOpenPort(id, getServerPort(row.serverDirectory));

    if (!row.initialized) {
      await serversRepository.update(id, { initialized: true });
    }

    return { id, status: manager.getStatus() };
  }

  async stop(id: string) {
    const manager = this.getManager(id);
    const row = await this.getRow(id);

    asConflict(() => manager.stop());

    await tryClosePort(id, getServerPort(row.serverDirectory));

    return { id, status: manager.getStatus() };
  }

  restart(id: string) {
    const manager = this.getManager(id);

    asConflict(() => manager.restart());

    return { id, status: manager.getStatus() };
  }

  async remove(id: string) {
    const manager = this.getManager(id);
    const status = manager.getStatus();

    if (status !== 'stopped' && status !== 'crashed') {
      throw new HttpError(403, 'Cannot remove a server that is not stopped');
    }

    const server = await this.getRow(id);

    const filesDeleted = await removeOwnedServerDirectory(
      server.serverDirectory,
      id,
    );

    this.registry.delete(id);
    await serversRepository.delete(id);

    return { id, deleted: true, filesDeleted };
  }

  async updateFolderPath(id: string, path: string) {
    const manager = this.getManager(id);

    asConflict(() => manager.updateDirectory(path));

    const [updated] = await serversRepository.update(id, {
      serverDirectory: path,
    });

    if (!updated) throw HttpError.notFound();

    return updated;
  }

  private getManager(id: string): ServerManager {
    try {
      return this.registry.get(id);
    } catch {
      throw HttpError.notFound();
    }
  }

  private async getRow(id: string) {
    const row = await serversRepository.findById(id);
    if (!row) throw HttpError.notFound();
    return row;
  }

  private async provisionJar(
    version: string,
    targetPath: string,
  ): Promise<void> {
    await provisionMinecraftJar(version, targetPath);
  }
}

function toSummary(id: string, manager: ServerManager) {
  return {
    id,
    name: manager.getName(),
    status: manager.getStatus(),
    serverDirectory: manager.getDirectory(),
  };
}

function attachProcessLogging(id: string, server: ServerManager) {
  server.on('stdout', (chunk) => console.log(`[${id}] [stdout]: ${chunk}`));
  server.on('stderr', (chunk) => console.error(`[${id}] [stderr]: ${chunk}`));
  server.on('exit', (code) =>
    console.log(`[${id}] [exit]: process exited with code ${code}`),
  );
}

function asConflict<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    throw HttpError.conflict((err as Error).message);
  }
}

function toFolderName(name: string, id: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${slug || 'server'}-${id.slice(0, 8)}`;
}
