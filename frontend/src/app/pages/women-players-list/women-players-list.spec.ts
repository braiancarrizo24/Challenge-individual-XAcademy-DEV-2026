import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WomenPlayersList } from './women-players-list';

describe('WomenPlayersList', () => {
  let component: WomenPlayersList;
  let fixture: ComponentFixture<WomenPlayersList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WomenPlayersList],
    }).compileComponents();

    fixture = TestBed.createComponent(WomenPlayersList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
