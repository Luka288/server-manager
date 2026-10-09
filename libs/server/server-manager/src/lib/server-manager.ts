import { spawn, ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { ServerManagerOptions } from './types';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ServerStatus } from '@game-server/shared/types';

/* ServerManager class extends to the EventEmitter because whenever
   something changes it will automatically fire event
*/
export class ServerManager extends EventEmitter {
  private readonly serverManagerOptions: ServerManagerOptions;
  private childProcess: ChildProcess | null = null;
  private serverStatus: ServerStatus = 'stopped';

  constructor(options: ServerManagerOptions) {
    super();
    this.serverManagerOptions = options;
  }

  private restartPending = false;
  private intentionalStop = false;

  private setStatus(status: ServerStatus): void {
    this.serverStatus = status;
    this.emit('statusChange', this.serverStatus);
  }

  // checking if server is running before we run new one
  isRunning(): boolean {
    return this.serverStatus === 'running';
  }

  isStarting(): boolean {
    return this.serverStatus === 'starting';
  }

  start(): void {
    if (this.childProcess) {
      throw new Error('Server is already running, starting or restarting!');
    }

    this.intentionalStop = false;
    this.setStatus('starting');

    mkdirSync(this.serverManagerOptions.cwd, { recursive: true });
    writeFileSync(`${this.serverManagerOptions.cwd}/eula.txt`, 'eula=true');

    const child = spawn(
      this.serverManagerOptions.command,
      this.serverManagerOptions.args,
      { cwd: this.serverManagerOptions.cwd, stdio: ['pipe', 'pipe', 'pipe'] },
    );

    this.childProcess = child;

    child.stdout?.on('data', (data: Buffer) => {
      if (this.childProcess !== child) return;

      const output = data.toString();
      this.emit('stdout', output);

      if (output.includes('Done (') && this.serverStatus === 'starting') {
        this.setStatus('running');
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      if (this.childProcess !== child) return;
      this.emit('stderr', data.toString());
    });

    child.on('exit', (code, signal) => {
      if (this.childProcess !== child) return;

      this.childProcess = null;

      const clean = this.intentionalStop || code === 0 || signal === 'SIGTERM';

      this.intentionalStop = false;

      this.setStatus(clean ? 'stopped' : 'crashed');

      this.emit('exit', code);

      const shouldRestart = this.restartPending;

      this.restartPending = false;

      if (shouldRestart && clean) {
        try {
          this.start();
        } catch (err) {
          this.setStatus('crashed');
          this.emit('stderr', `Restart failed: ${(err as Error).message}`);
        }
      }
    });

    child.on('error', (err) => {
      if (this.childProcess !== child) return;

      this.childProcess = null;
      this.restartPending = false;
      this.setStatus('crashed');
      this.emit('stderr', `Process error: ${err.message}`);
    });
  }

  stop(): void {
    if (!this.isRunning() && !this.isStarting()) {
      throw new Error('Server is not running');
    }

    this.requestStop();
  }

  restart(): void {
    if (
      this.restartPending ||
      this.serverStatus === 'starting' ||
      this.serverStatus === 'stopping' ||
      this.serverStatus === 'restarting'
    ) {
      throw new Error('Server is busy, try again in a moment');
    }

    if (!this.childProcess) {
      this.start();
      return;
    }

    this.restartPending = true;
    this.setStatus('restarting');
    this.requestStop();
  }

  private requestStop(): void {
    const child = this.childProcess;

    if (!child) {
      this.restartPending = false;
      this.setStatus('stopped');
      return;
    }

    this.intentionalStop = true;
    if (!this.restartPending) this.setStatus('stopping');

    console.log(`[${this.serverManagerOptions.name}] sending stop`);
    child.stdin?.write('stop\n');

    setTimeout(() => {
      if (this.childProcess === child) {
        console.log(
          `[${this.serverManagerOptions.name}] stop timed out, killing`,
        );
        child.kill();
      }
    }, 15_000).unref();
  }

  sendCommand(command: string): void {
    if (!this.isRunning() || !this.childProcess?.stdin) {
      throw new Error('Cannot send command: Server is not running!');
    }

    this.childProcess.stdin.write(command + '\n');
  }

  getStatus(): ServerStatus {
    return this.serverStatus;
  }

  getName(): string {
    return this.serverManagerOptions.name;
  }

  // this must be Desktop at default
  getDirectory(): string {
    return this.serverManagerOptions.cwd;
  }

  // single public method that allows to updated status outside from the class
  markStatus(status: ServerStatus): void {
    this.setStatus(status);
  }

  updateDirectory(path: string): void {
    if (this.isRunning() || this.isStarting()) {
      throw new Error('Cannot change directory while server is running');
    }

    this.serverManagerOptions.cwd = path;
  }

  dispose(): void {
    this.childProcess?.kill();
  }
}
