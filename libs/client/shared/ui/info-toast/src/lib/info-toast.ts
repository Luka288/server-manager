import { Component, inject } from '@angular/core';
import { ToastService } from '@game-server/client/shared';

@Component({
  selector: 'app-info-toast',
  imports: [],
  templateUrl: './info-toast.html',
  styleUrl: './info-toast.scss',
})
export class InfoToast {
  readonly toastService = inject(ToastService);
}
