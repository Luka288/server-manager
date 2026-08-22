import { Component } from '@angular/core';
import { sidepanelNavigation } from '@game-server/client/sidepanel/types';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'lib-sidepanel',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidepanel.html',
  styleUrl: './sidepanel.scss',
})
export class Sidepanel {
  readonly navigation = sidepanelNavigation;
}
