import { Service, signal } from '@angular/core';
import { Toast, ToastType } from '@game-server/client/types';

@Service()
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(type: ToastType, message: string, opts?: Partial<Toast>) {
    const id = crypto.randomUUID();
    this._toasts.update((list) => [...list, { id, type, message, ...opts }]);

    if (opts?.autoCloseMs) {
      setTimeout(() => this.dismiss(id), opts.autoCloseMs);
    }
    return id;
  }

  dismiss(id: string): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
