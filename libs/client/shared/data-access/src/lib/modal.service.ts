import { inject, Service } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { firstValueFrom } from 'rxjs';

@Service()
export class ModalService {
  private readonly dialog = inject(MatDialog);

  open<TResult>(component: ComponentType<unknown>, config?: MatDialogConfig) {
    return firstValueFrom(
      this.dialog.open(component, { width: '500px', ...config }).afterClosed(),
    ) as Promise<TResult | undefined>;
  }
}
