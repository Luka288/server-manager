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
}

export interface ServerManagerEvents {
  stdout: (chunk: string) => void;
  stderr: (chunk: string) => void;
  exit: (code: number | null) => void;
  statusChange: (status: ServerStatus) => void;
}
