import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { DashboardService } from '@game-server/dashboard-data-access';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateModal } from '@game-server/client/create-modal';
import { CreateServerForm } from '@game-server/client/types';

@Component({
  selector: 'lib-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialog);

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

  openCreate(): void {
    const dialog = this.dialogRef.open(CreateModal);

    dialog.afterClosed().subscribe((formData) => {
      if (!formData) {
        return;
      }

      console.log('Server form: ', formData);

      this.createServer(formData);
    });
  }

  createServer(payload: CreateServerForm) {
    this.dashboardService.create(payload).subscribe(console.log);
  }

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

  deleteServer(id: string) {
    this.dashboardService
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
