export interface MinecraftServerConfig {
  memoryMb: number; // this will -Xmx as well as the -Xms
  jarFile: string;
  serverDirectory: string;
}
