import { inject, Service, signal } from '@angular/core';
import { SocketService } from './socket.service';

export interface ConsoleLine {
  type: 'stdout' | 'stderr';
  text: string;
}

@Service()
export class ConsoleService {
  private readonly socketService = inject(SocketService);

  private currentServerId: string | null = null;

  readonly linesRecord = signal<Record<string, ConsoleLine[]>>({});

  constructor() {
    this.socketService.connect();

    this.socketService.events$.subscribe((event) => {
      if (event.serverId !== this.currentServerId) {
        return;
      }

      if (event.type === 'console-output') {
        this.linesRecord.update((record) => ({
          ...record,
          [event.serverId]: [
            ...(record[event.serverId] ?? []),
            {
              type: 'stdout',
              text: event.data,
            },
          ],
        }));
      }

      if (event.type === 'console-error') {
        this.linesRecord.update((record) => ({
          ...record,
          [event.serverId]: [
            ...(record[event.serverId] ?? []),
            {
              type: 'stderr',
              text: event.data,
            },
          ],
        }));
      }
    });
  }

  watch(serverId: string): void {
    this.currentServerId = serverId;

    this.linesRecord.update((record) => ({
      ...record,
      [serverId]: record[serverId] ?? [],
    }));

    this.socketService.subscribeToServer(serverId);
  }

  stopWatching(serverId: string): void {
    this.socketService.unsubscribeFromServer(serverId);
    this.currentServerId = null;
  }

  send(command: string): void {
    if (!this.currentServerId) return;
    this.socketService.sendCommand(this.currentServerId, command);
  }
}
