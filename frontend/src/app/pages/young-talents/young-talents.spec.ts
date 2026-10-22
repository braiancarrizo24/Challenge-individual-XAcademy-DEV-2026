import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YoungTalents } from './young-talents';

describe('YoungTalents', () => {
  let component: YoungTalents;
  let fixture: ComponentFixture<YoungTalents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YoungTalents],
    }).compileComponents();

    fixture = TestBed.createComponent(YoungTalents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
