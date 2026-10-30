import { fetchReleaseVersions } from './minecraft-versions';
import * as path from 'node:path';
import {
  provisionMinecraftJar,
  fetchFabricGameVersions,
  provisionFabricJar,
  fetchNeoForgeVersions,
  getMinecraftVersionForNeoForgeVersion,
  provisionNeoForgeServer,
} from '@game-server/command-builder';
import type { ServerType, LaunchSpec } from '@game-server/shared/types';

export type { ServerType };

export interface ProvisionContext {
  version: string;
  directory: string;
  onProgress?: (msg: string) => void;
}

export interface ProvisionResult {
  launch: LaunchSpec;
  loaderVersion?: string;
}

export interface ServerProvider {
  label: string;
  supportsMods: boolean;
  modsFolder?: 'mods' | 'plugins';
  listVersions(): Promise<string[]>;
  provision(ctx: ProvisionContext): Promise<ProvisionResult>;
}

async function intersectWithMojang(loaderVersions: Promise<string[]>) {
  const [mojang, loader] = await Promise.all([
    fetchReleaseVersions(),
    loaderVersions,
  ]);
  const supported = new Set(loader);
  return mojang.filter((id) => supported.has(id));
}

export const providers: Record<ServerType, ServerProvider> = {
  vanilla: {
    label: 'Vanilla',
    supportsMods: false,
    listVersions: fetchReleaseVersions,
    async provision({ version, directory, onProgress }) {
      await provisionMinecraftJar(
        version,
        path.join(directory, 'server.jar'),
        onProgress,
      );
      return { launch: { args: ['-jar', 'server.jar', 'nogui'] } };
    },
  },

  fabric: {
    label: 'Fabric',
    supportsMods: true,
    modsFolder: 'mods',
    listVersions: () => intersectWithMojang(fetchFabricGameVersions(true)),
    async provision({ version, directory, onProgress }) {
      await provisionFabricJar(
        version,
        path.join(directory, 'fabric-server-launch.jar'),
        onProgress,
      );
      return {
        launch: { args: ['-jar', 'fabric-server-launch.jar', 'nogui'] },
      };
    },
  },

  neoforge: {
    label: 'NeoForge',
    supportsMods: true,
    modsFolder: 'mods',
    async listVersions() {
      const [minecraftVersions, neoForgeVersions] = await Promise.all([
        fetchReleaseVersions(),
        fetchNeoForgeVersions(),
      ]);
      const supportedVersions = new Set(
        neoForgeVersions
          .map(getMinecraftVersionForNeoForgeVersion)
          .filter((version): version is string => version !== null),
      );

      return minecraftVersions.filter((version) =>
        supportedVersions.has(version),
      );
    },
    async provision({ version, directory, onProgress }) {
      const { loaderVersion, args } = await provisionNeoForgeServer(
        version,
        directory,
        onProgress,
      );
      return { loaderVersion, launch: { args } };
    },
  },
};

export function isServerType(value: string): value is ServerType {
  return Object.prototype.hasOwnProperty.call(providers, value);
}
