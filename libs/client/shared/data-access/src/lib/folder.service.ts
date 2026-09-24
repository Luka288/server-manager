import { inject, Service } from '@angular/core';
import { ApiService } from './api.service';
import { Server } from '@game-server/client/types';
import { tap, map, filter, switchMap, Observable } from 'rxjs';

@Service()
export class FolderService {
  private readonly ApiService = inject(ApiService);

  selectPath() {
    return this.ApiService.post<{ path: string }>('select-folder', {});
  }

  updateFolderPath(
    path: string,
    serverId: string,
  ): Observable<{ message: string; server: Server }> {
    return this.ApiService.post<{ message: string; server: Server }>(
      'update-folder-path',
      {
        path,
        serverId,
      },
    );
  }

  selectAndUpdateFolderPath(serverId: string): Observable<Server> {
    return this.selectPath().pipe(
      map(({ path }) => path),
      filter((path): path is string => !!path),
      switchMap((path) => this.updateFolderPath(path, serverId)),
      map(({ server }) => server),
    );
  }
}
