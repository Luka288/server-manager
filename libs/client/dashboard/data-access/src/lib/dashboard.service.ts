import { inject, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Server } from '@game-server/types';
import { ApiService } from '@game-server/client/shared';
import { tap } from 'rxjs';

@Service()
export class DashboardService {
  private readonly ApiService = inject(ApiService);

  readonly serverList = signal<Server[]>([]);

  getServerList() {
    return this.ApiService.get<Server[]>('/').pipe(
      tap((servers) => {
        this.serverList.set(servers);
      }),
    );
  }

  start(id: string) {
    return this.ApiService.post<Server>(`${id}/start`, {}).pipe(
      tap((res) => {
        this.serverList.update((servers) =>
          servers.map((server) =>
            server.id === res.id ? { ...server, status: res.status } : server,
          ),
        );
      }),
    );
  }

  stop(id: string) {
    return this.ApiService.post<Server>(`${id}/stop`, {}).pipe(
      tap((res) => {
        this.serverList.update((servers) =>
          servers.map((server) =>
            server.id === res.id ? { ...server, status: res.status } : server,
          ),
        );
      }),
    );
  }
}
