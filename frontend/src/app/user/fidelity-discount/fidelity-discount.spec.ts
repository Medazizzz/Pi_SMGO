import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FidelityDiscount } from './fidelity-discount';

describe('FidelityDiscount', () => {
  let component: FidelityDiscount;
  let fixture: ComponentFixture<FidelityDiscount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FidelityDiscount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FidelityDiscount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
