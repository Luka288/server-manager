import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  httpResource,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { CUSTOM_LOADING_TEXT, SKIP_GLOBAL_LOADER } from '../util/http-context';
import { finalize, tap } from 'rxjs';

export const requestInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const toastService = inject(ToastService);

  if (req.context.get(SKIP_GLOBAL_LOADER)) {
    return next(req);
  }

  let message = req.context.get(CUSTOM_LOADING_TEXT);

  if (!message) {
    message = 'Loading...';
    // switch (req.method) {
    //   case 'POST':
    //     message = 'Creating...';
    //     break;
    //   case 'PUT':
    //   case 'PATCH':
    //     message = 'Saving changes...';
    //     break;
    //   case 'DELETE':
    //     message = 'Deleting...';
    //     break;
    //   default:
    //     message = null;
    // }
  }

  let toastId: string | null = null;
  if (message) {
    toastId = toastService.show('loading', message);
  }

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          if (toastId) toastService.dismiss(toastId);

          if (req.method !== 'GET') {
            toastService.show('success', 'Action completed successfully!', {
              autoCloseMs: 3000,
            });
          }
        }
      },

      error: (error: HttpErrorResponse) => {
        if (toastId) toastService.dismiss(toastId);

        const errorMsg =
          error.error?.message || 'An unexpected error occurred.';

        toastService.show('error', errorMsg, { autoCloseMs: 4000 });
      },
    }),

    finalize(() => {
      if (toastId) {
        toastService.dismiss(toastId);
      }
    }),
  );
};

// delete(id: string) {
//   return this.ApiService.delete<{ id: string; deleted: boolean }>(`${id}/delete`, {
//     context: new HttpContext().set(LOADING_MESSAGE, 'Deleting server...')
//   }).pipe(
//     tap((res) => {
//       this.serverList.update((servers) => servers.filter((server) => server.id !== res.id));
//     })
//   );
// }
