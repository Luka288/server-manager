import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ConsoleService } from '@game-server/client/shared';
import { ActivatedRoute } from '@angular/router';
import { DashboardService } from '@game-server/dashboard-data-access';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lib-client-terminal',
  imports: [FormField],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
})
export class ClientTerminal implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly consoleService = inject(ConsoleService);
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  readonly terminalModel = signal({ command: '' });

  readonly terminalForm = form(this.terminalModel, (path) => {
    required(path.command, { message: 'Command is empty' });
  });

  readonly serverId = signal<string | null>(null);

  // readonly terminalLines = this.consoleService.linesRecord;
  readonly serverList = this.dashboardService.serverList;

  readonly server = computed(() => {
    return this.serverList().find((server) => server.id === this.serverId());
  });

  readonly serverStatus = computed(() => {
    return this.serverList().find((server) => server.id === this.serverId())
      ?.status;
  });

  readonly terminalLines = computed(() => {
    const id = this.serverId();

    if (!id) {
      return [];
    }

    console.log(this.consoleService.linesRecord());

    return this.consoleService.linesRecord()[id] ?? [];
  });

  checkTextStatus(text: string): string {
    if (!text) return 'log-info';

    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('/error') ||
      lowerText.includes('[error]') ||
      lowerText.startsWith('error:') ||
      lowerText.includes('exception') ||
      lowerText.includes('fatal')
    ) {
      return 'log-error';
    }

    if (
      lowerText.includes('/warn') ||
      lowerText.includes('[warn]') ||
      lowerText.startsWith('warning:') ||
      lowerText.includes('warn:')
    ) {
      return 'log-warning';
    }

    return 'log-info';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.serverId.set(id);

    this.consoleService.watch(id);
  }

  ngOnDestroy(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.consoleService.stopWatching(id);
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

  onSubmit(): void {
    if (this.terminalForm().valid()) {
      this.consoleService.send(String(this.terminalModel().command));

      this.terminalModel.update((m) => ({ ...m, command: '' }));
    }
  }
}
