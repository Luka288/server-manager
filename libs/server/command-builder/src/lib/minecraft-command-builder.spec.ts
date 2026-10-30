import { buildMinecraftCommand } from './minecraft-command-builder';
import { MinecraftServerConfig } from './types';

describe('buildMinecraftCommand', () => {
  it('builds the correct java command from a Minecraft config', () => {
    const config: MinecraftServerConfig = {
      name: 'Server name',
      memoryMb: 4096,
      launchArgs: ['-jar', 'server.jar', 'nogui'],
      serverDirectory: 'c/desktop/',
    };

    const result = buildMinecraftCommand(config);

    expect(result).toEqual({
      command: 'java',
      args: ['-Xmx4096M', '-Xms4096M', '-jar', 'server.jar', 'nogui'],
      cwd: 'c/desktop/',
      name: 'Server name',
    });
  });
});
