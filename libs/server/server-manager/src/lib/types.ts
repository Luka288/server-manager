import type { ServerType } from '@game-server/shared/types';

export type ServerStatus =
  | 'stopped'
  | 'running'
  | 'stopping'
  | 'starting'
  | 'crashed'
  | 'provisioning';

export interface ServerManagerOptions {
  command: string;
  args: string[];
  cwd: string;
  name: string;
  type?: ServerType;
}

export interface ServerManagerEvents {
  stdout: (chunk: string) => void;
  stderr: (chunk: string) => void;
  exit: (code: number | null) => void;
  statusChange: (status: ServerStatus) => void;
}
