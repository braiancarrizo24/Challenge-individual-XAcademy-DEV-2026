import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Comparisons } from './comparisons';

describe('Comparisons', () => {
  let component: Comparisons;
  let fixture: ComponentFixture<Comparisons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Comparisons],
    }).compileComponents();

    fixture = TestBed.createComponent(Comparisons);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
