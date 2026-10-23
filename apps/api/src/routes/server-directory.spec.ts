import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createOwnedServerDirectory,
  isOwnedServerDirectory,
  removeOwnedServerDirectory,
} from './server-directory';

describe('server directory ownership', () => {
  let tempDirectory: string;

  beforeEach(() => {
    tempDirectory = mkdtempSync(path.join(tmpdir(), 'server-manager-test-'));
  });

  afterEach(() => {
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  it('does not treat a folder containing server.properties as app-owned', async () => {
    const directory = path.join(tempDirectory, 'unmanaged');
    await mkdir(directory);
    writeFileSync(path.join(directory, 'server.properties'), 'server-port=25565');

    await expect(
      removeOwnedServerDirectory(directory, 'server-id'),
    ).resolves.toBe(false);
    expect(existsSync(directory)).toBe(true);
  });

  it('requires the ownership marker to match the server id', async () => {
    const directory = path.join(tempDirectory, 'owned');
    await createOwnedServerDirectory(directory, 'owner-id');

    expect(isOwnedServerDirectory(directory, 'other-id')).toBe(false);
    await expect(
      removeOwnedServerDirectory(directory, 'other-id'),
    ).resolves.toBe(false);
    expect(existsSync(directory)).toBe(true);
  });

  it('deletes the matching managed directory without touching siblings', async () => {
    const directory = path.join(tempDirectory, 'owned');
    const sibling = path.join(tempDirectory, 'keep-me');
    await createOwnedServerDirectory(directory, 'server-id');
    await writeFile(path.join(directory, 'world.dat'), 'world');
    writeFileSync(sibling, 'unrelated');

    await expect(
      removeOwnedServerDirectory(directory, 'server-id'),
    ).resolves.toBe(true);

    expect(existsSync(directory)).toBe(false);
    expect(existsSync(sibling)).toBe(true);
  });
});
