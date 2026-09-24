import { Component, inject, model, signal } from '@angular/core';
import { CreateServerForm } from '@game-server/client/types';
import { MatDialogRef } from '@angular/material/dialog';
import { form, FormField, required } from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Dropdown } from '@game-server/client/shared/ui/dropdown';
import { FolderService, VersionsService } from '@game-server/client/shared';
import { tap } from 'rxjs';

@Component({
  selector: 'app-client-create-modal',
  imports: [ReactiveFormsModule, FormsModule, FormField, Dropdown],
  templateUrl: './create-modal.html',
  styleUrl: './create-modal.scss',
})
export class CreateModal {
  private readonly versionsService = inject(VersionsService);
  private readonly folderService = inject(FolderService);
  private readonly dialog = inject(MatDialogRef);

  readonly serverFormModel = signal<CreateServerForm>({
    name: '', // done
    memoryMb: 4096, // done
    version: '', // done
    gamemode: 'survival', // done
    difficulty: 'normal', // done
    maxPlayers: '20', // done
    pvp: 'true', // done
    whitelist: 'false', //done
    onlineMode: false, // allows none official minecraft users to join server (can be changed by user)
    worldSeed: '', // done
    serverDirectory: '',
  });

  readonly serverForm = form(this.serverFormModel, (path) => {
    required(path.version);
    required(path.name);
    required(path.serverDirectory);
  });

  // must move as export consts
  readonly gamemodeOptions = ['survival', 'creative', 'adventure', 'spectator'];
  readonly maxPlayersOptions = ['5', '10', '20', '50', '100'];
  readonly booleans = [true, false];

  // must be changed to gameVersions signal to avoid spamming requests
  readonly gameVersions = toSignal(this.versionsService.getServerVersions(), {
    initialValue: [],
  });

  close() {
    this.dialog.close();
  }

  onSubmit(): void {
    if (!this.serverForm().valid()) {
      return;
    }

    this.dialog.close(this.serverFormModel());
  }

  locatePath() {
    this.folderService
      .selectPath()
      .pipe(
        tap((result) => {
          this.serverFormModel.update((model) => ({
            ...model,
            serverDirectory: result.path,
          }));
        }),
      )
      .subscribe();
  }
}
