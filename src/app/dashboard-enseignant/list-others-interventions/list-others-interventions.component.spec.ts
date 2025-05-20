import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListOthersInterventionsComponent } from './list-others-interventions.component';

describe('ListOthersInterventionsComponent', () => {
  let component: ListOthersInterventionsComponent;
  let fixture: ComponentFixture<ListOthersInterventionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListOthersInterventionsComponent]
    });
    fixture = TestBed.createComponent(ListOthersInterventionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
