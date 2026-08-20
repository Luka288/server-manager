import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    title: 'Dashboard',
    loadComponent: () =>
      import('@game-server/dashboard-feature').then((m) => m.Feature),
  },
];
