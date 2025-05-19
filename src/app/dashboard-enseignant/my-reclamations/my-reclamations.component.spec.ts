import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyReclamationsComponent } from './my-reclamations.component';

describe('MyReclamationsComponent', () => {
  let component: MyReclamationsComponent;
  let fixture: ComponentFixture<MyReclamationsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyReclamationsComponent]
    });
    fixture = TestBed.createComponent(MyReclamationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
