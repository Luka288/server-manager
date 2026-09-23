const VERSION_MANIFEST_URL =
  'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

interface VersionManifest {
  versions: { id: string; type: string }[];
}

/** Returns every official release version id, in Mojang's order (newest first). */
export async function fetchReleaseVersions(): Promise<string[]> {
  const response = await fetch(VERSION_MANIFEST_URL);

  if (!response.ok) {
    throw new Error(`Mojang API returned ${response.status}`);
  }

  const manifest = (await response.json()) as VersionManifest;

  return manifest.versions
    .filter((version) => version.type === 'release')
    .map((version) => version.id);
}
