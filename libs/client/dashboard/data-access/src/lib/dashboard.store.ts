import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { lastValueFrom } from 'rxjs';
import {
  ConnectionInfo,
  CreateServerForm,
  Server,
} from '@game-server/client/types';
import { DashboardService } from './dashboard.service';
import { SocketService, ToastService } from '@game-server/client/shared';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export const DashboardStore = signalStore(
  { providedIn: 'root' }, // app wide state store

  withState({
    servers: [] as Server[],
    connectionInfo: {} as Record<string, ConnectionInfo>,
    isLoading: false,
    isCreating: false,
    busyIds: [] as string[],
  }),

  withMethods(
    (
      store,
      service = inject(DashboardService),
      toast = inject(ToastService),
    ) => {
      const setBusy = (id: string, busy: boolean) =>
        patchState(store, ({ busyIds }) => ({
          busyIds: busy ? [...busyIds, id] : busyIds.filter((x) => x !== id),
        }));

      const patchServer = (id: string, patch: Partial<Server>) =>
        patchState(store, ({ servers }) => ({
          servers: servers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        }));

      return {
        patchServer,

        async load() {
          patchState(store, { isLoading: true });

          try {
            const servers = await lastValueFrom(service.getServerList());

            patchState(store, { servers });
          } catch {
            toast.show('error', 'Failed to load servers', {
              autoCloseMs: 3000,
            });
          } finally {
            patchState(store, { isLoading: false });
          }
        },

        async create(payload: CreateServerForm) {
          patchState(store, { isCreating: true });

          const loadingId = toast.show('loading', 'Server creating...');

          try {
            const server = await lastValueFrom(service.create(payload));

            patchState(store, ({ servers }) => ({
              servers: [...servers, server],
            }));

            toast.show('success', 'Server created!', { autoCloseMs: 3000 });
          } catch {
            toast.show('error', 'Failed to create server!', {
              autoCloseMs: 3000,
            });
          } finally {
            toast.dismiss(loadingId);
            patchState(store, { isCreating: false });
          }
        },

        async start(id: string) {
          if (store.busyIds().includes(id)) {
            return;
          }

          setBusy(id, true);

          try {
            const server = await lastValueFrom(service.start(id));
            patchServer(id, { status: server.status });
          } catch (error) {
            toast.show('error', 'Failed to start server', {
              autoCloseMs: 3000,
            });
          } finally {
            setBusy(id, false);
          }
        },

        async stop(id: string) {
          if (store.busyIds().includes(id)) {
            return;
          }

          setBusy(id, true);

          try {
            const server = await lastValueFrom(service.stop(id));
            patchServer(id, { status: server.status });
          } catch {
            toast.show('error', 'Failed to stop server', { autoCloseMs: 3000 });
          } finally {
            setBusy(id, false);
          }
        },

        async restart(id: string) {
          if (store.busyIds().includes(id)) return;

          setBusy(id, true);

          try {
            const server = await lastValueFrom(service.restart(id));

            patchServer(id, { status: server.status });
          } catch (error) {
            toast.show('error', 'Could not restart the server', {
              autoCloseMs: 3000,
            });
          } finally {
            setBusy(id, false);
          }
        },

        async delete(id: string) {
          if (store.busyIds().includes(id)) {
            return;
          }

          setBusy(id, true);

          try {
            const result = await lastValueFrom(service.delete(id));

            if (result.deleted) {
              patchState(store, ({ servers }) => ({
                servers: servers.filter((s) => s.id !== id),
              }));

              toast.show('success', 'Server deleted', { autoCloseMs: 3000 });
            }
          } catch (error) {
            toast.show('error', 'Failed to delete server', {
              autoCloseMs: 3000,
            });
          } finally {
            setBusy(id, false);
          }
        },

        async updatePath(id: string) {
          if (store.busyIds().includes(id)) return;
          setBusy(id, true);

          try {
            const updated = await lastValueFrom(service.updatePath(id));
            patchServer(id, { serverDirectory: updated.serverDirectory });
            toast.show('success', 'Server directory updated', {
              autoCloseMs: 3000,
            });
            return updated;
          } catch {
            toast.show('error', 'Failed to update server path', {
              autoCloseMs: 3000,
            });
            return undefined;
          } finally {
            setBusy(id, false);
          }
        },
      };
    },
  ),
  withHooks((store, socket = inject(SocketService)) => ({
    onInit() {
      socket.connect();

      socket.events$.pipe(takeUntilDestroyed()).subscribe((event) => {
        if (event.type !== 'server-status') return;
        store.patchServer(event.serverId, { status: event.status });
      });
    },
  })),
);
