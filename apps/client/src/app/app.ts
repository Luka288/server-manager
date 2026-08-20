import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidepanel } from '@game-server/sidepanel/feature';

@Component({
  imports: [RouterModule, Sidepanel],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
