import { WebSocketServer, WebSocket } from 'ws';
import { Server as HttpServer } from 'node:http';

import {
  ServerSocketEvent,
  ClientSocketEvent,
} from '@game-server/shared/types';

import { ServerRegistry, ServerManager } from '@game-server/server-manager';
import { getServerPort } from './public-ip';
import { getLocalIp } from './local-ip';
import { getPublicIp } from './../lib/public-ip';

export class ServerSocket {
  private readonly wss: WebSocketServer;

  private readonly subscriptions = new Map<WebSocket, Set<string>>();
  private readonly lastStatus = new Map<string, string>();

  private readonly history = new Map<string, ServerSocketEvent[]>();
  private static readonly MAX_HISTORY = 1000;

  private readonly lastOutputAt = new Map<string, number>();

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
      this.broadcast({ type: 'server-status', serverId, status });

      if (status === 'starting') {
        this.pushConsole(serverId, {
          type: 'console-output',
          serverId,
          data: `[${new Date().toLocaleTimeString()}] [ServerManager/INFO]: Server starting...\r\n`,
        });
      }

      if (status === 'running') {
        this.announceAddress(serverId, manager);
      }

      if (status === 'stopped') {
        this.pushConsole(serverId, {
          type: 'console-output',
          serverId,
          data: `[${new Date().toLocaleTimeString()}] [ServerManager/INFO]: Server closed\r\n`,
        });
      }
    });

    manager.on('stdout', (data) => {
      this.lastOutputAt.set(serverId, Date.now());
      this.pushConsole(serverId, { type: 'console-output', serverId, data });
    });

    manager.on('stderr', (data) => {
      this.pushConsole(serverId, { type: 'console-error', serverId, data });
    });
  }

  private logInfo(serverId: string, message: string) {
    this.pushConsole(serverId, {
      type: 'console-info',
      serverId,
      data: `[${new Date().toLocaleTimeString()}] [ServerManager/CONNECTION-INFO]: ${message}\r\n`,
    });
  }

  private async announceAddress(
    serverId: string,
    manager: ServerManager,
  ): Promise<void> {
    const port = getServerPort(manager.getDirectory());
    const localIp = getLocalIp();

    let publicLine: string;
    try {
      const publicIp = await getPublicIp();
      publicLine = `Public IP (you need to enable port forwarding): ${publicIp}:${port}`;
    } catch {
      publicLine =
        'Public address unavailable (could not fetch your public IP)';
    }

    await this.waitForQuiet(serverId);

    if (manager.getStatus() !== 'running') return;

    if (localIp) {
      this.logInfo(serverId, `Same network (LAN): ${localIp}:${port}`);
    }
    this.logInfo(serverId, publicLine);
  }

  private async waitForQuiet(
    serverId: string,
    quietMs = 500,
    maxMs = 5000,
  ): Promise<void> {
    const start = Date.now();

    while (Date.now() - start < maxMs) {
      const last = this.lastOutputAt.get(serverId) ?? 0;
      if (Date.now() - last >= quietMs) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private handleConnection(socket: WebSocket) {
    console.log('[ws] Client connected');

    this.subscriptions.set(socket, new Set());

    socket.on('message', (raw) => {
      this.handleMessage(socket, raw.toString());
    });

    socket.on('close', () => {
      this.subscriptions.delete(socket);
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

      for (const event of this.history.get(serverId) ?? []) {
        this.send(socket, event);
      }
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

  private pushConsole(serverId: string, event: ServerSocketEvent): void {
    const list = this.history.get(serverId) ?? [];
    list.push(event);

    if (list.length > ServerSocket.MAX_HISTORY) {
      list.splice(0, list.length - ServerSocket.MAX_HISTORY);
    }

    this.history.set(serverId, list);
    this.broadcastToSubscribers(serverId, event);
  }
}
