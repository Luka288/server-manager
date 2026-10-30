import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import * as path from 'node:path';
import { downloadWithProgress } from './download';

const MAVEN_URL = 'https://maven.neoforged.net/releases/net/neoforged/neoforge';

// NEO FORGE VERSIONS FETCH
export async function fetchNeoForgeVersions(): Promise<string[]> {
  const response = await fetch(`${MAVEN_URL}/maven-metadata.xml`);

  if (!response.ok) {
    throw new Error(`NeoForge Maven returned ${response.status}`);
  }

  const xml = await response.text();
  const versions = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map(
    (m) => m[1],
  );

  // returning only plain versions like "21.1.5" (skips "-beta" etc.)
  return versions.filter((v) => /^\d+(\.\d+)+$/.test(v));
}

export function getMinecraftVersionForNeoForgeVersion(
  neoForgeVersion: string,
): string | null {
  const [major, minor] = neoForgeVersion.split('.').map(Number);

  if (Number.isNaN(major) || Number.isNaN(minor)) return null;

  if (major >= 26 && major < 40) return `${major}.${minor}`;
  if (major >= 20 && major <= 25)
    return minor === 0 ? `1.${major}` : `1.${major}.${minor}`;

  return null;
}

export async function provisionNeoForgeServer(
  minecraftVersion: string,
  directory: string,
  onProgress?: (message: string) => void,
): Promise<{ loaderVersion: string; args: string[] }> {
  const allVersions = await fetchNeoForgeVersions();

  // numeric: true makes "21.1.10" sort after "21.1.9"
  const latestVersion = allVersions
    .filter(
      (v) => getMinecraftVersionForNeoForgeVersion(v) === minecraftVersion,
    )
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .at(-1); // last item = newest

  if (!latestVersion) {
    throw new Error(`NeoForge does not support Minecraft ${minecraftVersion}`);
  }

  const installerFileName = `neoforge-${latestVersion}-installer.jar`;

  onProgress?.(`Downloading NeoForge ${latestVersion}...`);
  await downloadWithProgress(
    `${MAVEN_URL}/${latestVersion}/${installerFileName}`,
    path.join(directory, installerFileName),
    onProgress,
  );

  onProgress?.(`Installing NeoForge ${latestVersion}...`);
  await runInstaller(installerFileName, directory, onProgress);

  const argsFile =
    process.platform === 'win32' ? 'win_args.txt' : 'unix_args.txt';
  const argsPath = `libraries/net/neoforged/neoforge/${latestVersion}/${argsFile}`;
  await access(path.join(directory, argsPath)); // throws if the installer didn't create it

  return {
    loaderVersion: latestVersion,
    args: ['@user_jvm_args.txt', `@${argsPath}`, 'nogui'],
  };
}

// Runs: java -jar <installer> --installServer
function runInstaller(
  installerFileName: string,
  directory: string,
  onProgress?: (message: string) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const installer = spawn(
      'java',
      ['-jar', installerFileName, '--installServer'],
      {
        cwd: directory,
        windowsHide: true,
      },
    );

    let stderr = '';
    installer.stdout.on('data', (chunk) => {
      const message = chunk.toString().trim();
      if (message) onProgress?.(message);
    });
    installer.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    installer.once('error', reject); // e.g. java not installed
    installer.once('close', (code) => {
      if (code === 0) return resolve();
      reject(
        new Error(
          `NeoForge installer exited with code ${code}: ${stderr.trim()}`,
        ),
      );
    });
  });
}
