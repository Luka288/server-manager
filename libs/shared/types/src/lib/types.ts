export type ServerStatus =
  | 'stopped'
  | 'running'
  | 'stopping'
  | 'starting'
  | 'crashed'
  | 'provisioning'
  | 'restarting';

export type ServerType = 'vanilla' | 'fabric';

export interface ServerStatusEvent {
  type: 'server-status';
  serverId: string;
  status: ServerStatus;
}

export interface ConsoleOutputEvent {
  type: 'console-output';
  serverId: string;
  data: string;
}

export interface ConsoleErrorEvent {
  type: 'console-error';
  serverId: string;
  data: string;
}

export interface ConsoleInfoEvent {
  type: 'console-info';
  serverId: string;
  data: string;
}

export interface SubscribeEvent {
  type: 'subscribe';
  serverId: string;
}

export interface UnsubscribeEvent {
  type: 'unsubscribe';
  serverId: string;
}

export interface CommandEvent {
  type: 'command';
  serverId: string;
  command: string;
}

export type ServerSocketEvent =
  | ServerStatusEvent
  | ConsoleOutputEvent
  | ConsoleErrorEvent
  | ConsoleInfoEvent;

export type ClientSocketEvent =
  | SubscribeEvent
  | UnsubscribeEvent
  | CommandEvent;
