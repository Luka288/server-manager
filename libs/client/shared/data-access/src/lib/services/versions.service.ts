import { inject, Service, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, of, tap } from 'rxjs';

@Service()
export class VersionsService {
  private readonly apiService = inject(ApiService);

  readonly gameVersions = signal<string[]>([]);

  getServerVersions(): Observable<string[]> {
    // preventing unececarry requests
    if (this.gameVersions.length) {
      return of([]);
    }

    return this.apiService.get<string[]>('versions').pipe(
      tap((response: string[]) => {
        this.gameVersions.set(response);
      }),
    );
  }
}
