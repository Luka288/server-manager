export type ToastType = 'loading' | 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  icon?: string;
  autoCloseMs?: number;
}
