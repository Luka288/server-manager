export type ServerStatus =
  | 'stopped'
  | 'running'
  | 'stopping'
  | 'starting'
  | 'crashed'
  | 'provisioning';

export interface Server {
  id: string;
  name: string;
  status: ServerStatus;
  serverDirectory: string;
}

export interface ServerDetail extends Server {
  ip: string;
  port: number;
  connectAddress: string;
  note: string;
}
