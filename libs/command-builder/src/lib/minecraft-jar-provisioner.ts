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

export async function provisionMinecraftJar(
  version: string,
  destinationPath: string,
): Promise<void> {
  const jarUrl = await getServerJarUrl(version);

  const jarResponse = await fetch(jarUrl);
  const jarBuffer = await jarResponse.arrayBuffer();

  mkdirSync(path.dirname(destinationPath), { recursive: true });
  writeFileSync(destinationPath, Buffer.from(jarBuffer));
}
