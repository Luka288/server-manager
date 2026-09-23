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
}
