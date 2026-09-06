export interface CreateServerForm {
  name: string;
  memoryMb: number;
  version: string;

  gamemode: Gamemode;
  difficulty: Difficulty;

  maxPlayers: number;
  pvp: boolean;
  whitelist: boolean;
  onlineMode: boolean;

  worldSeed?: string;
}

export type Gamemode = 'survival' | 'creative' | 'adventure' | 'spectator';
export type Difficulty = 'peaceful' | 'easy' | 'normal' | 'hard';
