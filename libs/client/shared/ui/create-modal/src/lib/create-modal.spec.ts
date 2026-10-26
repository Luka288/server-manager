import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { FolderService, VersionsService } from '@game-server/client/shared';
import { CreateModal } from './create-modal';

describe('CreateModal', () => {
  let component: CreateModal;
  let fixture: ComponentFixture<CreateModal>;
  let closeSpy: jest.Mock;

  beforeEach(async () => {
    closeSpy = jest.fn();

    await TestBed.configureTestingModule({
      imports: [CreateModal],
      providers: [
        {
          provide: VersionsService,
          useValue: { getServerVersions: jest.fn(() => of(['1.21'])) },
        },
        {
          provide: FolderService,
          useValue: { selectPath: jest.fn(() => of({ path: 'C:\\servers' })) },
        },
        { provide: MatDialogRef, useValue: { close: closeSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('includes the selected server type when submitting', () => {
    component.serverFormModel.set({
      name: 'Fabric server',
      memoryMb: 4096,
      type: 'fabric',
      version: '1.21',
      gamemode: 'survival',
      difficulty: 'normal',
      maxPlayers: '20',
      pvp: 'true',
      whitelist: 'false',
      onlineMode: false,
      worldSeed: '',
      serverDirectory: 'C:\\servers',
    });

    component.onSubmit();

    expect(closeSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'fabric', version: '1.21' }),
    );
  });
});
