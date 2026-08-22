import { Component, computed, DestroyRef, inject } from '@angular/core';
import { DashboardService } from '@game-server/dashboard-data-access';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { Server } from '@game-server/types';

@Component({
  selector: 'lib-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly servers = toSignal(toObservable(this.dashboardService.serverList), {
    initialValue: [] as Server[],
  });

  readonly runningServers = computed(() => {
    return this.servers().filter((server) => server.status === 'running')
      .length;
  });

  ngOnInit(): void {
    this.dashboardService.getServerList().subscribe();
  }

  startServer(id: string): void {
    this.dashboardService
      .start(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(console.log);
  }

  stopServer(id: string): void {
    this.dashboardService
      .stop(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(console.log);
  }
}
