import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export enum TextType {
  WARN = 'WARN',
  SUCCESS = 'SUCCESS',
}

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText?: string;
  refuseText?: string;
  textClass?: TextType;
}

@Component({
  selector: 'lib-confirmation-modal',
  imports: [],
  templateUrl: './confirmationModal.html',
  styleUrl: './confirmationModal.scss',
})
export class ConfirmationModal implements OnInit, OnDestroy {
  readonly data = inject<ConfirmModalData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef);

  readonly disabled = computed(() => this.secondsLeft() > 0);
  readonly secondsLeft = signal(3);
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.secondsLeft.update((s) => s - 1);
      if (this.secondsLeft() <= 0) clearInterval(this.intervalId);
    }, 1000);
  }

  ngOnDestroy(): void {
    clearTimeout(this.intervalId);
  }

  refuse(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
