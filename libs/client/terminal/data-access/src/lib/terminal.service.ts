import { inject, Service } from '@angular/core';
import { ApiService } from '@game-server/client/shared';
import { DashboardService } from '@game-server/dashboard-data-access';

@Service()
export class TerminalService {
  private readonly apiService = inject(ApiService);
  private readonly dashboardService = inject(DashboardService);

  restart(id: string) {
    this.dashboardService.restart(id);
  }
}
