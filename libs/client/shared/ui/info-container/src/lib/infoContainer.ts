import { Component, inject, input, signal } from '@angular/core';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { MatDialogRef } from '@angular/material/dialog';

export interface InfoModalData {
  title: string;
  rows?: { label: string; value: string | number; copyable?: boolean }[];
  note?: string;
  closeText?: string;
}

@Component({
  selector: 'app-info-container',
  imports: [],
  templateUrl: './infoContainer.html',
  styleUrl: './infoContainer.scss',
})
export class InfoContainer {
  private readonly dialogRef = inject(MatDialogRef);
  readonly ModalData = inject(DIALOG_DATA);

  readonly copiedKey = signal<string | null>(null);
  private copyTimer?: ReturnType<typeof setTimeout>;

  async copy(row: { label: string; value: string | number }) {
    try {
      await navigator.clipboard.writeText(String(row.value));
    } catch {
      return;
    }

    this.copiedKey.set(row.label);

    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copiedKey.set(null), 2000);
  }

  close(): void {
    this.dialogRef.close();
  }
}
