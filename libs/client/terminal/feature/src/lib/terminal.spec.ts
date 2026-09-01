import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientTerminal } from './terminal';

describe('ClientTerminal', () => {
  let component: ClientTerminal;
  let fixture: ComponentFixture<ClientTerminal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientTerminal],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientTerminal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
