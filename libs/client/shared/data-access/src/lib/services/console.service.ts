import { inject, Service, signal } from '@angular/core';
import { SocketService } from './socket.service';
import { ServerSocketEvent } from '@game-server/shared/types';

export interface ConsoleLine {
  consoleType: ServerSocketEvent['type'];
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

      if (
        event.type !== 'console-output' &&
        event.type !== 'console-error' &&
        event.type !== 'console-info'
      ) {
        return;
      }

      const line: ConsoleLine = {
        consoleType: event.type,
        type: event.type === 'console-error' ? 'stderr' : 'stdout',
        text: event.data,
      };

      this.linesRecord.update((record) => ({
        ...record,
        [event.serverId]: [...(record[event.serverId] ?? []), line],
      }));
    });
  }

  watch(serverId: string): void {
    this.currentServerId = serverId;

    this.linesRecord.update((record) => ({
      ...record,
      [serverId]: [],
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
