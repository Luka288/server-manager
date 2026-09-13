import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidepanel } from '@game-server/sidepanel/feature';
import { SocketService, StateService } from '@game-server/client/shared';
import { InfoToast } from '@game-server/client/shared/ui/info-toast';

@Component({
  imports: [RouterModule, Sidepanel, InfoToast],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly socketService = inject(SocketService);
  readonly stateService = inject(StateService);

  ngOnInit(): void {
    this.socketService.connect();
  }
}
