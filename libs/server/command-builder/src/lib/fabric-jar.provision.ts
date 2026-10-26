import { createWriteStream, mkdirSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { downloadWithProgress } from './download';
import * as path from 'node:path';

const FABRIC_META_URL = 'https://meta.fabricmc.net/v2/versions';

interface FabricVersionEntry {
  version: string;
  stable: boolean;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) throw new Error(`Request to ${url} failed (${res.status})`);

  return (await res.json()) as T;
}

export async function fetchFabricGameVersions(
  stableOnly = true,
): Promise<string[]> {
  const versions = await fetchJson<FabricVersionEntry[]>(
    `${FABRIC_META_URL}/game`,
  );
  return versions.filter((v) => !stableOnly || v.stable).map((v) => v.version);
}

async function latestStable(kind: 'loader' | 'installer'): Promise<string> {
  const versions = await fetchJson<FabricVersionEntry[]>(
    `${FABRIC_META_URL}/${kind}`,
  );

  const found = versions.find((v) => v.stable);

  if (!found) throw new Error(`No stable Fabric ${kind} version found`);
  return found.version;
}

export async function getFabricServerJarUrl(
  mcVersion: string,
  loaderVersion?: string,
  installerVersion?: string,
): Promise<string> {
  const [loader, installer] = await Promise.all([
    loaderVersion ?? latestStable('loader'),
    installerVersion ?? latestStable('installer'),
  ]);
  return `${FABRIC_META_URL}/loader/${mcVersion}/${loader}/${installer}/server/jar`;
}

// export async function downloadWithProgress(
//   url: string,
//   destinationPath: string,
//   onProgress?: (msg: string) => void,
// ): Promise<void> {
//   const res = await fetch(url);

//   if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`);

//   const total = Number(res.headers.get('content-length')) || 0;
//   let received = 0;
//   let lastStep = -1;

//   const source = Readable.fromWeb(res.body as any);
//   source.on('data', (chunk: Buffer) => {
//     received += chunk.length;
//     if (!total) return;
//     const step = Math.floor((received / total) * 10);
//     if (step > lastStep) {
//       lastStep = step;
//       onProgress?.(`Downloading server jar... ${step * 10}%`);
//     }
//   });

//   mkdirSync(path.dirname(destinationPath), { recursive: true });
//   await pipeline(source, createWriteStream(destinationPath));
// }

export async function provisionFabricJar(
  mcVersion: string,
  destinationPath: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  onProgress?.(`Resolving Fabric for Minecraft ${mcVersion}...`);
  const url = await getFabricServerJarUrl(mcVersion);
  await downloadWithProgress(url, destinationPath, onProgress);
}
