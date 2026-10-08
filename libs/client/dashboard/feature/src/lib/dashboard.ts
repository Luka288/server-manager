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
import {
  ModalService,
  StateService,
  ToastService,
} from '@game-server/client/shared';
import { ReactiveFormsModule } from '@angular/forms';
import { form, required } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

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
  private readonly modalService = inject(ModalService);
  readonly stateService = inject(StateService);

  readonly searchModel = signal<FolderSearchModel>({
    path: '',
    serverId: '',
  });
  readonly FolderPathForm = form(this.searchModel, (path) => {
    required(path.path);
  });

  readonly servers = this.dashboardService.serverList;
  readonly connectionInfo = this.dashboardService.connectionInfo;

  readonly runningServers = computed(() => {
    return this.servers().filter((server) => server.status === 'running')
      .length;
  });

  readonly connection = computed(() => {
    const hasRunningServer = this.servers().some(
      (server) => server.status === 'running',
    );

    return hasRunningServer ? this.connectionInfo() : null;
  });

  ngOnInit(): void {
    this.dashboardService
      .getServerList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  async openCreate() {
    const formData =
      await this.modalService.open<CreateServerForm>(CreateModal);
    if (!formData) return; // user cancelled

    await this.createServer(formData);
  }

  async createServer(payload: CreateServerForm) {
    const toastId = this.toastService.show('loading', 'Creating server...');

    try {
      await firstValueFrom(this.dashboardService.create(payload));
      this.toastService.show('success', 'Server created!', {
        autoCloseMs: 3000,
      });
    } catch {
      this.toastService.show('error', 'Failed to create server.', {
        autoCloseMs: 4000,
      });
    } finally {
      this.toastService.dismiss(toastId);
    }
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
      .subscribe(console.log);
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
