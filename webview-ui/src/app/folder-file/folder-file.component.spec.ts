import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolderFileComponent } from './folder-file.component';

describe('FolderFileComponent', () => {
  let component: FolderFileComponent;
  let fixture: ComponentFixture<FolderFileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FolderFileComponent]
    });
    fixture = TestBed.createComponent(FolderFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
