import type { ServerType } from '@game-server/shared/types';

export type { ServerType };

export interface CreateServerForm {
  name: string;
  memoryMb: number;
  type: ServerType;
  version: string;

  gamemode: Gamemode;
  difficulty: Difficulty;

  maxPlayers: string;
  pvp: string;
  whitelist: string;
  onlineMode: boolean;

  worldSeed?: string;
  serverDirectory: string;
}

export type Gamemode = 'survival' | 'creative' | 'adventure' | 'spectator';
export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard';
