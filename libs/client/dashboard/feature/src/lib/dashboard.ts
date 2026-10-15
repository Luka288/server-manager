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
import { ConfirmationModal } from '@game-server/shared/ui/confirmationModal';
import {
  InfoContainer,
  InfoModalData,
} from '@game-server/client/shared/infoContainer';
import { rxResource } from '@angular/core/rxjs-interop';

export interface FolderSearchModel {
  path: string;
  serverId: string;
}

@Component({
  selector: 'lib-dashboard',
  imports: [ReactiveFormsModule, InfoContainer],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
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

  readonly runningServer = computed(() =>
    this.servers().find((s) => s.status === 'running'),
  );

  readonly runningCount = computed(
    () => this.servers().filter((s) => s.status === 'running').length,
  );

  readonly connection = rxResource({
    params: () => this.runningServer()?.id,
    stream: ({ params: id }) => this.dashboardService.getConnectionInfo(id),
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

  async deleteServer(id: string) {
    const confirmation = await this.modalService.open<boolean>(
      ConfirmationModal,
      {
        panelClass: 'transparent-dialog',
        data: {
          title: 'Delete server?',
          message: 'This will also delete the server files from your computer.',
          confirmText: 'Delete',
          refuseText: 'Cancel',
          textClass: 'WARN',
        },
      },
    );

    if (!confirmation) return;

    this.dashboardService
      .delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  openConnect(): void {
    const info = this.connection.value();
    if (!info) return;

    this.modalService.open(InfoContainer, {
      panelClass: 'transparent-dialog',
      data: {
        title: 'How to connect',
        rows: [
          { label: 'Local address', value: info.localAddress, copyable: true },
          {
            label: 'Public address (Port forwarding needed!)',
            value: info.connectAddress,
            copyable: true,
          },
        ],
        note: info.note,
      } satisfies InfoModalData,
    });
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

  restartServer(id: string) {
    this.dashboardService
      .restart(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
