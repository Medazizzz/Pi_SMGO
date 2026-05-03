import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenewalStatus } from './renewal-status.component';

describe('RenewalStatus', () => {
  let component: RenewalStatus;
  let fixture: ComponentFixture<RenewalStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenewalStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenewalStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
