import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ConsoleService } from '@game-server/client/shared';
import { ActivatedRoute } from '@angular/router';
import { DashboardService } from '@game-server/dashboard-data-access';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ScrollDirective } from '@game-server/directives';
import { map } from 'rxjs';

@Component({
  selector: 'lib-client-terminal',
  imports: [FormField, ScrollDirective],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
})
export class ClientTerminal {
  private readonly route = inject(ActivatedRoute);
  private readonly consoleService = inject(ConsoleService);
  readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly logClass = logClass;

  readonly terminalModel = signal({ command: '' });
  readonly terminalForm = form(this.terminalModel, (path) => {
    required(path.command, { message: 'Command is empty' });
  });

  readonly serverId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('id'))),
    { initialValue: null },
  );

  readonly serverList = this.dashboardService.serverList;

  readonly server = computed(() => {
    return this.dashboardService
      .serverList()
      .find((s) => s.id === this.serverId());
  });

  readonly serverStatus = computed(() => {
    return this.server()?.status;
  });

  readonly terminalLines = computed(() => {
    const id = this.serverId();
    return id ? (this.consoleService.linesRecord()[id] ?? []) : [];
  });

  constructor() {
    this.dashboardService
      .getServerList()
      .pipe(takeUntilDestroyed())
      .subscribe();

    effect((onCleanup) => {
      const id = this.serverId();
      if (!id) return;

      untracked(() => this.consoleService.watch(id));
      onCleanup(() => this.consoleService.stopWatching(id));
    });
  }

  startServer(id: string) {
    this.dashboardService
      .start(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  stopServer(id: string) {
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

  onSubmit(): void {
    if (this.terminalForm().valid()) {
      this.consoleService.send(String(this.terminalModel().command));

      this.terminalModel.update((m) => ({ ...m, command: '' }));
    }
  }
}

export function logClass(
  text: string,
): 'log-info' | 'log-warning' | 'log-error' {
  const t = text.toLowerCase();

  if (/\/error|\[error]|^error:|exception|fatal/.test(t)) return 'log-error';
  if (/\/warn|\[warn]|^warning:|warn:/.test(t)) return 'log-warning';
  return 'log-info';
}
