import * as path from 'node:path';
import { ServerManager } from './server-manager';

describe('ServerManager', () => {
  let manager: ServerManager;

  beforeEach(() => {
    manager = new ServerManager({
      command: 'node',
      args: [path.join(__dirname, '../../test-fixtures/dummy-process.js')],
      cwd: __dirname,
      name: 'test server',
    });
  });

  it('starts and transitions to running status', (done) => {
    manager.on('statusChange', (status) => {
      if (status === 'running') {
        expect(manager.getStatus()).toBe('running');
        expect(manager.isRunning()).toBe(true);

        done();
      }
    });

    manager.start();
  });

  it('captures stdout output', (done) => {
    manager.on('stdout', (chunk) => {
      if (!chunk.includes('Starting dummy process...')) return;

      expect(chunk).toContain('Starting dummy process...');
      done();
    });

    manager.start();
  });

  it('captures stderr output', (done) => {
    manager.on('stderr', (chunk) => {
      expect(chunk).toContain('This is a test error message');

      done();
    });

    manager.start();
  });

  it('reports stopped status after a deliberate stop', (done) => {
    manager.on('statusChange', (status) => {
      if (status === 'running') {
        manager.stop();
      }

      if (status === 'stopped') {
        expect(manager.getStatus()).toBe('stopped');
        done();
      }
    });

    manager.start();
  });

  it('sends a command via stdin and receives it echoed back', (done) => {
    manager.on('statusChange', (status) => {
      if (status === 'running') {
        manager.sendCommand('Hello from sendCommand');
      }
    });

    manager.on('stdout', (chunk) => {
      if (chunk.includes('Received command: Hello from sendCommand')) {
        expect(chunk).toContain('Received command: Hello from sendCommand');
        done();
      }
    });

    manager.start();
  });

  it('restarts: stops and starts again, reaching running twice', (done) => {
    let runningCount = 0;

    manager.on('statusChange', (status) => {
      if (status === 'running') {
        runningCount++;

        if (runningCount === 1) {
          manager.restart();
        }

        if (runningCount === 2) {
          expect(manager.getStatus()).toBe('running');
          expect(manager.isRunning()).toBe(true);
          done();
        }
      }
    });

    manager.start();
  });

  it('waits for the process to stop during shutdown', async () => {
    manager.start();

    await new Promise<void>((resolve) => {
      manager.once('statusChange', (status) => {
        if (status === 'running') resolve();
      });
    });

    await manager.shutdown(1_000);

    expect(manager.getStatus()).toBe('stopped');
  });

  afterEach(async () => {
    await manager.shutdown(1_000);
  });
});
