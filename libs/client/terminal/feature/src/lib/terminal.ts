import {
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ConsoleService } from '@game-server/client/shared';
import { ActivatedRoute } from '@angular/router';
import { DashboardStore } from '@game-server/dashboard-data-access';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScrollDirective } from '@game-server/directives';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { map } from 'rxjs';

@Component({
  selector: 'lib-client-terminal',
  imports: [FormField, ScrollDirective, ScrollingModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
})
export class ClientTerminal {
  private readonly route = inject(ActivatedRoute);
  private readonly consoleService = inject(ConsoleService);
  readonly dashboardStore = inject(DashboardStore);

  readonly lineHeight = 27;
  trackByIndex = (i: number) => i;

  // TODO: INFINITY SCROLL NEEDS CORRECTIONS

  readonly terminalModel = signal({ command: '' });
  readonly terminalForm = form(this.terminalModel, (path) => {
    required(path.command, { message: 'Command is empty' });
  });

  readonly serverId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: null },
  );

  readonly serverList = this.dashboardStore.servers;

  readonly terminalLines = computed(() => {
    const id = this.serverId();
    return id ? (this.consoleService.linesRecord()[id] ?? []) : [];
  });

  readonly busy = computed(() => {
    const id = this.serverId();
    return !!id && this.dashboardStore.busyIds().includes(id);
  });

  readonly server = computed(() => {
    return this.dashboardStore.servers().find((s) => s.id === this.serverId());
  });

  readonly serverStatus = computed(() => this.server()?.status);

  constructor() {
    if (this.dashboardStore.servers().length === 0) this.dashboardStore.load();

    effect((onCleanup) => {
      const id = this.serverId();
      if (!id) return;

      untracked(() => this.consoleService.watch(id));
      onCleanup(() => this.consoleService.stopWatching(id));
    });
  }

  startServer(id: string) {
    this.dashboardStore.start(id);
  }

  stopServer(id: string) {
    this.dashboardStore.stop(id);
  }

  restartServer(id: string) {
    this.dashboardStore.restart(id);
  }

  onSubmit(): void {
    if (this.terminalForm().invalid()) {
      return;
    }

    let command = this.terminalModel().command.trim();
    if (!command) return;

    if (!command.startsWith('/')) {
      command = '/' + command;
    }

    this.consoleService.send(command);

    this.terminalModel.update((m) => ({ ...m, command: '' }));
  }
}
