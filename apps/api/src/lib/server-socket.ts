import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'node:http';

import {
  ServerSocketEvent,
  ClientSocketEvent,
} from '@game-server/shared/types';

import { ServerRegistry, ServerManager } from '@game-server/server-manager';
import { SrvRecord } from 'node:dns';
import { Socket } from 'node:dgram';

export class ServerSocket {
  private readonly wss: WebSocketServer;

  private readonly subscriptions = new Map<WebSocket, Set<string>>();

  constructor(
    httpServer: HttpServer,
    private readonly registry: ServerRegistry,
  ) {
    this.wss = new WebSocketServer({
      server: httpServer,
      path: '/ws',
    });

    this.wss.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  attachManager(serverId: string, manager: ServerManager): void {
    manager.on('statusChange', (status) => {
      this.broadcast({
        type: 'server-status',
        serverId,
        status,
      });
    });

    manager.on('stdout', (data) => {
      this.broadcastToSubscribers(serverId, {
        type: 'console-output',
        serverId,
        data,
      });
    });

    manager.on('stderr', (data) => {
      this.broadcastToSubscribers(serverId, {
        type: 'console-error',
        serverId,
        data,
      });
    });
  }

  private handleConnection(socket: WebSocket) {
    console.log('[ws] Client connected');

    this.subscriptions.set(socket, new Set());

    socket.on('message', (raw) => {
      this.handleMessage(socket, raw.toString());
    });
  }

  private handleMessage(socket: WebSocket, raw: string) {
    let event: ClientSocketEvent;

    try {
      event = JSON.parse(raw);
    } catch {
      console.error('[ws] Invalid message');
      return;
    }

    switch (event.type) {
      case 'subscribe':
        this.subscribe(socket, event.serverId);
        break;

      case 'unsubscribe':
        this.unsubscribe(socket, event.serverId);
        break;

      case 'command':
        this.command(event.serverId, event.command);
        break;
    }
  }

  private subscribe(socket: WebSocket, serverId: string) {
    try {
      const manager = this.registry.get(serverId);
      const subscriptions = this.subscriptions.get(socket);

      if (!subscriptions) {
        return;
      }

      subscriptions.add(serverId);

      this.send(socket, {
        type: 'server-status',
        serverId,
        status: manager.getStatus(),
      });
    } catch (error) {
      console.error(`[ws] Subscribe failed: ${(error as Error).message}`);
    }
  }

  private unsubscribe(socket: WebSocket, serverId: string) {
    this.subscriptions.get(socket)?.delete(serverId);
  }

  private command(serverId: string, command: string) {
    try {
      this.registry.get(serverId).sendCommand(command);
    } catch (error) {
      console.error(`[ws] Command failed: ${(error as Error).message}`);
    }
  }

  private broadcast(event: ServerSocketEvent): void {
    const payload = JSON.stringify(event);

    for (const socket of this.wss.clients) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }

  private broadcastToSubscribers(
    serverId: string,
    event: ServerSocketEvent,
  ): void {
    const payload = JSON.stringify(event);

    for (const [socket, serverIds] of this.subscriptions) {
      if (serverIds.has(serverId) && socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    }
  }

  private send(socket: WebSocket, event: ServerSocketEvent): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(event));
    }
  }
}
