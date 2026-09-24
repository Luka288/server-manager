import type { ServerRegistry } from '@game-server/server-manager';
import type { writeServerProperties } from '@game-server/command-builder';

export type ServerManager = ReturnType<ServerRegistry['create']>;

export type OnServerCreated = (
  serverId: string,
  manager: ServerManager,
) => void;

/** Derived from the command-builder so the two never drift apart. */
export type ServerPropertiesInput = Parameters<typeof writeServerProperties>[1];

export type CreateServerInput = {
  name: string;
  memoryMb: number;
  jarFile?: string;
  version?: string;
  serverDirectory?: string;
} & ServerPropertiesInput;
