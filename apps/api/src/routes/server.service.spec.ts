import { ServerRegistry } from '@game-server/server-manager';
import { ServersService } from './server.service';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { provisionMinecraftJar } from '@game-server/command-builder';
import { serversRepository } from './server.repository';

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
  buildMinecraftCommand: jest.fn(() => ({
    command: 'java',
    args: [],
    cwd: '',
    name: '',
  })),
  provisionMinecraftJar: jest.fn(),
  writeServerProperties: jest.fn(),
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
      expect(serversRepository.insert).toHaveBeenCalledTimes(1);
      expect(provisionMinecraftJar).toHaveBeenCalledTimes(1);
      expect(registry.list().size).toBe(1);
    } finally {
      rmSync(parentDirectory, { recursive: true, force: true });
    }
  });
});
