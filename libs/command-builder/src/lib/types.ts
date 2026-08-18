export interface MinecraftServerConfig {
  memoryMb: number; // this will -Xmx as well as the -Xms
  jarFile: string;
  serverDirectory: string;
  name: string;
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
