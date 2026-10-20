import { inject, Service, signal } from '@angular/core';
import {
  ConnectionInfo,
  CreateServerForm,
  Server,
} from '@game-server/client/types';
import { ApiService, FolderService } from '@game-server/client/shared';

@Service()
export class DashboardService {
  private readonly ApiService = inject(ApiService);
  private readonly folderService = inject(FolderService);

  readonly serverList = signal<Server[]>([]);
  readonly connectionInfo = signal<ConnectionInfo | null>(null);

  getServerList() {
    return this.ApiService.get<Server[]>('');
  }

  create(payload: CreateServerForm) {
    return this.ApiService.post<Server>('/', payload);
  }

  start(id: string) {
    return this.ApiService.post<Server>(`${id}/start`, {});
  }

  stop(id: string) {
    return this.ApiService.post<Server>(`${id}/stop`, {});
  }

  restart(serverId: string) {
    return this.ApiService.post<Server>(`${serverId}/restart`, {});
  }

  delete(id: string) {
    return this.ApiService.delete<{ id: string; deleted: boolean }>(
      `${id}/delete`,
      {},
    );
  }

  updatePath(serverId: string) {
    return this.folderService.selectAndUpdateFolderPath(serverId);
  }

  getConnectionInfo(serverId: string) {
    return this.ApiService.get<ConnectionInfo>(`${serverId}`);
  }
}
