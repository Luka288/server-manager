import { lstatSync, readFileSync } from 'node:fs';
import { mkdir, rm, rmdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const OWNER_FILE = '.server-manager-owner.json';

export async function createOwnedServerDirectory(
  directory: string,
  serverId: string,
): Promise<void> {
  const resolved = path.resolve(directory);
  await mkdir(path.dirname(resolved), { recursive: true });
  await mkdir(resolved);

  try {
    await writeFile(
      path.join(resolved, OWNER_FILE),
      JSON.stringify({ version: 1, serverId }),
      { encoding: 'utf8', flag: 'wx' },
    );
  } catch (error) {
    await removeEmptyDirectory(resolved);
    throw error;
  }
}

export function isOwnedServerDirectory(
  directory: string,
  serverId: string,
): boolean {
  const resolved = path.resolve(directory);

  try {
    if (!lstatSync(resolved).isDirectory()) return false;

    const marker = path.join(resolved, OWNER_FILE);
    if (!lstatSync(marker).isFile()) return false;

    const ownership: unknown = JSON.parse(readFileSync(marker, 'utf8'));
    return (
      typeof ownership === 'object' &&
      ownership !== null &&
      'version' in ownership &&
      ownership.version === 1 &&
      'serverId' in ownership &&
      ownership.serverId === serverId
    );
  } catch (error) {
    if (isFileSystemError(error) && error.code === 'ENOENT') return false;
    if (error instanceof SyntaxError) return false;
    throw error;
  }
}

export async function removeOwnedServerDirectory(
  directory: string,
  serverId: string,
): Promise<boolean> {
  const resolved = path.resolve(directory);
  if (!isOwnedServerDirectory(resolved, serverId)) return false;

  const homeDirectory = path.resolve(os.homedir());
  const relativeHome = path.relative(resolved, homeDirectory);

  if (
    resolved === path.parse(resolved).root ||
    relativeHome === '' ||
    (relativeHome !== '..' &&
      !relativeHome.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relativeHome))
  ) {
    throw new Error('Refusing to delete a filesystem root or home directory');
  }

  await rm(resolved, { recursive: true, force: true, maxRetries: 3 });
  return true;
}

async function removeEmptyDirectory(directory: string): Promise<void> {
  try {
    await rmdir(directory);
  } catch (error) {
    if (!isFileSystemError(error) || error.code !== 'ENOTEMPTY') throw error;
  }
}

function isFileSystemError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}
