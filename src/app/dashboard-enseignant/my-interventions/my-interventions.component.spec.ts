import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyInterventionsComponent } from './my-interventions.component';

describe('MyInterventionsComponent', () => {
  let component: MyInterventionsComponent;
  let fixture: ComponentFixture<MyInterventionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyInterventionsComponent]
    });
    fixture = TestBed.createComponent(MyInterventionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
