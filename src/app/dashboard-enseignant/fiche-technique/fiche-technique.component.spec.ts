import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FicheTechniqueComponent } from './fiche-technique.component';

describe('FicheTechniqueComponent', () => {
  let component: FicheTechniqueComponent;
  let fixture: ComponentFixture<FicheTechniqueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FicheTechniqueComponent]
    });
    fixture = TestBed.createComponent(FicheTechniqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
