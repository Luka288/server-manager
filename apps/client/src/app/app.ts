import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidepanel } from '@game-server/sidepanel/feature';
import { SocketService } from '@game-server/client/shared';

@Component({
  imports: [RouterModule, Sidepanel],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly socketService = inject(SocketService);

  ngOnInit(): void {
    this.socketService.connect();
  }
}
