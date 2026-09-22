import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserPortalComponent } from './user-portal.component';

describe('UserPortalComponent', () => {
  let component: UserPortalComponent;
  let fixture: ComponentFixture<UserPortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPortalComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(UserPortalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
