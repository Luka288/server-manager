import type { Request, Response } from 'express';
import type { ServersService } from './server.service';
import { createServersController } from './servers.controller';
describe('servers controller create', () => {
  it('rejects decimal memory and does not call the service', async () => {
    const service = {
      create: jest.fn(),
    } as unknown as ServersService;

    const controller = createServersController(service);

    const req = {
      body: {
        name: 'Test server',
        memoryMb: 2048.5,
        version: '1.21',
        serverDirectory: 'unused-test-path',
      },
    } as Request;

    const res = {
      json: jest.fn(),
    } as unknown as Response;

    await expect(controller.create(req, res)).rejects.toMatchObject({
      status: 400,
    });

    expect(service.create).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('accepts integer memory and calls the service', async () => {
    const service = {
      create: jest.fn().mockResolvedValue({ id: 'server-id' }),
    } as unknown as ServersService;

    const controller = createServersController(service);
    const req = {
      body: {
        name: 'Test server',
        memoryMb: 2048,
        version: '1.21',
        serverDirectory: 'unused-test-path',
      },
    } as Request;
    const res = {
      json: jest.fn(),
    } as unknown as Response;

    await controller.create(req, res);

    expect(service.create).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ id: 'server-id' });
  });
});
