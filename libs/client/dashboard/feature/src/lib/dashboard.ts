import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  DashboardService,
  DashboardStore,
} from '@game-server/dashboard-data-access';
import { Router } from '@angular/router';
import { CreateModal } from '@game-server/client/shared/ui/create-modal';
import { CreateServerForm } from '@game-server/client/types';
import { ModalService } from '@game-server/client/shared';
import { ReactiveFormsModule } from '@angular/forms';
import { form, required } from '@angular/forms/signals';
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
  private readonly router = inject(Router);
  private readonly modalService = inject(ModalService);
  readonly store = inject(DashboardStore);

  readonly searchModel = signal<FolderSearchModel>({ path: '', serverId: '' });
  readonly FolderPathForm = form(this.searchModel, (path) => {
    required(path.path);
  });

  readonly servers = this.store.servers;

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
    this.store.load();
  }

  async openCreate() {
    const formData =
      await this.modalService.open<CreateServerForm>(CreateModal);

    if (!formData) return;

    await this.store.create(formData);
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

    await this.store.delete(id);
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

  async locatePath(serverId: string) {
    const updated = await this.store.updatePath(serverId);
    if (!updated) return;

    this.searchModel.update((model) => ({
      ...model,
      path: updated.serverDirectory,
      serverId,
    }));
  }

  navToTerminal(serverId: string): void {
    this.router.navigateByUrl(`/servers/${serverId}/console`);
  }

  startServer(id: string) {
    this.store.start(id);
  }

  stopServer(id: string): void {
    this.store.stop(id);
  }

  restartServer(id: string) {
    this.store.restart(id);
  }
}
