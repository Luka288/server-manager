import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    title: 'Dashboard',
    loadComponent: () =>
      import('@game-server/dashboard/feature').then((m) => m.Dashboard),
  },

  {
    path: 'servers/:id/console',
    title: 'Terminal',
    loadComponent: () =>
      import('@game-server/client/terminal/feature').then(
        (m) => m.ClientTerminal,
      ),
  },
];
