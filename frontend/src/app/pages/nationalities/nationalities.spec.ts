import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Nationalities } from './nationalities';

describe('Nationalities', () => {
  let component: Nationalities;
  let fixture: ComponentFixture<Nationalities>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nationalities],
    }).compileComponents();

    fixture = TestBed.createComponent(Nationalities);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
