import { Service, signal } from '@angular/core';

@Service()
export class StateService {
  readonly serverCreationState = signal<boolean>(false);
}
