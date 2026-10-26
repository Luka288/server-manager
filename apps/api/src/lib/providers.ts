import { fetchReleaseVersions } from './minecraft-versions';
import {
  provisionMinecraftJar,
  fetchFabricGameVersions,
  provisionFabricJar,
} from '@game-server/command-builder';
import type { ServerType } from '@game-server/shared/types';

export type { ServerType };

export interface ServerProvider {
  jarFileName: string;
  listVersions(): Promise<string[]>;
  provision(
    version: string,
    destination: string,
    onProgress?: (msg: string) => void,
  ): Promise<void>;
}

export const providers: Record<ServerType, ServerProvider> = {
  vanilla: {
    jarFileName: 'server.jar',
    listVersions: fetchReleaseVersions,
    provision: provisionMinecraftJar,
  },
  fabric: {
    jarFileName: 'fabric-server-launch.jar',
    listVersions: async () => {
      const [mojang, fabric] = await Promise.all([
        fetchReleaseVersions(),
        fetchFabricGameVersions(true),
      ]);
      const supported = new Set(fabric);
      return mojang.filter((id) => supported.has(id));
    },
    provision: provisionFabricJar,
  },
};

export function isServerType(value: string): value is ServerType {
  return Object.prototype.hasOwnProperty.call(providers, value);
}

export function getServerTypeForJar(jarFile: string): ServerType {
  if (jarFile === providers.fabric.jarFileName) return 'fabric';
  if (jarFile === providers.vanilla.jarFileName) return 'vanilla';

  throw new Error(`No server provider is registered for jar "${jarFile}"`);
}
