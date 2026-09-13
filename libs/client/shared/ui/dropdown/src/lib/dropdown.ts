import { Component, effect, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Field, form, FormField, required } from '@angular/forms/signals';

@Component({
  selector: 'lib-dropdown',
  imports: [FormsModule, ReactiveFormsModule, FormField],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss',
})
export class Dropdown {
  label = input<string>();
  id = input<string>();
  FormField = input.required<Field<string>>();
  options = input<string[]>();

  constructor() {
    effect(() => {
      const opts = this.options();
      const field = this.FormField();

      if (opts && opts.length > 0 && !field().value()) {
        const firstValue = String(opts[0]);
        field().value.set(firstValue);
      }
    });
  }
}
