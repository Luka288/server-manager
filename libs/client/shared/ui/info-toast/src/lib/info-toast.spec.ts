import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoToast } from './info-toast';

describe('InfoToast', () => {
  let component: InfoToast;
  let fixture: ComponentFixture<InfoToast>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoToast],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoToast);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
