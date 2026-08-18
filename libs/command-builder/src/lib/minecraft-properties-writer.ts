import { writeFileSync, mkdirSync } from 'node:fs';
import { MinecraftServerProperties } from './types';

export function writeServerProperties(
  serverDirectory: string,
  properties: MinecraftServerProperties,
): void {
  mkdirSync(serverDirectory, { recursive: true });

  const lines = [
    `gamemode=${properties.gamemode ?? 'survival'}`,
    `difficulty=${properties.difficulty ?? 'easy'}`,
    `max-players=${properties.maxPlayers ?? 20}`,
    `pvp=${properties.pvp ?? true}`,
    `white-list=${properties.whitelist ?? false}`,
    `online-mode=${properties.onlineMode ?? true}`,
    `server-port=${properties.serverPort ?? 25565}`,
    `level-seed=${properties.worldSeed ?? ''}`,
    `server-ip=`,
  ];

  const content = lines.join('\n');

  writeFileSync(`${serverDirectory}/server.properties`, content);
}
