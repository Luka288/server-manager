import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { DashboardService } from '@game-server/dashboard-data-access';
import {
  takeUntilDestroyed,
  toObservable,
  toSignal,
} from '@angular/core/rxjs-interop';
import { ClientTerminal } from '@game-server/client/terminal/feature';
import { Server } from '@game-server/types';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'lib-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  /*
    manual subscribtions must be changed
  */

  readonly servers = this.dashboardService.serverList;

  // readonly servers = toSignal(this.dashboardService.getServerList(), {
  //   initialValue: [] as Server[],
  // });

  readonly runningServers = computed(() => {
    return this.servers().filter((server) => server.status === 'running')
      .length;
  });

  ngOnInit(): void {
    this.dashboardService
      .getServerList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  // [routerLink]="['/servers', server.id, 'console']"

  navToTerminal(serverId: string): void {
    this.router.navigateByUrl(`/servers/${serverId}/console`);
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
