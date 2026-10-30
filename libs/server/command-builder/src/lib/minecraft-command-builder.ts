import { MinecraftServerConfig } from './types';
import {
  ServerManager,
  ServerManagerOptions,
} from '@game-server/server-manager';

export function buildMinecraftCommand(
  config: MinecraftServerConfig,
): Omit<ServerManagerOptions, 'type'> {
  const xmx = `-Xmx${config.memoryMb}M`;
  const xms = `-Xms${config.memoryMb}M`;

  return {
    command: 'java',
    args: [xmx, xms, ...config.launchArgs],
    cwd: config.serverDirectory,
    name: config.name,
  };
}
