import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponasbleListReclamationsComponent } from './responasble-list-reclamations.component';

describe('ResponasbleListReclamationsComponent', () => {
  let component: ResponasbleListReclamationsComponent;
  let fixture: ComponentFixture<ResponasbleListReclamationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResponasbleListReclamationsComponent]
    });
    fixture = TestBed.createComponent(ResponasbleListReclamationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
