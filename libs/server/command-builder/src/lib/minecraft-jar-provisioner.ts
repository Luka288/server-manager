import { writeFileSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';

interface MojangVersionManifest {
  versions: { id: string; url: string }[];
}

interface MojangVersionDetail {
  downloads: {
    server: {
      url: string;
    };
  };
}

export async function getServerJarUrl(version: string) {
  // url should be stored as consntant
  const manifestResponse = await fetch(
    'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json',
  );
  const manifest: MojangVersionManifest = await manifestResponse.json();

  const versionEntry = manifest.versions.find((v) => v.id === version);

  if (!versionEntry) {
    throw new Error(`Minecraft version "${version}" not found`);
  }

  const detailResponse = await fetch(versionEntry.url);
  const detail: MojangVersionDetail = await detailResponse.json();

  return detail.downloads.server.url;
}

// command-builder: provision with progress
export async function provisionMinecraftJar(
  version: string,
  destinationPath: string,
  onProgress?: (msg: string) => void,
): Promise<void> {
  onProgress?.(`Resolving Minecraft ${version}...`);
  const jarUrl = await getServerJarUrl(version);

  const res = await fetch(jarUrl);
  if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`);

  const total = Number(res.headers.get('content-length')) || 0;
  const chunks: Buffer[] = [];
  let received = 0;
  let lastStep = -1;

  for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
    received += chunk.length;
    if (total) {
      const step = Math.floor((received / total) * 10);
      if (step > lastStep) {
        lastStep = step;
        onProgress?.(`Downloading server jar... ${step * 10}%`);
      }
    }
  }

  mkdirSync(path.dirname(destinationPath), { recursive: true });
  writeFileSync(destinationPath, Buffer.concat(chunks));
}
