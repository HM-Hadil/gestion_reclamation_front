import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponasbleListInterventionsComponent } from './responasble-list-interventions.component';

describe('ResponasbleListInterventionsComponent', () => {
  let component: ResponasbleListInterventionsComponent;
  let fixture: ComponentFixture<ResponasbleListInterventionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResponasbleListInterventionsComponent]
    });
    fixture = TestBed.createComponent(ResponasbleListInterventionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
