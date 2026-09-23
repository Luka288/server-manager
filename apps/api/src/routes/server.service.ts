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
import type {
  CreateServerInput,
  OnServerCreated,
  ServerManager,
} from './server.types';

const SERVERS_ROOT = './servers';
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

    return {
      id,
      name: manager.getName(),
      status: manager.getStatus(),
      ip,
      port,
      connectAddress: `${ip}:${port}`,
      note: CONNECT_NOTE,
    };
  }

  async create(input: CreateServerInput) {
    const {
      name,
      memoryMb,
      version,
      jarFile = DEFAULT_JAR_FILE,
      ...properties
    } = input;

    const id = randomUUID();
    const serverDirectory = `${SERVERS_ROOT}/${id}`;

    const command = buildMinecraftCommand({
      memoryMb,
      jarFile,
      serverDirectory,
      name,
    });

    writeServerProperties(serverDirectory, properties);

    const server = this.registry.create(id, { ...command, name });

    this.onServerCreated?.(id, server);
    attachProcessLogging(id, server);

    if (version) {
      await this.provisionJar(
        id,
        server,
        version,
        `${serverDirectory}/${jarFile}`,
      );
    }

    await serversRepository.insert({
      id,
      name,
      memoryMb,
      jarFile,
      serverDirectory,
      version: version ?? null,
      status: server.getStatus(),
    });

    return toSummary(id, server);
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

    if (manager.getStatus() === 'running') {
      throw new HttpError(403, 'Cannot remove running server');
    }

    this.registry.delete(id);
    await serversRepository.delete(id);

    return { id, deleted: true };
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

  // ---------------------------------------------------------------- helpers

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
    id: string,
    server: ServerManager,
    version: string,
    targetPath: string,
  ) {
    try {
      await provisionMinecraftJar(version, targetPath);
      server.markStatus('stopped');
      console.log(`[${id}] jar provisioned successfully`);
    } catch (err) {
      server.markStatus('crashed');
      console.error(`[${id}] provisioning failed: ${(err as Error).message}`);
    }
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

/** Errors thrown by the process manager (already running, etc.) are conflicts. */
function asConflict<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    throw HttpError.conflict((err as Error).message);
  }
}
