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
    if (this.isRunning() || this.isStarting()) {
      throw new Error('Server is already running or starting!');
    }

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

      if (output.includes('Done (')) {
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
      this.setStatus(
        signal === 'SIGTERM' || code === 0 ? 'stopped' : 'crashed',
      );
      this.emit('exit', code);
    });

    child.on('error', (err) => {
      if (this.childProcess !== child) return;

      this.childProcess = null;
      this.setStatus('crashed');
      this.emit('stderr', `Process error: ${err.message}`);
    });
  }

  stop(): void {
    if (!this.isRunning()) {
      throw new Error('Server is not running');
    }

    this.setStatus('stopping');
    this.childProcess?.kill();
  }

  restart(): void {
    if (this.isRunning()) {
      this.once('exit', () => this.start());
      this.stop();
    } else {
      this.start();
    }
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
