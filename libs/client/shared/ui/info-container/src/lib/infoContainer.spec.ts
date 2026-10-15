import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InfoContainer } from './infoContainer';

describe('InfoContainer', () => {
  let component: InfoContainer;
  let fixture: ComponentFixture<InfoContainer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoContainer],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoContainer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
