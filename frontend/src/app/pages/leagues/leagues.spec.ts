import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Leagues } from './leagues';

describe('Leagues', () => {
  let component: Leagues;
  let fixture: ComponentFixture<Leagues>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Leagues],
    }).compileComponents();

    fixture = TestBed.createComponent(Leagues);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
