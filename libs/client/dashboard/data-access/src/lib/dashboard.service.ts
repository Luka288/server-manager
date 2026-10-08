import { inject, Service, signal } from '@angular/core';
import {
  ConnectionInfo,
  CreateServerForm,
  Server,
} from '@game-server/client/types';
import {
  ApiService,
  FolderService,
  StateService,
} from '@game-server/client/shared';
import { finalize, map, of, switchMap, tap } from 'rxjs';
import { SocketService } from '@game-server/client/shared';

@Service()
export class DashboardService {
  private readonly ApiService = inject(ApiService);
  private readonly socketService = inject(SocketService);
  private readonly stateService = inject(StateService);
  private readonly folderService = inject(FolderService);

  readonly serverList = signal<Server[]>([]);
  readonly connectionInfo = signal<ConnectionInfo | null>(null);

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
      tap((server) => {
        this.serverList.update((servers) =>
          servers.map((item) =>
            item.id === server.id ? { ...item, status: server.status } : item,
          ),
        );
      }),
      switchMap((server) => {
        // if (server.status !== 'running') {
        //   return of(server);
        // }

        return this.getConnectionInfo(server.id).pipe(map(() => server));
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

        this.connectionInfo.set(null);
      }),
    );
  }

  restart(serverId: string) {
    return this.ApiService.post<Server>(`${serverId}/restart`, {}).pipe(
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

  updatePath(serverId: string) {
    return this.folderService.selectAndUpdateFolderPath(serverId).pipe(
      tap((updated) => {
        this.serverList.update((servers) =>
          servers.map((server) =>
            server.id === serverId
              ? { ...server, serverDirectory: updated.serverDirectory }
              : server,
          ),
        );
      }),
    );
  }

  getConnectionInfo(serverId: string) {
    return this.ApiService.get<ConnectionInfo>(`${serverId}`).pipe(
      tap((info) => {
        this.connectionInfo.set(info);
      }),
    );
  }
}
