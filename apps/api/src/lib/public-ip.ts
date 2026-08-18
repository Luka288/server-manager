import { existsSync, readFileSync } from 'node:fs';

export async function getPublicIp(): Promise<string> {
  try {
    const result = await fetch('https://api.ipify.org?format=json').then(
      (res) => res.json(),
    );

    return result.ip;
  } catch (error) {
    throw new Error(`Failed to fetch public IP: ${(error as Error).message}`);
  }
}

// method to get server ip address from server files
export function getServerPort(serverDirectory: string): number {
  const propertiesPath = `${serverDirectory}/server.properties`;

  if (!existsSync(propertiesPath)) {
    return 25565;
  }

  const contents = readFileSync(propertiesPath, 'utf-8');
  const lines = contents.split('\n');
  const portLine = lines.find((line) => line.startsWith('server-port='));
  const portValue = portLine?.split('=')[1];

  return portValue ? Number(portValue) : 25565;
}
