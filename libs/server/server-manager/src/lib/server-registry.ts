import { ServerManager } from './server-manager';
import { ServerManagerOptions } from './types';

export class ServerRegistry {
  private managers = new Map<string, ServerManager>();

  create(id: string, options: ServerManagerOptions): ServerManager {
    if (this.managers.has(id)) {
      throw new Error(`Server with id "${id}" already exists`);
    }

    const manager = new ServerManager(options);
    this.managers.set(id, manager);

    return manager;
  }

  get(id: string): ServerManager {
    const manager = this.managers.get(id);

    if (!manager) {
      throw new Error(`Server with id "${id}" not found`);
    }

    return manager;
  }

  delete(id: string): void {
    if (!this.managers.has(id)) {
      throw new Error(`Server with id "${id}" not found`);
    }

    this.managers.delete(id);
  }

  list(): Map<string, ServerManager> {
    return new Map(this.managers);
  }

  async shutdownAll(): Promise<Error[]> {
    const results = await Promise.all(
      Array.from(this.managers.entries(), async ([id, manager]) => {
        try {
          await manager.shutdown();

          return null;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          return new Error(`Failed to shut down server "${id}": ${message}`);
        }
      }),
    );

    return results.filter((error): error is Error => error !== null);
  }
}
