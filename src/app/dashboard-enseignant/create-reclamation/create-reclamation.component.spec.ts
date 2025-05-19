import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateReclamationComponent } from './create-reclamation.component';

describe('CreateReclamationComponent', () => {
  let component: CreateReclamationComponent;
  let fixture: ComponentFixture<CreateReclamationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreateReclamationComponent]
    });
    fixture = TestBed.createComponent(CreateReclamationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
