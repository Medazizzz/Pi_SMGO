import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminContentComponent } from './admin-content.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

describe('AdminContentComponent', () => {
  let component: AdminContentComponent;
  let fixture: ComponentFixture<AdminContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminContentComponent, CommonModule, ReactiveFormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminContentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
