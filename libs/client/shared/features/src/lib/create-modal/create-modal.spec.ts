import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientCreateModal } from './create-modal';

describe('ClientCreateModal', () => {
  let component: ClientCreateModal;
  let fixture: ComponentFixture<ClientCreateModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientCreateModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ClientCreateModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
