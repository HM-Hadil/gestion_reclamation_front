import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponasbleStatistiqueComponent } from './responasble-statistique.component';

describe('ResponasbleStatistiqueComponent', () => {
  let component: ResponasbleStatistiqueComponent;
  let fixture: ComponentFixture<ResponasbleStatistiqueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResponasbleStatistiqueComponent]
    });
    fixture = TestBed.createComponent(ResponasbleStatistiqueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
