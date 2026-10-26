import type { ServerType } from '@game-server/shared/types';

export type ServerStatus =
  | 'stopped'
  | 'running'
  | 'stopping'
  | 'starting'
  | 'restarting'
  | 'crashed'
  | 'provisioning';

export interface Server {
  id: string;
  name: string;
  status: ServerStatus;
  serverDirectory: string;
  type: ServerType;
}

export interface ServerDetail extends Server {
  ip: string;
  port: number;
  connectAddress: string;
  note: string;
}

export interface ConnectionInfo {
  id: string;
  name: string;
  ip: string;
  localIp: string;
  port: string;
  connectAddress: string;
  localAddress: string;
  note: string;
  type: ServerType;
}
