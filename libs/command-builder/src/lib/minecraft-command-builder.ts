import { MinecraftServerConfig } from './types';
import { ServerManagerOptions } from '@game-server/server-manager';

export function buildMinecraftCommand(
  config: MinecraftServerConfig,
): ServerManagerOptions {
  const xmx = `-Xmx${config.memoryMb}M`;
  const xms = `-Xms${config.memoryMb}M`;

  return {
    command: 'java', // for minecraft it will be java every time
    args: [xmx, xms, '-jar', config.jarFile, 'nogui'],
    cwd: config.serverDirectory,
  };
}
