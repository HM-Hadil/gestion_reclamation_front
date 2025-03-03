import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashbordTechComponent } from './dashbord-tech.component';

describe('DashbordTechComponent', () => {
  let component: DashbordTechComponent;
  let fixture: ComponentFixture<DashbordTechComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DashbordTechComponent]
    });
    fixture = TestBed.createComponent(DashbordTechComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
