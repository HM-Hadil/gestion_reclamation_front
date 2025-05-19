import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListReclamationsAdminComponent } from './list-reclamations-admin.component';

describe('ListReclamationsAdminComponent', () => {
  let component: ListReclamationsAdminComponent;
  let fixture: ComponentFixture<ListReclamationsAdminComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ListReclamationsAdminComponent]
    });
    fixture = TestBed.createComponent(ListReclamationsAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
