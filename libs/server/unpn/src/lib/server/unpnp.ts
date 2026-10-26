import { Client } from '@rejetto/nat-upnp';

// NOTE: Does not work because of UPNP protocol

/**
 * Opens a public port mapped to the local network host via UPnP.
 * @param port Port number to open (TCP)
 * @param ttl Time-to-live in seconds (0 = unlimited / permanent)
 */
export async function openPort(port: number, ttl = 0): Promise<void> {
  const client = new Client();

  try {
    await client.createMapping({
      public: port,
      private: port,
      protocol: 'TCP',
      ttl,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to map UPnP port ${port}: ${message}`);
  } finally {
    client.close(); // Clean up UDP sockets
  }
}

/**
 * Unmaps an open public port via UPnP.
 * @param port Public port number to unmap (TCP)
 */
export async function closePort(port: number): Promise<void> {
  const client = new Client();

  try {
    await client.removeMapping({
      public: port,
      protocol: 'TCP',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to unmap UPnP port ${port}: ${message}`);
  } finally {
    client.close(); // Clean up UDP sockets
  }
}
