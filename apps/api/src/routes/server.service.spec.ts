import { ServerRegistry } from '@game-server/server-manager';
import { ServersService } from './server.service';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  provisionFabricJar,
  provisionMinecraftJar,
  provisionNeoForgeServer,
  type MinecraftServerConfig,
  fetchNeoForgeVersions,
} from '@game-server/command-builder';
import { serversRepository } from './server.repository';
import { fetchReleaseVersions } from '../lib/minecraft-versions';
import { fetchFabricGameVersions } from '@game-server/command-builder';

it('cleans up when saving the server to the database fails', async () => {
  const parentDirectory = mkdtempSync(
    path.join(tmpdir(), 'server-create-test-'),
  );
  const registry = new ServerRegistry();
  const service = new ServersService(registry);

  jest
    .mocked(serversRepository.insert)
    .mockRejectedValueOnce(new Error('Database failed'));

  try {
    await expect(
      service.create({
        name: 'Test server',
        memoryMb: 2048,
        version: '1.21',
        serverDirectory: parentDirectory,
      }),
    ).rejects.toThrow('Database failed');

    expect(serversRepository.insert).toHaveBeenCalledTimes(1);
    expect(registry.list().size).toBe(0);
    expect(readdirSync(parentDirectory)).toEqual([]);
  } finally {
    rmSync(parentDirectory, { recursive: true, force: true });
  }
});

it('cleans up when downloading the server jar fails', async () => {
  const parentDirectory = mkdtempSync(
    path.join(tmpdir(), 'server-create-test-'),
  );
  const registry = new ServerRegistry();
  const service = new ServersService(registry);

  jest
    .mocked(provisionMinecraftJar)
    .mockRejectedValueOnce(new Error('Download failed'));

  try {
    await expect(
      service.create({
        name: 'Test server',
        memoryMb: 2048,
        version: '1.21',
        serverDirectory: parentDirectory,
      }),
    ).rejects.toThrow('Download failed');

    expect(serversRepository.insert).not.toHaveBeenCalled();
    expect(registry.list().size).toBe(0);
    expect(readdirSync(parentDirectory)).toEqual([]);
  } finally {
    rmSync(parentDirectory, { recursive: true, force: true });
  }
});

jest.mock('@game-server/command-builder', () => ({
  buildMinecraftCommand: jest.fn((config: MinecraftServerConfig) => ({
    command: 'java',
    args: config.launchArgs,
    cwd: config.serverDirectory,
    name: config.name,
  })),
  provisionMinecraftJar: jest.fn(),
  provisionFabricJar: jest.fn(),
  provisionNeoForgeServer: jest.fn(),
  fetchFabricGameVersions: jest.fn(),
  fetchNeoForgeVersions: jest.fn(),
  getMinecraftVersionForNeoForgeVersion: jest.fn((version: string) => {
    const [major, minor] = version.split('.').map(Number);
    if (major >= 26) return `${major}.${minor}`;
    if (major >= 20 && major <= 25) {
      return minor === 0 ? `1.${major}` : `1.${major}.${minor}`;
    }
    return null;
  }),
  writeServerProperties: jest.fn(),
}));

jest.mock('../lib/minecraft-versions', () => ({
  fetchReleaseVersions: jest.fn(),
}));

jest.mock('./server.repository', () => ({
  serversRepository: {
    insert: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(fetchReleaseVersions).mockResolvedValue(['1.21']);
  jest.mocked(fetchFabricGameVersions).mockResolvedValue(['1.21']);
  jest.mocked(fetchNeoForgeVersions).mockResolvedValue(['21.0.167']);
  jest.mocked(provisionNeoForgeServer).mockResolvedValue({
    loaderVersion: '21.0.167',
    args: [
      '@user_jvm_args.txt',
      '@libraries/net/neoforged/neoforge/21.0.167/win_args.txt',
      'nogui',
    ],
  });
});

describe('ServersService.create', () => {
  it('rejects a request without a Minecraft version', async () => {
    const registry = new ServerRegistry();
    const service = new ServersService(registry);

    // it testes if the server is getting created
    await expect(
      service.create({
        name: 'Test server',
        memoryMb: 2048,
        version: '',
        serverDirectory: 'unused-test-path',
      }),
    ).rejects.toThrow('version is required');

    expect(registry.list().size).toBe(0);
  });

  it('creates the server when setup succeeds', async () => {
    const parentDirectory = mkdtempSync(
      path.join(tmpdir(), 'server-create-test-'),
    );
    const registry = new ServerRegistry();
    const service = new ServersService(registry);

    try {
      const server = await service.create({
        name: 'Test server',
        memoryMb: 2048,
        version: '1.21',
        serverDirectory: parentDirectory,
      });

      expect(server.name).toBe('Test server');
      expect(server.status).toBe('stopped');
      expect(server.type).toBe('vanilla');
      expect(serversRepository.insert).toHaveBeenCalledTimes(1);
      expect(provisionMinecraftJar).toHaveBeenCalledTimes(1);
      expect(registry.list().size).toBe(1);
    } finally {
      rmSync(parentDirectory, { recursive: true, force: true });
    }
  });

  it('creates and provisions a Fabric server when requested', async () => {
    const parentDirectory = mkdtempSync(
      path.join(tmpdir(), 'server-create-test-'),
    );
    const registry = new ServerRegistry();
    const service = new ServersService(registry);

    try {
      const server = await service.create({
        name: 'Fabric server',
        memoryMb: 2048,
        type: 'fabric',
        version: '1.21',
        serverDirectory: parentDirectory,
      });

      expect(server.type).toBe('fabric');
      expect(provisionFabricJar).toHaveBeenCalledWith(
        '1.21',
        expect.stringContaining('fabric-server-launch.jar'),
        undefined,
      );
      expect(provisionMinecraftJar).not.toHaveBeenCalled();
      expect(serversRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'fabric',
          launch: {
            args: ['-jar', 'fabric-server-launch.jar', 'nogui'],
          },
        }),
      );
    } finally {
      rmSync(parentDirectory, { recursive: true, force: true });
    }
  });

  it('creates and provisions a NeoForge server when requested', async () => {
    const parentDirectory = mkdtempSync(
      path.join(tmpdir(), 'server-create-test-'),
    );
    const registry = new ServerRegistry();
    const service = new ServersService(registry);

    try {
      const server = await service.create({
        name: 'NeoForge server',
        memoryMb: 4096,
        type: 'neoforge',
        version: '1.21',
        serverDirectory: parentDirectory,
      });

      expect(server.type).toBe('neoforge');
      expect(provisionNeoForgeServer).toHaveBeenCalledWith(
        '1.21',
        expect.stringContaining('neoforge-server-'),
        undefined,
      );
      expect(serversRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'neoforge',
          loaderVersion: '21.0.167',
          launch: {
            args: [
              '@user_jvm_args.txt',
              '@libraries/net/neoforged/neoforge/21.0.167/win_args.txt',
              'nogui',
            ],
          },
        }),
      );
    } finally {
      rmSync(parentDirectory, { recursive: true, force: true });
    }
  });
});
