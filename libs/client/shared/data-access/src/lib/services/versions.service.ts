import { inject, Service, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, of, tap } from 'rxjs';
import type { ServerType } from '@game-server/client/types';

@Service()
export class VersionsService {
  private readonly apiService = inject(ApiService);

  readonly gameVersions = signal<Partial<Record<ServerType, string[]>>>({});

  getServerVersions(type: ServerType = 'vanilla'): Observable<string[]> {
    const cachedVersions = this.gameVersions()[type];
    if (cachedVersions !== undefined) {
      return of(cachedVersions);
    }

    return this.apiService
      .get<string[]>(`versions?type=${encodeURIComponent(type)}`)
      .pipe(
        tap((response: string[]) => {
          this.gameVersions.update((versions) => ({
            ...versions,
            [type]: response,
          }));
        }),
      );
  }
}
