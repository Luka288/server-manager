export interface MinecraftServerConfig {
  memoryMb: number; // this will -Xmx as well as the -Xms
  serverDirectory: string;
  name: string;
  launchArgs: string[];
}

export interface MinecraftServerProperties {
  gamemode?: 'survival' | 'creative' | 'adventure' | 'spectator';
  difficulty?: 'peaceful' | 'easy' | 'normal' | 'hard';
  maxPlayers?: number;
  pvp?: boolean;
  whitelist?: boolean;
  onlineMode?: boolean;
  serverPort?: number;
  worldSeed?: string;
}
