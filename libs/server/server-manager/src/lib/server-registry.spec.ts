import { ServerRegistry } from './server-registry';

describe('ServerRegistry', () => {
  it('shuts down all managers and returns no errors', async () => {
    const registry = new ServerRegistry();

    registry.create('server-1', {
      command: 'node',
      args: [],
      cwd: process.cwd(),
      name: 'test server',
    });

    await expect(registry.shutdownAll()).resolves.toEqual([]);
  });
});
