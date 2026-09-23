import { Router } from 'express';
import type { ServerRegistry } from '@game-server/server-manager';
import { asyncHandler } from './../lib/async-handler';
import { createServersController } from './servers.controller';
import { ServersService } from './server.service';
import type { OnServerCreated } from './server.types';

export function createServerRoutes(
  registry: ServerRegistry,
  onServerCreated?: OnServerCreated,
) {
  const router = Router();
  const service = new ServersService(registry, onServerCreated);
  const controller = createServersController(service);

  // Collection + static routes (must stay above the `/:id` routes)
  router.get('/', asyncHandler(controller.list));
  router.post('/', asyncHandler(controller.create));
  router.get('/versions', asyncHandler(controller.versions));
  router.post('/select-folder', asyncHandler(controller.selectFolder));
  router.post('/update-folder-path', asyncHandler(controller.updateFolderPath));

  // Single server
  router.get('/:id', asyncHandler(controller.getOne));
  router.get('/:id/status', asyncHandler(controller.status));
  router.post('/:id/start', asyncHandler(controller.start));
  router.post('/:id/stop', asyncHandler(controller.stop));
  router.post('/:id/restart', asyncHandler(controller.restart));
  router.delete('/:id/delete', asyncHandler(controller.remove));

  return router;
}
