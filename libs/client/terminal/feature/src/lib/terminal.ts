import { Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'lib-client-terminal',
  imports: [FormField],
  templateUrl: './terminal.html',
  styleUrl: './terminal.scss',
})
export class ClientTerminal {
  readonly terminalModel = signal({ command: '' });

  readonly terminalForm = form(this.terminalModel, (path) => {
    required(path.command, { message: 'Command is empty' });
  });

  onSubmit(): void {
    if (this.terminalForm().valid()) {
      this.terminalModel.update((m) => ({ ...m, command: '' }));
    }
  }
}
