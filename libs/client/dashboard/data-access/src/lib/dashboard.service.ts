import { inject, Service, signal } from '@angular/core';
import { CreateServerForm, Server } from '@game-server/client/types';
import { ApiService, StateService } from '@game-server/client/shared';
import { filter, finalize, map, switchMap, tap } from 'rxjs';
import { SocketService } from '@game-server/client/shared';

@Service()
export class DashboardService {
  private readonly ApiService = inject(ApiService);
  private readonly socketService = inject(SocketService);
  private readonly stateService = inject(StateService);

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

  /* 
    TODO: must add state to track when the server is creating
  */
  create(payload: CreateServerForm) {
    this.stateService.serverCreationState.set(true);

    return this.ApiService.post<Server>('/', payload).pipe(
      finalize(() => {
        this.stateService.serverCreationState.set(false);
      }),

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

  selectPath() {
    return this.ApiService.post<{ path: string }>('select-folder', {});
  }

  updateFolderPath(path: string, serverId: string) {
    return this.ApiService.post<{ message: string; server: Server }>(
      'update-folder-path',
      {
        path,
        serverId,
      },
    ).pipe(
      tap((res) => {
        this.serverList.update((servers) =>
          servers.map((server) =>
            server.id === serverId
              ? { ...server, serverDirectory: res.server.serverDirectory }
              : server,
          ),
        );
      }),
    );
  }

  selectAndUpdateFolderPath(serverId: string) {
    return this.selectPath().pipe(
      map(({ path }) => path),
      filter((path): path is string => !!path),
      switchMap((path) =>
        this.updateFolderPath(path, serverId).pipe(map(() => path)),
      ),
    );
  }
}
