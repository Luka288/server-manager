import { getMinecraftVersionForNeoForgeVersion } from './neoforge-server.provision';

describe('getMinecraftVersionForNeoForgeVersion', () => {
  it.each([
    ['20.4.237', '1.20.4'],
    ['21.0.167', '1.21'],
    ['21.1.234', '1.21.1'],
    ['26.1.0.0', '26.1'],
  ])('maps NeoForge %s to Minecraft %s', (neoForgeVersion, expected) => {
    expect(getMinecraftVersionForNeoForgeVersion(neoForgeVersion)).toBe(
      expected,
    );
  });

  it('ignores versions outside supported NeoForge release formats', () => {
    expect(getMinecraftVersionForNeoForgeVersion('47.1.106')).toBeNull();
    expect(getMinecraftVersionForNeoForgeVersion('not-a-version')).toBeNull();
  });
});
