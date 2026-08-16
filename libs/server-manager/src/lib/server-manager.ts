import { spawn, ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { ServerManagerOptions, ServerStatus } from './types';
import { mkdirSync, writeFileSync } from 'node:fs';

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
    return this.serverStatus === 'running' || this.serverStatus === 'starting';
  }

  start(): void {
    if (this.isRunning()) {
      throw new Error('Server is already running!');
    }

    this.setStatus('starting');

    // server file creation must be set at the desktop or custom location where to user wants
    mkdirSync(this.serverManagerOptions.cwd, { recursive: true });

    // automatically sets minecraft server eula to true
    writeFileSync(`${this.serverManagerOptions.cwd}/eula.txt`, 'eula=true');

    this.childProcess = spawn(
      this.serverManagerOptions.command,
      this.serverManagerOptions.args,
      {
        cwd: this.serverManagerOptions.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    this.childProcess.stdout?.on('data', (data: Buffer) => {
      this.emit('stdout', data.toString());
    });

    this.childProcess.stderr?.on('data', (data: Buffer) => {
      this.emit('stderr', data.toString());
    });

    this.childProcess.on('spawn', () => {
      this.setStatus('running');
    });

    this.childProcess.on('exit', (code, signal) => {
      this.setStatus(
        signal === 'SIGTERM' || code === 0 ? 'stopped' : 'crashed',
      );

      this.emit('exit', code);

      this.childProcess = null;
    });

    this.childProcess.on('error', (err) => {
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

  // single public method that allows to updated status outside from the class
  markStatus(status: ServerStatus): void {
    this.setStatus(status);
  }
}
