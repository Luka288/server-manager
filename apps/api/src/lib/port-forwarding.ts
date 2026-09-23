import { openPort, closePort } from '@game-server/server/unpnp';
import type { getServerPort } from './public-ip';

type Port = ReturnType<typeof getServerPort>;

export async function tryOpenPort(serverId: string, port: Port): Promise<void> {
  try {
    await openPort(port);
    console.log(`[${serverId}] UPnP: opened port ${port}`);
  } catch (err) {
    console.error(`[${serverId}] UPnP open failed: ${(err as Error).message}`);
  }
}

export async function tryClosePort(
  serverId: string,
  port: Port,
): Promise<void> {
  try {
    await closePort(port);
    console.log(`[${serverId}] UPnP: closed port ${port}`);
  } catch (err) {
    console.error(`[${serverId}] UPnP close failed: ${(err as Error).message}`);
  }
}
