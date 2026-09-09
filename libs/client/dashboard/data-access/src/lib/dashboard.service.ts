import { inject, Service, signal } from '@angular/core';
import { CreateServerForm, Server } from '@game-server/client/types';
import { ApiService } from '@game-server/client/shared';
import { tap } from 'rxjs';
import { SocketService } from '@game-server/client/shared';

@Service()
export class DashboardService {
  private readonly ApiService = inject(ApiService);
  private readonly socketService = inject(SocketService);

  readonly serverList = signal<Server[]>([]);

  constructor() {
    this.socketService.connect();

    this.socketService.events$.pipe().subscribe((event) => {
      if (event.type !== 'server-status') {
        return;
      }

      this.serverList.update((servers) =>
        servers.map((server) =>
          server.id === event.serverId
            ? {
                ...server,
                status: event.status,
              }
            : server,
        ),
      );
    });
  }

  getServerList() {
    return this.ApiService.get<Server[]>('').pipe(
      tap((servers) => {
        this.serverList.set(servers);
      }),
    );
  }

  create(payload: CreateServerForm) {
    return this.ApiService.post<Server>('/', payload).pipe(
      tap((res) => {
        this.serverList.update((servers) => [...servers, res]);
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

  delete(id: string) {
    return this.ApiService.delete<{ id: string; deleted: boolean }>(
      `${id}/delete`,
    ).pipe(
      tap((res) => {
        this.serverList.update((servers) =>
          servers.filter((server) => server.id !== res.id),
        );
      }),
    );
  }
}
