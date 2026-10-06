import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DashboardService } from '@game-server/dashboard-data-access';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreateModal } from '@game-server/client/shared/ui/create-modal';
import { CreateServerForm } from '@game-server/client/types';
import { StateService, ToastService } from '@game-server/client/shared';
import { ReactiveFormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';

export interface FolderSearchModel {
  path: string;
  serverId: string;
}

@Component({
  selector: 'lib-dashboard',
  imports: [ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialog);
  private readonly toastService = inject(ToastService);
  readonly stateService = inject(StateService);

  /*
    manual subscribtions must be changed
  */

  readonly searchModel = signal<FolderSearchModel>({
    path: '', // new folder path that will be sent to backend and will be rewritten to servers path
    serverId: '',
  });
  readonly FolderPathForm = form(this.searchModel, (path) => {
    required(path.path);
  });

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

      this.createServer(formData);
    });
  }

  createServer(payload: CreateServerForm) {
    const toastId = this.toastService.show('loading', 'Creating server...');

    this.dashboardService.create(payload).subscribe({
      next: () => {
        this.toastService.dismiss(toastId);
        this.toastService.show('success', 'Server created!', {
          autoCloseMs: 3000,
        });
      },
      error: () => {
        this.toastService.dismiss(toastId);
        this.toastService.show('error', 'Failed to create server.', {
          autoCloseMs: 4000,
        });
      },
    });
  }

  locatePath(serverId: string): void {
    this.dashboardService
      .updatePath(serverId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (path) =>
          this.searchModel.update((model) => ({
            ...model,
            path: path.serverDirectory,
            serverId: serverId,
          })),
        error: (error) =>
          console.error('Failed to select/update folder:', error),
      });
  }

  navToTerminal(serverId: string): void {
    this.router.navigateByUrl(`/servers/${serverId}/console`);
  }

  startServer(id: string): void {
    this.dashboardService
      .start(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  stopServer(id: string): void {
    this.dashboardService
      .stop(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  deleteServer(id: string) {
    this.dashboardService
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  restartServer(id: string) {
    this.dashboardService
      .restart(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
