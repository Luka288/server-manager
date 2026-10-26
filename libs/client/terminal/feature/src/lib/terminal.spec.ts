import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ConsoleService } from '@game-server/client/shared';
import { DashboardStore } from '@game-server/dashboard-data-access';
import { ClientTerminal } from './terminal';

describe('ClientTerminal', () => {
  let component: ClientTerminal;
  let fixture: ComponentFixture<ClientTerminal>;
  let sendSpy: jest.Mock;

  beforeEach(async () => {
    sendSpy = jest.fn();

    await TestBed.configureTestingModule({
      imports: [ClientTerminal],
      providers: [
        {
          provide: ConsoleService,
          useValue: {
            send: sendSpy,
            watch: jest.fn(),
            stopWatching: jest.fn(),
            linesRecord: signal({}),
          },
        },
        {
          provide: DashboardStore,
          useValue: {
            servers: signal([]),
            busyIds: signal([]),
            load: jest.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ id: 'server-1' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientTerminal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sends the normalized command, including the slash prefix', () => {
    component.terminalModel.set({ command: 'help' });

    component.onSubmit();

    expect(sendSpy).toHaveBeenCalledWith('/help');
    expect(component.terminalModel().command).toBe('');
  });
});
