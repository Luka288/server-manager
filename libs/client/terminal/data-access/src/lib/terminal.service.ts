import { inject, Service } from '@angular/core';
import { ApiService } from '@game-server/client/shared';
import { DashboardStore } from '@game-server/dashboard-data-access';

@Service()
export class TerminalService {
  private readonly apiService = inject(ApiService);
  private readonly store = inject(DashboardStore);

  restart(id: string) {
    this.store.restart(id);
  }
}
