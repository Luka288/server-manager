import { serverUnpnp } from './server/unpnp';

describe('serverUnpnp', () => {
  it('should work', () => {
    expect(serverUnpnp()).toEqual('server/unpnp');
  });
});
