import { Service } from '@angular/core';
import { Subject } from 'rxjs';
import {
  ClientSocketEvent,
  ServerSocketEvent,
} from '@game-server/shared/types';

@Service()
export class SocketService {
  private socket: WebSocket | null = null;

  private readonly eventsSubject = new Subject<ServerSocketEvent>();

  readonly events$ = this.eventsSubject.asObservable();

  connect(): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.socket = new WebSocket('ws://localhost:3000/ws');

    this.socket.onopen = () => {
      console.log('[ws] Connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as ServerSocketEvent;

      console.log('[ws] Received: ', data);

      this.eventsSubject.next(data);
    };

    this.socket.onerror = (error) => {
      console.error('[ws] Error:', error);
    };

    this.socket.onclose = () => {
      console.log('[ws] Disconnected');
      this.socket = null;
    };
  }

  send(event: ClientSocketEvent): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('[ws] Socket is not connected');
      return;
    }

    this.socket.send(JSON.stringify(event));
  }

  subscribeToServer(serverId: string): void {
    this.send({
      type: 'subscribe',
      serverId,
    });
  }

  unsubscribeFromServer(serverId: string): void {
    this.send({
      type: 'unsubscribe',
      serverId,
    });
  }

  sendCommand(serverId: string, command: string): void {
    this.send({
      type: 'command',
      serverId,
      command,
    });
  }
}
