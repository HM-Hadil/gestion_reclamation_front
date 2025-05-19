import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEquipementComponent } from './create-equipement.component';

describe('CreateEquipementComponent', () => {
  let component: CreateEquipementComponent;
  let fixture: ComponentFixture<CreateEquipementComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateEquipementComponent]
    });
    fixture = TestBed.createComponent(CreateEquipementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
